// ============================================================
//  ADVANCED CAMERA SPOOF – with Real‑Time Customization Panel
//  (Chrome‑Compatible Version)
// ============================================================

// ---- GLOBAL CONFIGURATION ----
const CONFIG = {
  skinColor: '#f5d0b8',
  skinShadow: '#d4a88a',
  hairColor: '#3d2b1f',
  eyeColor: '#4a6e4a',
  eyeWhite: '#ffffff',
  lipColor: '#8b3a3a',
  tongueColor: '#cc7777',
  faceWidth: 0.45,
  faceHeight: 0.60,
  eyeSize: 1.0,
  mouthSize: 1.0,
  noseSize: 1.0,
  blinkInterval: 2500,
  blinkDuration: 120,
  headMoveInterval: 4000,
  headAmplitude: 10,
  mouthMoveInterval: 3500,
  mouthAmplitude: 0.4,
  background: true,
  bgColor1: '#2c3e50',
  bgColor2: '#1a252f',
  glasses: false,
  addNoise: false,
  noiseIntensity: 15,
  useVideoFallback: false,
  videoUrl: 'face-loop.mp4',
  fps: 30,
};

// ---- SAVE ORIGINAL METHODS ----
const originalEnumerate = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

// ---- OVERRIDE DEVICE LIST ----
navigator.mediaDevices.enumerateDevices = async function () {
  const devices = await originalEnumerate();
  devices.push({
    deviceId: 'hd-virtual-cam-pro',
    kind: 'videoinput',
    label: 'HD Virtual Camera Pro',
    groupId: 'hd-pro-group'
  });
  return devices;
};

// ---- OVERRIDE getUserMedia ----
navigator.mediaDevices.getUserMedia = async function (constraints) {
  if (constraints.video) {
    console.log('[HD Spoof] Intercepted – generating customizable fake stream.');
    return generateFakeStream(constraints);
  }
  return originalGetUserMedia(constraints);
};

// ============================================================
//  FAKE STREAM GENERATOR
// ============================================================

