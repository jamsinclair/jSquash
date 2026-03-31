import init, { decode, decodeAnimated, isAnimated } from '../../packages/gif/codec/pkg/squoosh_gif.js';

const statusEl = document.getElementById('status');
const singleSection = document.getElementById('single-frame-section');
const animSection = document.getElementById('animation-section');
const singleCanvas = document.getElementById('single-canvas');
const animCanvas = document.getElementById('anim-canvas');
const singleInfo = document.getElementById('single-info');
const frameInfo = document.getElementById('frame-info');
const playBtn = document.getElementById('play-btn');
const filmstrip = document.getElementById('filmstrip');
const dropZone = document.getElementById('drop-zone');
const fileInput = dropZone.querySelector('input[type="file"]');

let animationId = null;
let playing = false;
let currentFrameIndex = 0;
let initialized = false;

function setStatus(msg, isError = false) {
  statusEl.style.display = 'block';
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', isError);
}

function drawImageData(canvas, imageData) {
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
}

function highlightFilmstripFrame(index) {
  filmstrip.querySelectorAll('.filmstrip-frame').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
}

function playAnimation(canvas, frames) {
  playing = true;
  playBtn.textContent = 'Pause';

  function renderFrame() {
    const frame = frames[currentFrameIndex];
    drawImageData(canvas, frame.imageData);
    frameInfo.textContent = `Frame ${currentFrameIndex + 1} / ${frames.length} \u2014 ${frame.duration}ms`;
    highlightFilmstripFrame(currentFrameIndex);
    currentFrameIndex = (currentFrameIndex + 1) % frames.length;
    animationId = setTimeout(renderFrame, frame.duration);
  }

  renderFrame();
}

function stopAnimation() {
  if (animationId !== null) {
    clearTimeout(animationId);
    animationId = null;
  }
  playing = false;
  playBtn.textContent = 'Play';
}

function buildFilmstrip(frames) {
  filmstrip.innerHTML = '';
  const thumbHeight = 80;

  frames.forEach((frame, i) => {
    const aspect = frame.imageData.width / frame.imageData.height;
    const thumbWidth = Math.round(thumbHeight * aspect);

    const wrapper = document.createElement('div');
    wrapper.className = 'filmstrip-frame';

    const canvas = document.createElement('canvas');
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;
    const ctx = canvas.getContext('2d');

    // Draw scaled-down frame
    const tmp = document.createElement('canvas');
    tmp.width = frame.imageData.width;
    tmp.height = frame.imageData.height;
    tmp.getContext('2d').putImageData(frame.imageData, 0, 0);
    ctx.drawImage(tmp, 0, 0, thumbWidth, thumbHeight);

    const label = document.createElement('div');
    label.className = 'frame-label';
    label.textContent = `#${i + 1} ${frame.duration}ms`;

    wrapper.appendChild(canvas);
    wrapper.appendChild(label);

    wrapper.addEventListener('click', () => {
      stopAnimation();
      currentFrameIndex = i;
      drawImageData(animCanvas, frame.imageData);
      frameInfo.textContent = `Frame ${i + 1} / ${frames.length} \u2014 ${frame.duration}ms`;
      highlightFilmstripFrame(i);
    });

    filmstrip.appendChild(wrapper);
  });
}

playBtn.addEventListener('click', () => {
  if (playing) {
    stopAnimation();
  } else if (playBtn._frames) {
    playAnimation(animCanvas, playBtn._frames);
  }
});

async function handleFile(file) {
  if (!file || !file.type.startsWith('image/gif')) return;

  stopAnimation();
  currentFrameIndex = 0;
  singleSection.hidden = true;
  animSection.hidden = true;
  filmstrip.innerHTML = '';

  if (!initialized) {
    setStatus('Initializing WASM...');
    await init();
    initialized = true;
  }

  setStatus('Decoding...');

  try {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    // Single frame decode
    const t0 = performance.now();
    const imageData = decode(data);
    const decodeTime = (performance.now() - t0).toFixed(1);
    drawImageData(singleCanvas, imageData);
    singleInfo.textContent = `${imageData.width} \u00d7 ${imageData.height} \u2014 decoded in ${decodeTime}ms`;
    singleSection.hidden = false;

    // Check if animated
    const animated = isAnimated(data);

    if (animated) {
      const t1 = performance.now();
      const frames = decodeAnimated(data);
      const animTime = (performance.now() - t1).toFixed(1);
      setStatus(`Animated GIF: ${frames.length} frames, ${imageData.width}\u00d7${imageData.height} \u2014 decoded in ${animTime}ms`);
      playBtn._frames = frames;
      buildFilmstrip(frames);
      playAnimation(animCanvas, frames);
      animSection.hidden = false;
    } else {
      setStatus(`Static GIF: ${imageData.width}\u00d7${imageData.height} \u2014 decoded in ${decodeTime}ms`);
    }
  } catch (err) {
    setStatus(`Error: ${err.message}`, true);
    console.error(err);
  }
}

// File input
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

// Drag and drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});
