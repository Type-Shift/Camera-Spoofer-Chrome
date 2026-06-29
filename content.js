// content.js

// Save references to the original methods
const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

// --- 1. Tamper with enumerateDevices ---
// Goal: Insert a fake camera device into the website's device list
navigator.mediaDevices.enumerateDevices = async function () {
  // Get the real device list
  const devices = await originalEnumerateDevices();
  
  // Create a fake video input device entry
  const fakeDevice = {
    deviceId: 'fake-virtual-camera-id',
    kind: 'videoinput',
    label: 'My Virtual Camera', 
    groupId: 'fake-group-id'
  };
  
  // Add the fake device to the list and return it
  return [...devices, fakeDevice];
};

// --- 2. Tamper with getUserMedia ---
// Goal: When the website requests our fake camera, return a fake video stream
navigator.mediaDevices.getUserMedia = async function (constraints) {
  // Check if the request is for our fake device
  const videoConstraints = constraints.video;
  if (videoConstraints && videoConstraints.deviceId && 
      videoConstraints.deviceId.exact === 'fake-virtual-camera-id') {
    
    // Return a fake video stream (e.g., generated from a Canvas element)
    return generateFakeStream();
  }

  // Otherwise, call the original getUserMedia as normal
  return originalGetUserMedia(constraints);
};

// --- 3. Generate the Fake Video Stream ---
// This is the most critical part: create and return a valid MediaStream object
function generateFakeStream() {
  // Method A: Use a <canvas> element to generate dynamic content
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  // Draw some content, e.g., a simple animation or an image
  function draw() {
    // ... This can draw anything, like a moving square or a 3D avatar
    ctx.fillStyle = 'blue';
    ctx.fillRect(10, 10, 100, 100);
    requestAnimationFrame(draw);
  }
  draw();

  // Capture the stream from the Canvas
  const stream = canvas.captureStream(30); // 30fps
  
  // Method B: Use a <video> element to play a local video file
  // const video = document.createElement('video');
  // video.src = 'pre-recorded-video.mp4';
  // video.loop = true;
  // video.play();
  // const stream = video.captureStream();
  
  return stream;
}

// Optional: Trigger a device change event to help the website discover the "new" device
navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
