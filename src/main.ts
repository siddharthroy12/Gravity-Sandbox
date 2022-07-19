// Warning: spaghetti code
// TODO:
// Fix this spaghetti code

import './style.css'

import Body, { mass2radius } from './Body';
import Universe from './Universe';
import { getRandomNiceColor } from './niceColors';
import Vector2 from './Vector2';
import {
  orbit, grid, infinity, circle, square, sinewave
} from './patterns';

type ModeType = "pan" | "selection" | "add" | "pan"

let autoPause = false;
let simulationRunning = false;
let startTime: number;
let simulationSpeed = 44;
let mode: ModeType = "pan";
let nextColor = "random";
let nextMass = 10;
let bodyToFollow = null;
let isTouchDevice = false;
let filename = "Untitled";

let U = new Universe();

U.G = 100.0;

// Default pattern
orbit(U);

// Setup localStorage

if (localStorage.getItem('files') === null) {
  localStorage.setItem('files', '{}');
}

function simulation(context: CanvasRenderingContext2D) {
  let nowTime = (new Date()).getTime();
  let time = (nowTime - startTime);

  if (simulationRunning && !autoPause && !isDragging) {
    U.update(time / simulationSpeed);
  }

  U.draw(context, true);
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
    `Bodies: ${U.bodies.length} | ` +
    `Mode: ${mode.toUpperCase()}`
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

  ctx.beginPath();
  for (let i = startY; i <= endY; i += gridSize) {
    ctx.moveTo(startX, i);
    ctx.lineTo(endX, i);
  }

  for (let i = startX; i <= endX; i += gridSize) {
    ctx.moveTo(i, startY);
    ctx.lineTo(i, endY);
  }

  ctx.strokeStyle = "#323232"
  ctx.stroke();

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
  if (mode === "add") {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, mass2radius(nextMass), 0, 2 * Math.PI);
    ctx.fill();
  }

  if (launching) {
    if (mode === "add") {
      // Draw line of drag when placing
      ctx.beginPath();
      ctx.moveTo(launchStart.x, launchStart.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "white";
      ctx.stroke();
    }

    if (mode === "selection" && launching) {
      ctx.strokeStyle = "blue";
      ctx.strokeRect(launchStart.x, launchStart.y, x - launchStart.x, y - launchStart.y);
    }
  }

  requestAnimationFrame(draw);
}

