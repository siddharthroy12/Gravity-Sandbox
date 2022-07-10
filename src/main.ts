// Warning: Spagetti code
// TODO:
// Add undo/redo placing bodies
// Make gravity input functional

import './style.css'

import Body, { mass2radius } from './Body';
import Universe from './Universe';
import { getRandomNiceColor } from './niceColors';
import Vector2 from './Vector2';
import {
  orbit, grid, infinity, circle, square, sinewave
} from './patterns';

let autoPause = false;
let simulationRunning = false;
let startTime: number;
let simulationSpeed = 44;
let panMode = true;
let nextColor = "random";
let nextMass = 10;
let bodyToFollow = null;
let isTouchDevice = false;

let U = new Universe();

// Default pattern
orbit(U);

function simulation(context: CanvasRenderingContext2D) {
  let nowTime = (new Date()).getTime();
  let time = (nowTime - startTime);
  if (simulationRunning && !autoPause && !isDragging) {
    U.update(time / simulationSpeed);
  }

  U.draw(context);

  startTime = nowTime;
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

let cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 };
let cameraZoom = 1;
let MAX_ZOOM = 5;
let MIN_ZOOM = 0.1;
let SCROLL_SENSITIVITY = 0.0005;
let mousePos = { x: 0, y: 0 }; // Inside 2d world
let mousePosInViewport = { x: 0, y: 0 }; // Inside window
let launchStart = mousePos;
let launching = false;
let infoBar: HTMLElement;
const gridSize = 20

// The bottom left section
function updateInfoBar() {
  infoBar.innerText =
    `Looking at : ${(cameraOffset.x+'').slice(0, 7)} ${(cameraOffset.y+'').slice(0, 7)} | ` +
    `Zoom : ${(cameraZoom+'').slice(0, 4)} | ` +
    `Bodies: ${U.bodies.length}`
  ;
}

