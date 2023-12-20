const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const connector_api = require('../src/connector'); 

describe('compositeImages', () => {
  test('should composite images', async () => {
    // Mock data for the test
    const imagePaths = ['./images/rj45/l1.png', './images/rj45/l2.png'];
    const hexColors = ['#FFFFFF', '#000000'];
    const extension = 'png';
    const background = { r: 255, g: 255, b: 255, alpha: 255 };
    const width = 200;
    const height = 200;


    const result = await connector_api.compositeImages(imagePaths, hexColors, extension, background);

    expect(result).toBeDefined();
    // Add more expectations based on your implementation and use case
  });
});