// Gets the relevant location from a mouse or single touch event
function getEventLocation(e: TouchEvent|MouseEvent) {
  if (window.TouchEvent && e instanceof TouchEvent) {
    if (e.touches && e.touches.length == 1) {
      return { x:e.touches[0].clientX, y: e.touches[0].clientY }
    }
  } else {
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
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

  if (mode === "pan" || (mode === "add" && e.button === 2)) {
    bodyToFollow = U.getBodyByPoint(mousePos.x, mousePos.y);
    isDragging = true
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

  if ((mode === "add" && e.button !== 2)) {
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

  if (mode === "selection") {
    U.selectBodies(launchStart, mousePos)
    // This function that does nothing needs to be called two times
    // for selection to work (thanks javascript)
    U.update(0);
    U.update(0);
    launchStart = mousePos;
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
  // Controls
  const playPauseBtn = document.getElementById('play-pause-btn');
  const panBtn = document.getElementById('pan-btn');
  const addBtn = document.getElementById('add-btn');
  const clearBtn = document.getElementById('clear-btn');
  const selectBtn = document.getElementById('select-btn');

  // Settings
  const massSlider = document.getElementById('mass');
  const speedSlider:HTMLInputElement = (document.getElementById('speed')) as HTMLInputElement;
  const colorInput = document.getElementById('color');
  const gravityInput = document.getElementById('gravity');
  const filenameInput = document.getElementById('filename');

  // Simulations
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

  // Menu
  const newFileMenu = document.getElementById('new');
  const saveFileMenu = document.getElementById('save');
  const openFileMenu = document.getElementById('open');
  const undoMenu = document.getElementById('undo');
  const redoMenu = document.getElementById('redo');
  const deleteMenu = document.getElementById('delete');
  const aboutMenu = document.getElementById('about');

  // Update saved files list in menu
  function updateSavedFilesList() {
    const savedFiles = Object.keys(JSON.parse(localStorage.getItem("files")));

    if (savedFiles.length) {
      openFileMenu.getElementsByTagName("ul")[0].innerHTML = "";
      savedFiles.forEach(file => {
        const newLi = document.createElement("li")
        newLi.innerHTML = file;
        const deleteButton = document.createElement("span");
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const files:any = JSON.parse(localStorage.getItem('files'));
          delete files[file];
          localStorage.setItem('files', JSON.stringify(files));
          updateSavedFilesList();
        })
        deleteButton.innerHTML = "Delete";
        newLi.appendChild(deleteButton);
        newLi.addEventListener('click', () => load(file));
        openFileMenu.getElementsByTagName("ul")[0].appendChild(newLi);
      })
    } else {
      openFileMenu.getElementsByTagName("ul")[0].innerHTML = "<li class='disabled'>Empty</li>";
    }
  }

  updateSavedFilesList();

  function newFile() {
    filename = "Untitled"
    U.clear();
    U.G = 100.0;
    simulationSpeed = 44;
    (gravityInput as HTMLInputElement).value = U.G + '';
    (filenameInput as HTMLInputElement).value = filename;
    (speedSlider as HTMLInputElement).value = simulationSpeed + '';
    cameraZoom = 1;
    cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 };
    updateInfoBar();
    nextColor = "random"
    nextMass = 10;
    (massSlider as HTMLInputElement).value = nextMass + '';
    (colorInput as HTMLInputElement).value = nextColor + '';
  }

  function save() {
    const files:any = JSON.parse(localStorage.getItem('files'));
    files[filename] = JSON.parse(U.getStateJSON());
    files[filename].speed = simulationSpeed;
    localStorage.setItem('files', JSON.stringify(files));
    updateSavedFilesList();
  }

  function load(file: string) {
    const files:any = JSON.parse(localStorage.getItem('files'));

    if (files[file] !== null) {
      console.log(file);
      simulationSpeed = files[file].speed;
      U.loadStateFromJSON(JSON.stringify(files[file]));
      (gravityInput as HTMLInputElement).value = U.G+'';
      (speedSlider as HTMLInputElement).value = simulationSpeed + '';
    }

    updateInfoBar();
    filename = file;
    (filenameInput as HTMLInputElement).value = filename
    simulationRunning = false;
  }

  function undo() {
    U.undoLastPlacedBody();
    updateInfoBar();
  }

  function redo() {
    U.redoLastPlacedBody();
    updateInfoBar();
  }

  newFileMenu.addEventListener('click', newFile);
  saveFileMenu.addEventListener('click', save);
  undoMenu.addEventListener('click', undo);
  redoMenu.addEventListener('click', redo);
  deleteMenu.addEventListener('click', () => U.deleteSelectedBodies());
  function toggleAboutWindow() {
    document.getElementById("about-window").classList.toggle("hidden");
  }
  aboutMenu.addEventListener('click', toggleAboutWindow);

  document.getElementById("about-window")
    .getElementsByClassName("close-btn")[0]
    .addEventListener('click', toggleAboutWindow);

  // Simulations
  setOrbit.addEventListener('click',setPattern(orbit));
  setGrid.addEventListener('click', setPattern(grid));
  setInfinity.addEventListener('click', setPattern(infinity));
  setCircle.addEventListener('click', setPattern(circle));
  setSquare.addEventListener('click', setPattern(square))
  setSinewave.addEventListener('click', setPattern(sinewave))

  infoBar = document.getElementById('info-bar');
  canvas = (document.getElementById("canvas")) as HTMLCanvasElement;
  ctx = canvas.getContext('2d');

  // Settings
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

  gravityInput.addEventListener('input', (e) => {
    U.G = parseInt((e.target as HTMLInputElement).value)
  })

  filenameInput.addEventListener('input', (e) => {
    filename = (e.target as HTMLInputElement).value;
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

  function switchMode(nextMode: ModeType) {
    mode = nextMode;
    switch (mode) {
      case "pan":
        document.getElementById("canvas")
          .style.cursor = 'url("data:image/svg+xml;base64,' +
          window.btoa(panBtn.innerHTML.trim()) + '") 12 12,auto';
        break;
      case "add":
        document.getElementById('canvas').style.cursor = "none";
        break;
      case "selection":
        document.getElementById('canvas').style.cursor = "default";
        break;
    }
    updateInfoBar();
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === " " || e.code === "Space") {
      pausePlay();
    } else if (e.key === "h" || e.code === "H") {
      switchMode("pan")
    } else if (e.key === "p" || e.code === "P") {
      switchMode("add");
    } else if (e.key === "c" || e.code === "C") {
      U.clear();
      updateInfoBar();
    } else if (e.ctrlKey && (e.key === "z" || e.code === "Z")) {
      e.preventDefault();
      undo();
    } else if (e.ctrlKey && (e.key === "y" || e.code === "Y")) {
      e.preventDefault();
      redo();
    } else if (e.ctrlKey && (e.key === "s" || e.code === "S")) {
      e.preventDefault();
      save();
    } else if (e.key === "s" || e.code === "S") {
      switchMode("selection");
    } else if (e.ctrlKey && (e.key === "m" || e.code === "M")) {
      e.preventDefault();
      newFile();
    } else if (e.ctrlKey && (e.key === "x" || e.code === "X") || e.key === "Delete" || e.code === "Delete") {
      U.deleteSelectedBodies();
    }
  });

  playPauseBtn.addEventListener('click', pausePlay);
  addBtn.addEventListener('click', () => switchMode("add"));
  panBtn.addEventListener('click', () => switchMode("pan"));
  clearBtn.addEventListener('click', () => { U.clear(); updateInfoBar(); bodyToFollow = null });
  selectBtn.addEventListener('click', () => switchMode("selection"));

  switchMode("pan");

  // Canvas zoon and pan
  canvas.addEventListener('mousedown', (e) => { if (!isTouchDevice) { onPointerDown(e) }});
  canvas.addEventListener('touchstart', (e) => { handleTouch(e, onPointerDown); isTouchDevice = true });
  canvas.addEventListener('mouseup', (e) => { if (!isTouchDevice) { onPointerUp(e) }});
  canvas.addEventListener('touchend',  (e) => { handleTouch(e, onPointerUp) });
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('touchmove', (e) => { handleTouch(e, onPointerMove) });
  canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY));

  // Pause Simulation when focuse change
  window.addEventListener('blur', () => autoPause = true);
  window.addEventListener('focus', () => setTimeout(() => autoPause = false, 100));
  updateInfoBar();

  setTimeout(() => {
    // Ready, set, go
    pausePlay();
    startTime = (new Date()).getTime();
    draw()
  }, 1000);
});