function draw() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at
  ctx.translate( window.innerWidth / 2, window.innerHeight / 2 );
  ctx.scale(cameraZoom, cameraZoom);
  ctx.translate( -window.innerWidth / 2 + cameraOffset.x, -window.innerHeight / 2 + cameraOffset.y );
  ctx.clearRect(0,0, window.innerWidth, window.innerHeight);

  // Draw background grid
  ctx.beginPath();

  let startX = ((0 - window.innerWidth/2)/cameraZoom) - (cameraOffset.x - window.innerWidth/2);
  let startY = ((0 - window.innerHeight/2)/cameraZoom) - (cameraOffset.y - window.innerHeight/2);
  let endX = ((window.innerWidth - window.innerWidth/2)/cameraZoom) - (cameraOffset.x - window.innerWidth/2);
  let endY = ((window.innerHeight - window.innerHeight/2)/cameraZoom) - (cameraOffset.y - window.innerHeight/2);

  startX = Math.floor(startX/gridSize) * gridSize
  startY = Math.floor(startY/gridSize) * gridSize
  endX = (Math.floor(endX/gridSize) * gridSize) + gridSize
  endY = (Math.floor(endY/gridSize) * gridSize) + gridSize

  for (let i = startY; i <= endY; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, i);
    ctx.lineTo(endX, i);
    ctx.strokeStyle = "#323232"
    ctx.stroke();
  }

  for (let i = startX; i <= endX; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(i, startY);
    ctx.lineTo(i, endY);
    ctx.strokeStyle = "#323232"
    ctx.stroke();
  }

  simulation(ctx);

  if (bodyToFollow) {
    cameraOffset.x = -(bodyToFollow.position.x - window.innerWidth/2);
    cameraOffset.y = -(bodyToFollow.position.y - window.innerHeight/2);
    updateInfoBar();
  }

  updateMousePosition();

  let x = Math.floor(mousePos.x/gridSize) * gridSize
  let y = Math.floor(mousePos.y/gridSize) * gridSize

  // Draw Preview
  if (!panMode) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, mass2radius(nextMass), 0, 2 * Math.PI);
    ctx.fill();
  }

  if (launching) {
    // Draw line of drag when placing
    ctx.beginPath();
    ctx.moveTo(launchStart.x, launchStart.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "white";
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}

// Gets the relevant location from a mouse or single touch event
function getEventLocation(e: TouchEvent|MouseEvent) {
  if (e instanceof TouchEvent) {
    if (e.touches && e.touches.length == 1) {
      return { x:e.touches[0].clientX, y: e.touches[0].clientY }
    }
  } else {
    return { x: e.clientX, y: e.clientY }
  }
}

let isDragging = false
let dragStart = { x: 0, y: 0 }

function onPointerDown(e: MouseEvent) {
  let x = (getEventLocation(e).x/cameraZoom - cameraOffset.x);
  let y = (getEventLocation(e).y/cameraZoom - cameraOffset.y);
  dragStart.x = x;
  dragStart.y = y;
  dragStart.x = Math.floor(x/gridSize) * gridSize;
  dragStart.y = Math.floor(y/gridSize) * gridSize;

  if (panMode && e.button === 0 || (!panMode && e.button === 2)) {
    bodyToFollow = U.getBodyByPoint(mousePos.x, mousePos.y);
    isDragging = true
    canvas.style.cursor = 'move';
  } else {
    updateMousePositionInViewport(e);
    updateMousePosition();

    launchStart = {
      x: ((getEventLocation(e).x - window.innerWidth/2)/cameraZoom) - (cameraOffset.x - window.innerWidth/2),
      y: ((getEventLocation(e).y - window.innerHeight/2)/cameraZoom) - (cameraOffset.y - window.innerHeight/2),
    };

    launchStart.x = Math.floor(launchStart.x/gridSize) * gridSize
    launchStart.y = Math.floor(launchStart.y/gridSize) * gridSize

    launching = true;
  }
}

function onPointerUp(e: MouseEvent) {
  isDragging = false
  initialPinchDistance = null
  lastZoom = cameraZoom
  canvas.style.cursor = 'default';

  if ((!panMode && e.button !== 2) || (panMode && e.button === 2)) {
    let x = Math.floor(mousePos.x/gridSize) * gridSize;
    let y = Math.floor(mousePos.y/gridSize) * gridSize;

    let b = new Body(nextMass, nextColor === "random" ? getRandomNiceColor() : nextColor);
    let v = new Vector2(x - launchStart.x, y - launchStart.y);
    v.x = -v.x
    v.y = -v.y
    v.x *= 0.2;
    v.y *= 0.2;
    b.velocity.add(v);
    U.addBody(b, x, y);
    launchStart = mousePos;
    updateInfoBar();
    launching = false;
  }
}

function updateMousePosition() {
  mousePos.x = ((mousePosInViewport.x - window.innerWidth/2)/cameraZoom) - (cameraOffset.x - window.innerWidth/2);
  mousePos.y = ((mousePosInViewport.y - window.innerHeight/2)/cameraZoom) - (cameraOffset.y - window.innerHeight/2);
}

function updateMousePositionInViewport(e: MouseEvent) {
  mousePosInViewport.x = getEventLocation(e).x;
  mousePosInViewport.y = getEventLocation(e).y;
}

function onPointerMove(e: MouseEvent) {
  updateMousePositionInViewport(e);
  updateMousePosition();

  if (isDragging) {
    cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
    cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
    updateInfoBar();
  }
}

function handleTouch(e: TouchEvent, singleTouchHandler: (e: MouseEvent) => void) {
  if (e.touches.length <= 1) {

    // @ts-ignore
    (e as unknown as MouseEvent).button = 0;

    singleTouchHandler(e as unknown as MouseEvent)
  } else if (e.type == "touchmove" && e.touches.length == 2) {
    isDragging = false
    handlePinch(e)
  }
}

let initialPinchDistance = null
let lastZoom = cameraZoom

function handlePinch(e: TouchEvent) {
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

function adjustZoom(zoomAmount?: number, zoomFactor?: number) {
  if (!isDragging) {
    if (zoomAmount) {
      cameraZoom += zoomAmount
    } else if (zoomFactor) {
      cameraZoom = zoomFactor*lastZoom
    }

    cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
    cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
    updateInfoBar();
  }
}


window.addEventListener('load', () => {
  const playPauseBtn = document.getElementById('play-pause-btn');
  const panAddBtn = document.getElementById('pan-add-btn');
  const clearBtn = document.getElementById('clear');

  const massSlider = document.getElementById('mass');
  const speedSlider:HTMLInputElement = (document.getElementById('speed')) as HTMLInputElement;
  const colorInput = document.getElementById('color');

  const setOrbit = document.getElementById('set-orbit');
  const setGrid = document.getElementById('set-grid');
  const setInfinity = document.getElementById('set-infinity');
  const setCircle = document.getElementById('set-circle');
  const setSquare = document.getElementById('set-square');
  const setSinewave = document.getElementById('set-sinewave');

  function setPattern(pattern: (U: Universe) => number[]) {
    return () => {
      U.clear();
      const [zoom, speed] = pattern(U);
      cameraZoom = zoom;
      simulationSpeed = speed;
      cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 }
      updateInfoBar();
      speedSlider.value = (speed) + "";
    }
  }

  setOrbit.addEventListener('click',setPattern(orbit));
  setGrid.addEventListener('click', setPattern(grid));
  setInfinity.addEventListener('click', setPattern(infinity));
  setCircle.addEventListener('click', setPattern(circle));
  setSquare.addEventListener('click', setPattern(square))
  setSinewave.addEventListener('click', setPattern(sinewave))

  infoBar = document.getElementById('info-bar');
  canvas = (document.getElementById("canvas")) as HTMLCanvasElement;
  ctx = canvas.getContext('2d');

  massSlider.addEventListener('input', (e:InputEvent) => {
    nextMass = parseInt((e.target as HTMLInputElement).value);
  });

  speedSlider.addEventListener('input', (e) => {
    simulationSpeed = parseInt((e.target as HTMLInputElement).value);
    updateInfoBar();
  });

  colorInput.addEventListener('input', (e) => {
    if ((e.target as HTMLInputElement).value.startsWith("#") && (e.target as HTMLInputElement).value.length === 7 ) {
      nextColor = (e.target as HTMLInputElement).value;
    } else {
      nextColor = "random"
    }
  })

  speedSlider.value = (simulationSpeed) + '';

  function pausePlay() {
    simulationRunning = !simulationRunning;
    if (simulationRunning) {
      playPauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 7H8V17H11V7Z" fill="currentColor" /><path d="M13 17H16V7H13V17Z" fill="currentColor" /></svg>'
    } else {
      playPauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 12.3301L9 16.6603L9 8L15 12.3301Z" fill="currentColor" /></svg>'
    }
  }

  function addPan(value?: boolean) {
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
  clearBtn.addEventListener('click', () => { U.clear(); updateInfoBar(); bodyToFollow = null });

  // Canvas zoop and pan
  canvas.addEventListener('mousedown', (e) => { if (!isTouchDevice) { onPointerDown(e) }})
  canvas.addEventListener('touchstart', (e) => { handleTouch(e, onPointerDown); isTouchDevice = true })
  canvas.addEventListener('mouseup', (e) => { if (!isTouchDevice) { onPointerUp(e) }})
  canvas.addEventListener('touchend',  (e) => { handleTouch(e, onPointerUp) })
  canvas.addEventListener('mousemove', onPointerMove)
  canvas.addEventListener('touchmove', (e) => { handleTouch(e, onPointerMove) })
  canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY))

  // Pause Simulation when focuse change
  window.addEventListener('blur', () => autoPause = true);
  window.addEventListener('focus', () => setTimeout(() => autoPause = false, 100));
  updateInfoBar();

  addPan();

  setTimeout(() => {
    // Ready, set, go
    pausePlay();
    startTime = (new Date()).getTime();
    draw()
  }, 500);
});

