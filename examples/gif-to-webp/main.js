import gifInit, {
  decodeAnimated as gifDecodeAnimated,
  decode as gifDecode,
  isAnimated as gifIsAnimated,
} from '../../packages/gif/codec/pkg/squoosh_gif.js';

import webpEncInit from '../../packages/webp/codec/enc/webp_enc.js';

const dropZone = document.getElementById('drop-zone');
const fileInput = dropZone.querySelector('input[type="file"]');
const statusEl = document.getElementById('status');
const optionsEl = document.getElementById('options');
const convertBtn = document.getElementById('convert-btn');
const comparison = document.getElementById('comparison');
const gifPreview = document.getElementById('gif-preview');
const webpPreview = document.getElementById('webp-preview');
const gifMeta = document.getElementById('gif-meta');
const webpMeta = document.getElementById('webp-meta');
const downloadBtn = document.getElementById('download-btn');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('quality-value');
const methodInput = document.getElementById('method');
const methodValue = document.getElementById('method-value');

let gifBuffer = null;
let gifFileName = '';
let gifInitialized = false;
let webpModule = null;

function setStatus(msg, type = 'info') {
  statusEl.style.display = 'block';
  statusEl.textContent = msg;
  statusEl.className = type === 'error' ? 'error' : type === 'success' ? 'success' : '';
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

qualityInput.addEventListener('input', () => { qualityValue.textContent = qualityInput.value; });
methodInput.addEventListener('input', () => { methodValue.textContent = methodInput.value; });

async function initGif() {
  if (!gifInitialized) {
    await gifInit();
    gifInitialized = true;
  }
}

async function initWebpEnc() {
  if (!webpModule) {
    webpModule = await webpEncInit({ noInitialRun: true });
  }
  return webpModule;
}

async function handleFile(file) {
  if (!file) return;

  gifBuffer = await file.arrayBuffer();
  gifFileName = file.name.replace(/\.gif$/i, '');
  comparison.style.display = 'none';
  downloadBtn.style.display = 'none';

  // Show GIF preview using native <img>
  const gifUrl = URL.createObjectURL(file);
  gifPreview.src = gifUrl;

  setStatus('Initializing WASM decoders...');
  await initGif();

  const data = new Uint8Array(gifBuffer);
  const animated = gifIsAnimated(data);
  const frames = animated ? gifDecodeAnimated(data) : null;
  const frameCount = frames ? frames.length : 1;

  gifMeta.textContent = `${formatBytes(gifBuffer.byteLength)} \u2014 ${frameCount} frame${frameCount > 1 ? 's' : ''}`;

  optionsEl.style.display = 'block';
  convertBtn.disabled = false;
  setStatus(`GIF loaded: ${frameCount} frame${frameCount > 1 ? 's' : ''}. Adjust options and click Convert.`);
}

convertBtn.addEventListener('click', async () => {
  if (!gifBuffer) return;
  convertBtn.disabled = true;

  try {
    setStatus('Initializing WebP encoder...');
    const module = await initWebpEnc();

    setStatus('Decoding GIF frames...');
    const data = new Uint8Array(gifBuffer);
    const animated = gifIsAnimated(data);

    const quality = parseInt(qualityInput.value);
    const method = parseInt(methodInput.value);

    // Build default options matching packages/webp/meta.ts
    const encodeOptions = {
      quality,
      target_size: 0,
      target_PSNR: 0,
      method,
      sns_strength: 50,
      filter_strength: 60,
      filter_sharpness: 0,
      filter_type: 1,
      partitions: 0,
      segments: 4,
      pass: 1,
      show_compressed: 0,
      preprocessing: 0,
      autofilter: 0,
      partition_limit: 0,
      alpha_compression: 1,
      alpha_filtering: 1,
      alpha_quality: 100,
      lossless: 0,
      exact: 0,
      image_hint: 0,
      emulate_jpeg_size: 0,
      thread_level: 0,
      low_memory: 0,
      near_lossless: 100,
      use_delta_palette: 0,
      use_sharp_yuv: 0,
    };

    let result;
    const t0 = performance.now();

    if (animated) {
      const frames = gifDecodeAnimated(data);
      setStatus(`Encoding ${frames.length} frames to animated WebP...`);
      result = module.encodeAnimated(frames, encodeOptions);
    } else {
      const imageData = gifDecode(data);
      setStatus('Encoding to WebP...');
      result = module.encode(imageData.data, imageData.width, imageData.height, encodeOptions);
    }

    const elapsed = (performance.now() - t0).toFixed(0);

    if (!result) throw new Error('WebP encoding failed');

    const webpBlob = new Blob([result], { type: 'image/webp' });
    const webpUrl = URL.createObjectURL(webpBlob);
    webpPreview.src = webpUrl;

    const ratio = ((1 - result.byteLength / gifBuffer.byteLength) * 100).toFixed(1);
    const sign = ratio >= 0 ? 'smaller' : 'larger';
    webpMeta.textContent = `${formatBytes(result.byteLength)} \u2014 ${Math.abs(ratio)}% ${sign} \u2014 encoded in ${elapsed}ms`;

    downloadBtn.href = webpUrl;
    downloadBtn.download = `${gifFileName}.webp`;
    downloadBtn.style.display = 'inline-block';

    comparison.style.display = '';
    setStatus(`Done! Converted in ${elapsed}ms.`, 'success');
  } catch (err) {
    setStatus(`Error: ${err.message}`, 'error');
    console.error(err);
  } finally {
    convertBtn.disabled = false;
  }
});

// File input
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

// Drag and drop
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
