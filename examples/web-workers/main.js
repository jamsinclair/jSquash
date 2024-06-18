async function convert(sourceType, outputType, fileBuffer) {
  const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  // Send data to the worker to convert to the desired output type
  worker.postMessage({ sourceType, outputType, fileBuffer });

  return new Promise((resolve, reject) => {
    worker.addEventListener('message', (event) => {
      // The event data will contain the converted image from the worker
      resolve(event.data);
    });
    worker.addEventListener('error', reject);
  }); 
}

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function showOutput (imageBuffer, outputType) {
  const preview = document.querySelector('#preview');
  const imageBlob = new Blob([imageBuffer], { type: `image/${outputType}` });
  const base64String = await blobToBase64(imageBlob);
  const previewImg = document.createElement('img');
  previewImg.src = base64String;
  preview.innerHTML = '';
  preview.appendChild(previewImg);
}

async function initForm () {
  const form = document.querySelector('form');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const file = formData.get('file');
    const sourceType = file.name.endsWith('jxl') ? 'jxl' : file.type.replace('image/', '');
    const outputType = formData.get('outputType');
    const fileBuffer = await file.arrayBuffer();
    const imageBuffer = await convert(sourceType, outputType, fileBuffer);
    showOutput(imageBuffer, outputType);
  });
}

async function main () {
  initForm();
}

main();
