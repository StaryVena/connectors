'use strict'

const logger = require('./logger');
const sharp = require("sharp");
const chokidar = require('chokidar');
const fs = require('fs').promises;
const fsa = require('fs');
const path = require('path');

const black = "#000000";
const white = "#FFFFFF";
const supportedExtension = ['png', 'json']
const defaultColors = [black, white];

const commonDirName = "_common";
const imagesRootDir = "./images/"
const dirsList = { connectorList: [], commonList: [] };

const cache = process.env.CONNECTORS_IMAGE_CACHE_MB;

// Watch file system for changes
chokidar.watch(imagesRootDir).on('all', (event, dir) => {
  console.log(event, dir);
  let commonPath = path.join(imagesRootDir, commonDirName);
  let commonImagesFiles = fsa.readdirSync(commonPath)
  dirsList.commonList = commonImagesFiles.map(x => {
    return x.replace('.png', '');
  });
  dirsList.connectorList = fsa.readdirSync(imagesRootDir).filter(val => val !== commonDirName);
});



if (cache) {
  logger.info(`Setting sharm cache memory limit to ${cache} MB.`)
  sharp.cache({ memory: cache });
}

// TODO documentation
// TODO check input - connector does not exists, wrong extension
// TODO unit tests
// TODO add support for more extensions/image formats
// TODO docker container

exports.view = function (req, res, next) {
  try {
    if(!dirsList.connectorList.includes(req.params.name)){
      throw new Error(`Connector ${req.params.name} not supported, please use one of ${dirsList.connectorList}`);
    }
    const imagesDir = `${imagesRootDir}${req.params.name}/`;
    const imageNames = fsa.readdirSync(imagesDir);
    if(!supportedExtension.includes(req.params.ext)){
      throw new Error(`Extension ${req.params.ext} is not supported. Only ${supportedExtension} are supported.`);
    }
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

    let hexColors = imageNames.map(filename => (Object.hasOwn(req.query, path.parse(filename).name) ? '#' + req.query[path.parse(filename).name] : black));
    if (Object.keys(req.query).length == 0) {
      hexColors = hexColors.map((color, index) => defaultColors[index % 2]);
    }
    // Check common images
    for (const property in req.query) {
      if (dirsList.commonList.includes(property)) {
        imagePaths.push(path.join(imagesRootDir, commonDirName, property + ".png"));
        hexColors.push(req.query[property]);
      }
    }
    const colorsRgb = hexColors.map(hex => hexToRgb(hex));
    compositeImages(imagePaths, colorsRgb, extension, colorBg, next)
      .then(finalImageBuffer => {
        res.header("Content-Type", mimeType).type(extension).send(finalImageBuffer);
      })
      .catch(next);
  } catch (err) {
    next(err);
  }
}


exports.list = function (req, res, next) {
  try {
    if (req.params.ext != "json") {
      throw new Error(`Unsupported extension: ${req.params.ext}. Only json is supported.`);
    }
    let output = {
      connectors: dirsList.connectorList,
      special: dirsList.commonList,
    };
    res.header("Content-Type", "application/json").send(output);
  } catch (err) {
    next(err);
  }

}

exports.layer = function (req, res, next) {
  try {
    const image_path = path.join(imagesRootDir, req.params.name, req.params.layer + ".png");

    let img = sharp(image_path);
    if (req.params.ext === "jpg" || req.params.ext === "jpeg") {
      img.flatten({ background: { r: 255, g: 255, b: 255, alpha: 255 } });
    }
    img
      .toFormat(req.params.ext)
      .toBuffer()
      .then(data => res.header("Content-Type", `application/${req.params.ext}`).type(req.params.ext).send(data)).catch(next);
  } catch (next) {
    next(err);
  }
}

async function compositeImages(imagePaths, rgbColors, extension, background, next) {
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
              background: rgbColors[index]
            }
          })
            .toFormat(extension)
            .joinChannel(data)
            .toBuffer().catch(next);
        }).catch(next)
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
  if (!result) {
    throw new Error(`Color "${hex}" is not supported. Please use hex RGB format without leading # like "00FF99".`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}
