import * as avif from '@jsquash/avif';
import * as jpeg from '@jsquash/jpeg';
import * as jxl from '@jsquash/jxl';
import * as png from '@jsquash/png';
import * as webp from '@jsquash/webp';

let isConverting = false;

async function decode (sourceType, fileBuffer) {
  switch (sourceType) {
    case 'avif':
      return await avif.decode(fileBuffer);
    case 'jpeg':
      return await jpeg.decode(fileBuffer);
    case 'jxl':
      return await jxl.decode(fileBuffer);
    case 'png':
      return await png.decode(fileBuffer);
    case 'webp':
      return await webp.decode(fileBuffer);
    default:
      throw new Error(`Unknown source type: ${sourceType}`);
  }
}

async function encode (outputType, imageData) {
  switch (outputType) {
    case 'avif':
      return await avif.encode(imageData);
    case 'jpeg':
      return await jpeg.encode(imageData);
    case 'jxl':
      return await jxl.encode(imageData);
    case 'png':
      return await png.encode(imageData);
    case 'webp':
      return await webp.encode(imageData);
    default:
      throw new Error(`Unknown output type: ${outputType}`);
  }
}

async function convert (sourceType, outputType, fileBuffer) {
    const imageData = await decode(sourceType, fileBuffer);
    return encode(outputType, imageData);
}

addEventListener('message', async function (event) {
    const { sourceType, outputType, fileBuffer } = event.data;

    if (isConverting) {
        // Prevent multiple conversion requests being sent to the same worker.
        throw new Error('Conversion task already in progress');
    }

    if (!sourceType || !outputType || !fileBuffer) {
        throw new Error('Inputs sourceType, outputType and fileBuffer were not present in message');
    }

    isConverting = true;
    const result = await convert(sourceType, outputType, fileBuffer);

    // Send the converted image back to the main thread
    postMessage(result);
});
