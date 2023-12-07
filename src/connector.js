'use strict'

const logger = require('./logger');
const sharp = require("sharp");
const fs = require('fs').promises;
const fsa = require('fs');
const path = require('path');

const black = "#000000";
const white = "#FFFFFF";
const defaultColors = [black, white];

const commonDir = "_common";
const imagesRootDir = "./images/"

const common_images_files = fsa.readdirSync(path.join(imagesRootDir, commonDir))
const common_images = common_images_files.map(x => {
  return x.replace('.png', '');
});
const connectorList = fsa.readdirSync(imagesRootDir).filter(val => val !== commonDir);

const cache = process.env.CONNECTORS_IMAGE_CACHE_MB;

if(cache){
  logger.info(`Setting sharm cache memory limit to ${cache} MB.`)
  sharp.cache( { memory: cache } );
}


// TODO documentation
// TODO check input - connector does not exists, wrong extension
// TODO error handling
// TODO unit tests
// TODO separate method for file handling
// TODO add support for more extensions
// TODO add image directory wather for realoding images - https://github.com/paulmillr/chokidar

exports.view = function (req, res) {

  const imagesDir = `${imagesRootDir}${req.params.name}/`;
  const imageNames = fsa.readdirSync(imagesDir)
  const extension = req.params.ext || 'png';
  if (extension === "json") {
    res.header("Content-Type", "application/json").send(
      {
        name: req.params.name,
        layers: imageNames.map(x => { return x.replace('.png', ''); }),
      });
    return;
  }
  const imagePaths = imageNames.map(name => path.join(imagesDir, name))
  let colorBg = { r: 0, g: 0, b: 0, alpha: 0 };
  if (Object.hasOwn(req.query, 'bg')) {
    colorBg = hexToRgb(req.query.bg);
    colorBg.alpha = 1;
  }
  const mimeType = `image/${extension.replace("jpg", "jpeg")}`;

  let colors = imageNames.map(filename => (Object.hasOwn(req.query, path.parse(filename).name) ? '#' + req.query[path.parse(filename).name] : black));
  if (Object.keys(req.query).length == 0) {
    colors = colors.map((color, index) => defaultColors[index % 2]);
  }
  // Check common images
  for (const property in req.query) {
    if (common_images.includes(property)) {
      imagePaths.push(path.join(imagesRootDir, commonDir, property + ".png"));
      colors.push(req.query[property]);
    }
  }

  compositeImages(imagePaths, colors, extension, colorBg)
    .then(finalImageBuffer => {
      res.header("Content-Type", mimeType).type(extension).send(finalImageBuffer);
    })
    .catch(error => {
      console.error("Error:", error);
    });
}


exports.list = function (req, res) {
  if (req.params.ext != "json") {
    // TODO throw error
  }
  let output = {
    connectors: connectorList,
    special: common_images,
  };
  res.header("Content-Type", "application/json").send(output);
}

exports.layer = function (req, res) {
  const image_path = path.join(imagesRootDir, req.params.name, req.params.layer + ".png");

  let img = sharp(image_path);
  if(req.params.ext === "jpg" || req.params.ext === "jpeg"){
    img.flatten({ background: { r: 255, g: 255, b: 255, alpha: 255 } });
  }
  img
    .toFormat(req.params.ext)
    .toBuffer()
    .then(data => res.header("Content-Type", `application/${req.params.ext}`).type(req.params.ext).send(data))
    ;
}

async function compositeImages(imagePaths, hexColors, extension, background) {
  try {
    let width = 0;
    let height = 0;
    // Process each image
    const processedImageBuffers = await Promise.all(imagePaths.map(async (imagePath, index) =>
      // exctract alpha channel
      await sharp(imagePath)
        .extractChannel(3)
        .toBuffer({ resolveWithObject: true })
        .then(async ({ data, info }) => {
          width = info.width;
          height = info.height;
          // create new image with given bacground color and extracted aplha channel
          return sharp({
            create: {
              width: info.width,
              height: info.height,
              channels: 3,
              background: hexToRgb(hexColors[index])
            }
          })
            .toFormat(extension)
            .joinChannel(data)
            .toBuffer();
        })
    ));
    const finalImageBuffer = await sharp({
      create: {
        width: width,
        height: height,
        channels: 4, // 4 channels (RGBA)
        background: background,
      },
    })
      .composite(processedImageBuffers.map(buffer => ({ input: buffer })))
      .toFormat(extension)
      .toBuffer();

    return finalImageBuffer;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
