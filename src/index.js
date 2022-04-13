import './index.css';
import Body, { mass2radius } from './Body';
import Universe from './Universe';
import { getRandomNiceColor } from './niceColors';

let autoPause = false;
let simulationRunning = true;
let startTime;
let simulationSpeed = 50;
let panMode = false;
let nextColor = getRandomNiceColor();
let nextMass = 10;

let U = new Universe(100.0);
U.addBody(new Body(100.0, nextColor), 0, 0);
let moon = new Body(10);
moon.velocity.set(0, 10);
U.addBody(moon, 100, 0);

function simulation(context) {
  let nowTime = (new Date()).getTime();
  let time = (nowTime - startTime);
  if (simulationRunning && !autoPause) {
    U.update(time / simulationSpeed);
  }

  U.draw(context);

  startTime = nowTime;
}

let canvas;
let ctx;

let cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 }
let cameraZoom = 1
let MAX_ZOOM = 5
let MIN_ZOOM = 0.1
let SCROLL_SENSITIVITY = 0.0005
let mousePos = { x: 0, y: 0 };

function draw() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at
  ctx.translate( window.innerWidth / 2, window.innerHeight / 2 )
  ctx.scale(cameraZoom, cameraZoom)
  ctx.translate( -window.innerWidth / 2 + cameraOffset.x, -window.innerHeight / 2 + cameraOffset.y )
  ctx.clearRect(0,0, window.innerWidth, window.innerHeight)
  simulation(ctx);

  if (!panMode) {
    ctx.fillStyle = nextColor
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, mass2radius(nextMass), 0, 2 * Math.PI);
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

// Gets the relevant location from a mouse or single touch event
function getEventLocation(e) {
  if (e.touches && e.touches.length == 1) {
    return { x:e.touches[0].clientX, y: e.touches[0].clientY }
  }
  else if (e.clientX && e.clientY) {
    return { x: e.clientX, y: e.clientY }
  }
}

let isDragging = false
let dragStart = { x: 0, y: 0 }

function onPointerDown(e) {
  let x = (getEventLocation(e).x/cameraZoom - cameraOffset.x);
  let y = (getEventLocation(e).y/cameraZoom - cameraOffset.y);

  if (panMode) {
    isDragging = true
    dragStart.x = x;
    dragStart.y = y;
    canvas.style.cursor = 'move';
  } else {
    let b = new Body(10, nextColor);
    U.addBody(b, mousePos.x, mousePos.y);
    nextColor = getRandomNiceColor();
  }
}

function onPointerUp() {
  isDragging = false
  initialPinchDistance = null
  lastZoom = cameraZoom
  canvas.style.cursor = 'default';
}

function updateMousePosition(e) {
  mousePos.x = ((getEventLocation(e).x - window.innerWidth/2)/cameraZoom) - (cameraOffset.x - window.innerWidth/2);
  mousePos.y = ((getEventLocation(e).y - window.innerHeight/2)/cameraZoom) - (cameraOffset.y - window.innerHeight/2);
}

function onPointerMove(e) {
  updateMousePosition(e);

  if (isDragging) {
    cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
    cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
  }
}

function handleTouch(e, singleTouchHandler) {
  if (e.touches.length == 1) {
    singleTouchHandler(e)
  } else if (e.type == "touchmove" && e.touches.length == 2) {
    isDragging = false
    handlePinch(e)
  }
}

let initialPinchDistance = null
let lastZoom = cameraZoom

function handlePinch(e) {
  e.preventDefault()

  let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }

  // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
  let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2

  if (initialPinchDistance == null) {
    initialPinchDistance = currentDistance
  } else {
    adjustZoom( null, currentDistance/initialPinchDistance )
  }
}

function adjustZoom(zoomAmount, zoomFactor) {
  if (!isDragging) {
    if (zoomAmount) {
      cameraZoom += zoomAmount
    } else if (zoomFactor) {
      cameraZoom = zoomFactor*lastZoom
    }

    cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
    cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
  }
}

window.addEventListener('load', () => {
  let playPauseBtn = document.getElementById('play-pause-btn');
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext('2d');

  playPauseBtn.addEventListener('click', () => {
    simulationRunning = !simulationRunning;
    if (simulationRunning) {
      playPauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 7H8V17H11V7Z" fill="currentColor" /><path d="M13 17H16V7H13V17Z" fill="currentColor" /></svg>'
    } else {
      playPauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 12.3301L9 16.6603L9 8L15 12.3301Z" fill="currentColor" /></svg>'
    }
  })

  // Canvas zoop and pan
  canvas.addEventListener('mousedown', onPointerDown)
  canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
  canvas.addEventListener('mouseup', onPointerUp)
  canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp))
  canvas.addEventListener('mousemove', onPointerMove)
  canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
  canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY))

  // Pause Simulation when focuse change
  window.addEventListener('blur', () => autoPause = true);
  window.addEventListener('focus', () => setTimeout(() => autoPause = false, 100));

  // Ready, set, go
  startTime = (new Date()).getTime();
  draw()
});