function generateFakeStream(constraints) {
  let width = 640, height = 480;
  if (constraints.video && typeof constraints.video === 'object') {
    if (constraints.video.width) {
      width = typeof constraints.video.width === 'object'
        ? constraints.video.width.ideal || constraints.video.width.max || 640
        : constraints.video.width;
    }
    if (constraints.video.height) {
      height = typeof constraints.video.height === 'object'
        ? constraints.video.height.ideal || constraints.video.height.max || 480
        : constraints.video.height;
    }
  }

  // ---- Video fallback ----
  if (CONFIG.useVideoFallback) {
    const video = document.createElement('video');
    video.src = chrome.runtime.getURL(CONFIG.videoUrl);
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(e => console.warn('Video fallback failed.', e));
    const stream = video.captureStream(CONFIG.fps);
    return addAudioTrack(stream);
  }

  // ---- Canvas-based synthetic face ----
  console.log('[HD Spoof] Using customizable canvas face.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const state = {
    blink: false,
    blinkTimer: CONFIG.blinkInterval,
    blinkStartTime: 0,
    mouthOpen: 0.0,
    mouthTarget: 0.0,
    headX: 0,
    headY: 0,
    headTargetX: 0,
    headTargetY: 0,
    time: 0,
  };

  function random(min, max) { return Math.random() * (max - min) + min; }

  function scheduleBlink() {
    state.blinkTimer = random(CONFIG.blinkInterval * 0.6, CONFIG.blinkInterval * 1.6);
  }
  scheduleBlink();

  function scheduleHeadMove() {
    state.headTargetX = random(-CONFIG.headAmplitude, CONFIG.headAmplitude);
    state.headTargetY = random(-CONFIG.headAmplitude * 0.7, CONFIG.headAmplitude * 0.7);
    setTimeout(scheduleHeadMove, random(CONFIG.headMoveInterval * 0.7, CONFIG.headMoveInterval * 1.3));
  }
  scheduleHeadMove();

  function scheduleMouthMove() {
    state.mouthTarget = random(0, CONFIG.mouthAmplitude);
    setTimeout(scheduleMouthMove, random(CONFIG.mouthMoveInterval * 0.6, CONFIG.mouthMoveInterval * 1.4));
  }
  scheduleMouthMove();

  function drawEye(ctx, x, y, w, h, blink) {
    const eyeW = w * CONFIG.eyeSize;
    const eyeH = h * CONFIG.eyeSize;
    ctx.beginPath();
    ctx.ellipse(x, y, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.eyeWhite;
    ctx.fill();
    ctx.strokeStyle = '#3d2b1f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (!blink) {
      const irisSize = eyeW * 0.5;
      ctx.beginPath();
      ctx.ellipse(x, y, irisSize, irisSize, 0, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.eyeColor;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + eyeW * 0.1, y, irisSize * 0.5, irisSize * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - eyeW * 0.15, y - eyeH * 0.2, irisSize * 0.25, irisSize * 0.25, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - eyeW, y);
      ctx.lineTo(x + eyeW, y);
      ctx.strokeStyle = '#3d2b1f';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  function drawGlasses(ctx, faceW, faceH) {
    const eyeY = -faceH * 0.25;
    const eyeSpacing = faceW * 0.32;
    const eyeW = faceW * 0.2;
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY, eyeW * 0.9, eyeW * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(eyeSpacing, eyeY, eyeW * 0.9, eyeW * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing + eyeW * 0.6, eyeY);
    ctx.lineTo(eyeSpacing - eyeW * 0.6, eyeY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - eyeW * 0.9, eyeY);
    ctx.lineTo(-eyeSpacing - eyeW * 1.4, eyeY - eyeW * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeSpacing + eyeW * 0.9, eyeY);
    ctx.lineTo(eyeSpacing + eyeW * 1.4, eyeY - eyeW * 0.3);
    ctx.stroke();
  }

  function drawFace() {
    const dt = 0.016;
    state.time += dt;

    if (state.blinkTimer > 0) {
      state.blinkTimer -= dt * 1000;
    } else if (!state.blink) {
      state.blink = true;
      setTimeout(() => {
        state.blink = false;
        scheduleBlink();
      }, CONFIG.blinkDuration);
      state.blinkTimer = 0;
    }

    state.headX += (state.headTargetX - state.headX) * 0.02;
    state.headY += (state.headTargetY - state.headY) * 0.02;
    state.mouthOpen += (state.mouthTarget - state.mouthOpen) * 0.03;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (CONFIG.background) {
      const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.4, 50,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.7
      );
      grad.addColorStop(0, CONFIG.bgColor1);
      grad.addColorStop(1, CONFIG.bgColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(canvas.width / 2 + state.headX, canvas.height / 2 + state.headY);

    const faceW = canvas.width * CONFIG.faceWidth;
    const faceH = canvas.height * CONFIG.faceHeight;

    ctx.beginPath();
    ctx.ellipse(0, 0, faceW, faceH, 0, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.skinColor;
    ctx.fill();
    ctx.strokeStyle = CONFIG.skinShadow;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = CONFIG.hairColor;
    ctx.beginPath();
    ctx.ellipse(0, -faceH * 0.7, faceW * 0.55, faceH * 0.35, 0, Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-faceW * 0.9, -faceH * 0.2, faceW * 0.15, faceH * 0.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(faceW * 0.9, -faceH * 0.2, faceW * 0.15, faceH * 0.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    const eyeY = -faceH * 0.25;
    const eyeSpacing = faceW * 0.32;
    const eyeW = faceW * 0.18;
    const eyeH = faceH * 0.09;
    drawEye(ctx, -eyeSpacing, eyeY, eyeW, eyeH, state.blink);
    drawEye(ctx, eyeSpacing, eyeY, eyeW, eyeH, state.blink);

    ctx.strokeStyle = CONFIG.hairColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - eyeW * 0.7, eyeY - eyeH * 1.6);
    ctx.quadraticCurveTo(-eyeSpacing, eyeY - eyeH * 2.2, -eyeSpacing + eyeW * 0.7, eyeY - eyeH * 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeSpacing - eyeW * 0.7, eyeY - eyeH * 1.6);
    ctx.quadraticCurveTo(eyeSpacing, eyeY - eyeH * 2.2, eyeSpacing + eyeW * 0.7, eyeY - eyeH * 1.4);
    ctx.stroke();

    const noseScale = CONFIG.noseSize;
    ctx.beginPath();
    ctx.moveTo(0, eyeY + eyeH * 0.5);
    ctx.quadraticCurveTo(faceW * 0.1 * noseScale, eyeY + eyeH * 1.8 * noseScale, 0, eyeY + eyeH * 2.2 * noseScale);
    ctx.quadraticCurveTo(-faceW * 0.1 * noseScale, eyeY + eyeH * 1.8 * noseScale, 0, eyeY + eyeH * 0.5);
    ctx.fillStyle = CONFIG.skinShadow;
    ctx.fill();
    ctx.strokeStyle = '#c29b7a';
    ctx.lineWidth = 1;
    ctx.stroke();

    const mouthY = eyeY + eyeH * 2.8;
    const mouthW = faceW * 0.3 * CONFIG.mouthSize;
    const mouthH = (faceH * 0.08 + state.mouthOpen * faceH * 0.08) * CONFIG.mouthSize;
    ctx.beginPath();
    if (state.mouthOpen > 0.02) {
      ctx.ellipse(0, mouthY, mouthW, mouthH, 0, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.lipColor;
      ctx.fill();
      ctx.strokeStyle = '#5a1e1e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (state.mouthOpen > 0.1) {
        ctx.beginPath();
        ctx.ellipse(0, mouthY + mouthH * 0.2, mouthW * 0.4, mouthH * 0.3, 0, 0, Math.PI);
        ctx.fillStyle = CONFIG.tongueColor;
        ctx.fill();
      }
    } else {
      ctx.moveTo(-mouthW, mouthY);
      ctx.quadraticCurveTo(0, mouthY - mouthH * 0.3, mouthW, mouthY);
      ctx.strokeStyle = CONFIG.skinShadow;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    if (CONFIG.glasses) {
      drawGlasses(ctx, faceW, faceH);
    }

    ctx.restore();

    if (CONFIG.addNoise) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const intensity = CONFIG.noiseIntensity;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    requestAnimationFrame(drawFace);
  }

  drawFace();
  const stream = canvas.captureStream(CONFIG.fps);
  return addAudioTrack(stream);
}

// ---- SILENT AUDIO TRACK (Chrome‑Safe) ----
function addAudioTrack(videoStream) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Resume if suspended (Chrome's autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    oscillator.connect(gain);
    const dest = audioCtx.createMediaStreamDestination();
    gain.connect(dest);
    oscillator.start();

    const combinedStream = new MediaStream();
    videoStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
    combinedStream.addTrack(dest.stream.getAudioTracks()[0]);

    combinedStream.oninactive = () => {
      try { audioCtx.close(); } catch(e) {}
    };
    return combinedStream;
  } catch (e) {
    console.warn('[HD Spoof] Audio track creation failed, returning video-only stream.', e);
    return videoStream;
  }
}

// ---- TRIGGER DEVICE CHANGE ----
navigator.mediaDevices.dispatchEvent(new Event('devicechange'));

// ============================================================
//  REAL‑TIME CUSTOMIZATION UI (Draggable Panel)
// ============================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectUI);
} else {
  injectUI();
}

function injectUI() {
  if (document.getElementById('hd-spoof-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'hd-spoof-panel';
  panel.innerHTML = `
    <style>
      #hd-spoof-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        background: rgba(20, 20, 30, 0.92);
        backdrop-filter: blur(8px);
        color: #eee;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 13px;
        border-radius: 12px;
        padding: 16px 20px;
        width: 260px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        border: 1px solid #444;
        cursor: grab;
        user-select: none;
      }
      #hd-spoof-panel:active { cursor: grabbing; }
      #hd-spoof-panel h3 {
        margin: 0 0 10px 0;
        font-size: 15px;
        font-weight: 600;
        color: #6af;
        cursor: default;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #hd-spoof-panel .close-btn {
        background: none;
        border: none;
        color: #888;
        font-size: 18px;
        cursor: pointer;
        padding: 0 4px;
      }
      #hd-spoof-panel .close-btn:hover { color: #fff; }
      #hd-spoof-panel label {
        display: block;
        margin-top: 8px;
        margin-bottom: 2px;
        font-size: 12px;
        color: #aaa;
        cursor: default;
      }
      #hd-spoof-panel .row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
      }
      #hd-spoof-panel input[type="range"] {
        flex: 1;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: #444;
        border-radius: 2px;
        outline: none;
      }
      #hd-spoof-panel input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #6af;
        cursor: pointer;
      }
      #hd-spoof-panel input[type="range"]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #6af;
        cursor: pointer;
        border: none;
      }
      #hd-spoof-panel input[type="color"] {
        width: 36px;
        height: 30px;
        border: 1px solid #555;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        padding: 2px;
      }
      #hd-spoof-panel .val {
        min-width: 28px;
        text-align: right;
        color: #ccc;
        font-size: 12px;
      }
      #hd-spoof-panel .checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 6px;
      }
      #hd-spoof-panel .checkbox-row input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #6af;
        cursor: pointer;
      }
      #hd-spoof-panel .section-title {
        margin-top: 14px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #666;
        border-top: 1px solid #333;
        padding-top: 10px;
      }
      #hd-spoof-panel::-webkit-scrollbar { width: 4px; }
      #hd-spoof-panel::-webkit-scrollbar-thumb { background: #555; border-radius: 2px; }
    </style>

    <h3>
      🎭 Face Customizer
      <button class="close-btn" id="hd-close-panel">✕</button>
    </h3>

    <div class="section-title">👤 Appearance</div>
    <label>Skin</label>
    <div class="row">
      <input type="color" id="skinColor" value="${CONFIG.skinColor}">
      <input type="range" id="faceWidth" min="0.35" max="0.55" step="0.01" value="${CONFIG.faceWidth}">
      <span class="val" id="faceWidthVal">${CONFIG.faceWidth.toFixed(2)}</span>
    </div>

    <label>Hair</label>
    <div class="row">
      <input type="color" id="hairColor" value="${CONFIG.hairColor}">
      <input type="range" id="faceHeight" min="0.50" max="0.75" step="0.01" value="${CONFIG.faceHeight}">
      <span class="val" id="faceHeightVal">${CONFIG.faceHeight.toFixed(2)}</span>
    </div>

    <label>Eyes</label>
    <div class="row">
      <input type="color" id="eyeColor" value="${CONFIG.eyeColor}">
      <input type="range" id="eyeSize" min="0.5" max="1.5" step="0.05" value="${CONFIG.eyeSize}">
      <span class="val" id="eyeSizeVal">${CONFIG.eyeSize.toFixed(2)}</span>
    </div>

    <div class="section-title">🎬 Animation</div>
    <label>Blink Speed (ms): <span id="blinkVal">${CONFIG.blinkInterval}</span></label>
    <input type="range" id="blinkInterval" min="500" max="6000" step="100" value="${CONFIG.blinkInterval}">

    <label>Head Movement: <span id="headAmpVal">${CONFIG.headAmplitude}</span></label>
    <input type="range" id="headAmplitude" min="0" max="25" step="1" value="${CONFIG.headAmplitude}">

    <label>Mouth Openness: <span id="mouthAmpVal">${CONFIG.mouthAmplitude.toFixed(2)}</span></label>
    <input type="range" id="mouthAmplitude" min="0" max="0.8" step="0.01" value="${CONFIG.mouthAmplitude}">

    <div class="section-title">🎨 Effects</div>
    <div class="checkbox-row">
      <input type="checkbox" id="glasses" ${CONFIG.glasses ? 'checked' : ''}>
      <label style="margin:0;">👓 Glasses</label>
    </div>
    <div class="checkbox-row">
      <input type="checkbox" id="addNoise" ${CONFIG.addNoise ? 'checked' : ''}>
      <label style="margin:0;">📺 Add Noise</label>
    </div>
    <label>Noise Intensity: <span id="noiseVal">${CONFIG.noiseIntensity}</span></label>
    <input type="range" id="noiseIntensity" min="0" max="50" step="1" value="${CONFIG.noiseIntensity}">

    <div class="section-title">🖼️ Background</div>
    <div class="row">
      <input type="color" id="bgColor1" value="${CONFIG.bgColor1}">
      <span style="font-size:11px;color:#888;">→</span>
      <input type="color" id="bgColor2" value="${CONFIG.bgColor2}">
      <input type="checkbox" id="bgToggle" ${CONFIG.background ? 'checked' : ''} style="margin-left:4px;">
    </div>

    <div style="margin-top:12px;font-size:11px;color:#666;text-align:center;border-top:1px solid #333;padding-top:8px;">
      Drag to move • Changes apply live
    </div>
  `;

  document.body.appendChild(panel);

  // ---- Draggable ----
  let offsetX, offsetY, isDragging = false;
  panel.addEventListener('mousedown', (e) => {
    if (e.target.closest('input') || e.target.closest('button')) return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    panel.style.cursor = 'grabbing';
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = (e.clientX - offsetX) + 'px';
    panel.style.top = (e.clientY - offsetY) + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
    panel.style.cursor = 'grab';
  });

  // ---- Close ----
  document.getElementById('hd-close-panel').addEventListener('click', () => {
    panel.style.display = 'none';
  });

  // ---- Bind controls ----
  function bindRange(id, configKey, valId) {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      CONFIG[configKey] = val;
      if (valId) document.getElementById(valId).textContent = val.toFixed(2);
      else if (id === 'blinkInterval') document.getElementById('blinkVal').textContent = val;
      else if (id === 'headAmplitude') document.getElementById('headAmpVal').textContent = val;
      else if (id === 'mouthAmplitude') document.getElementById('mouthAmpVal').textContent = val.toFixed(2);
      else if (id === 'noiseIntensity') document.getElementById('noiseVal').textContent = val;
    });
  }

  bindRange('faceWidth', 'faceWidth', 'faceWidthVal');
  bindRange('faceHeight', 'faceHeight', 'faceHeightVal');
  bindRange('eyeSize', 'eyeSize', 'eyeSizeVal');
  bindRange('blinkInterval', 'blinkInterval', null);
  bindRange('headAmplitude', 'headAmplitude', null);
  bindRange('mouthAmplitude', 'mouthAmplitude', null);
  bindRange('noiseIntensity', 'noiseIntensity', null);

  function bindColor(id, configKey) {
    document.getElementById(id).addEventListener('input', (e) => {
      CONFIG[configKey] = e.target.value;
    });
  }
  bindColor('skinColor', 'skinColor');
  bindColor('hairColor', 'hairColor');
  bindColor('eyeColor', 'eyeColor');
  bindColor('bgColor1', 'bgColor1');
  bindColor('bgColor2', 'bgColor2');

  function bindCheckbox(id, configKey) {
    document.getElementById(id).addEventListener('change', (e) => {
      CONFIG[configKey] = e.target.checked;
    });
  }
  bindCheckbox('glasses', 'glasses');
  bindCheckbox('addNoise', 'addNoise');
  bindCheckbox('bgToggle', 'background');

  console.log('[HD Spoof] Customization panel ready!');
}
