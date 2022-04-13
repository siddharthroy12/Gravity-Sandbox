// This is a mess, needs refactoring
import './index.css';
import Body, { mass2radius } from './Body';
import Universe from './Universe';
import { getRandomNiceColor } from './niceColors';
import Vector2 from './Vector2';

let autoPause = false;
let simulationRunning = false;
let startTime;
let simulationSpeed = 50;
let panMode = true;
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
let launchStart = mousePos;
let launchEnd = { x: 0, y: 0 };

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
    ctx.strokeStyle = nextColor;

    ctx.beginPath();
    ctx.moveTo(launchStart.x, launchStart.y);
    ctx.lineTo(launchEnd.x, launchEnd.y);
    ctx.stroke();
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
  dragStart.x = x;
  dragStart.y = y;

  if (panMode) {
    isDragging = true
    canvas.style.cursor = 'move';
  } else {
    launchStart = { ...mousePos };
  }
}

function onPointerUp(e) {
  isDragging = false
  initialPinchDistance = null
  lastZoom = cameraZoom
  canvas.style.cursor = 'default';

  if (!panMode) {
    let x = (getEventLocation(e).x/cameraZoom - cameraOffset.x);
    let y = (getEventLocation(e).y/cameraZoom - cameraOffset.y);
    let b = new Body(10, nextColor);
    let v = new Vector2(x - dragStart.x, y - dragStart.y);
    v.x = -v.x
    v.y = -v.y
    v.x *= 0.5;
    v.y *= 0.5;
    b.velocity.add(v);
    U.addBody(b, mousePos.x, mousePos.y);
    nextColor = getRandomNiceColor();
    launchStart = mousePos;
  }
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
  } else {
    launchEnd = { ...mousePos };
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
  let panAddBtn = document.getElementById('pan-add-btn');
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext('2d');

  function pausePlay() {
    simulationRunning = !simulationRunning;
    if (simulationRunning) {
      playPauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 7H8V17H11V7Z" fill="currentColor" /><path d="M13 17H16V7H13V17Z" fill="currentColor" /></svg>'
    } else {
      playPauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 12.3301L9 16.6603L9 8L15 12.3301Z" fill="currentColor" /></svg>'
    }
  }

  function addPan(value) {
    panMode = value != null ? value : !panMode;
    if (panMode) {
      panAddBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.8284 6.34313L16.2426 4.92892L12 0.686279L7.75735 4.92892L9.17156 6.34313L12 3.51471L14.8284 6.34313Z" fill="currentColor" /><path d="M4.92892 16.2426L6.34313 14.8284L3.51471 12L6.34313 9.17156L4.92892 7.75735L0.686279 12L4.92892 16.2426Z" fill="currentColor" /><path d="M7.75735 19.0711L12 23.3137L16.2426 19.0711L14.8284 17.6568L12 20.4853L9.17156 17.6568L7.75735 19.0711Z" fill="currentColor" /><path d="M17.6568 9.17156L20.4853 12L17.6568 14.8284L19.0711 16.2426L23.3137 12L19.0711 7.75735L17.6568 9.17156Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8ZM12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10Z" fill="currentColor" /></svg>';
    } else {
      panAddBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4C11.4477 4 11 4.44772 11 5V11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H11V19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19V13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H13V5C13 4.44772 12.5523 4 12 4Z" fill="currentColor" /></svg>';
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === " " || e.code === "Space") {
      pausePlay();
    } else if (e.key === "h" || e.code === "H") {
      addPan(true);
    } else if (e.key === "p" || e.code === "P") {
      addPan(false);
    }
  });

  playPauseBtn.addEventListener('click', pausePlay);
  panAddBtn.addEventListener('click', () => addPan());

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

  addPan();

  setTimeout(() => {
    // Ready, set, go
    pausePlay();
    startTime = (new Date()).getTime();
    draw()
  }, 100);
});

