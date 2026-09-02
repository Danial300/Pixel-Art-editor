const canvas = document.querySelector('#pixelCanvas');
const context = canvas.getContext('2d');

const GRID_SIZE = 16;
const CANVAS_SIZE = 512;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

const MAX_HISTORY = 20;

let currentColor = '#ff4d6d';

const pencilBtn = document.querySelector('#pencilBtn');
const eraserBtn = document.querySelector('#eraserBtn');
const clearBtn = document.querySelector('#clearBtn');
const colorPicker = document.querySelector('#colorPicker');
const pickerBtn = document.querySelector('#EyedropperBtn');
const fillBgBtn = document.querySelector('#fillBackground');
const saveBtn = document.querySelector('#saveBtn');

let isPainting = false;

let activeTool = 'pencil';

let history = [];
let redoStack = [];


function createRow() {
  return Array(GRID_SIZE).fill(null);
}

function createFrame() {
  const newFrame = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    const currentRow = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      currentRow.push(null);
    }
    newFrame.push(currentRow);
  }
  return newFrame;
}

const frame = createFrame();

function render() {
  context.clearRect(0,0,CANVAS_SIZE, CANVAS_SIZE);

  drawBackground();
  drawPixels();
  drawGrid();
}

function drawBackground() {
  context.fillStyle = '#ffffff'

  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function drawPixels() {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let column = 0; column < GRID_SIZE; column++) {
      const color = frame[row][column];

      if (color !== null) {
        context.fillStyle = color;

        context.fillRect(
          column * CELL_SIZE,
          row * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }
  }
}


function drawGrid() {
  context.strokeStyle = '#d0d0d0';
  context.lineWidth = 1;

  for (let index = 0; index <= GRID_SIZE; index++) {
    const position = index * CELL_SIZE;

    // خط عمودی
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, CANVAS_SIZE);
    context.stroke();

    // خط افقی
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(CANVAS_SIZE , position);
    context.stroke();
  }
}

function paintCell(event) {
  const cell = getCellFromPointer(event);
  if (!cell) return;

  if (activeTool === 'pencil') {
    frame[cell.row][cell.column] = currentColor;
  }
  
  if (activeTool === 'eraser') {
    frame[cell.row][cell.column] = null;
  }

  if (activeTool === 'picker') {
    const pickedColor  = frame[cell.row][cell.column];
    if(pickedColor) {
      currentColor = pickedColor;
      colorPicker.value = pickedColor;
    }
    setActiveTool('pencil');
  }

  render();
}

function getPointerPosition(event) {
  const canvasRect = canvas.getBoundingClientRect();

  const x = event.clientX - canvasRect.left;
  const y = event.clientY - canvasRect.top;

  return {
    x,
    y
  };
}


function getCellFromPointer(event) {
  const canvasRect = canvas.getBoundingClientRect();
  const x = event.clientX - canvasRect.left;
  const y = event.clientY - canvasRect.top;

  // اگر اشاره‌گر بیرون از محدوده بوم رفت، نادیده بگیر
  if (x < 0 || x >= canvasRect.width || y < 0 || y >= canvasRect.height) {
    return null;
  }

  const currentCellWidth = canvasRect.width / GRID_SIZE;
  const currentCellHeight = canvasRect.height / GRID_SIZE;

  const column = Math.floor(x / currentCellWidth);
  const row = Math.floor(y / currentCellHeight);

  return { row, column };
}


function handlePointerDown(event) {
  canvas.setPointerCapture(event.pointerId);
  isPainting = true;
  saveState();
  paintCell(event);
}

function handlePointerMove(event) {
  if (isPainting) {
    paintCell(event);
  }
}

function handlePointerUp(event) {
  if (isPainting && event && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  isPainting = false;
}

function setActiveTool(toolName) {
  activeTool = toolName;
}

function clearFrame() {
  saveState();

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let column = 0; column < GRID_SIZE; column++) {
      frame[row][column] = null;
    }
  }
  
  render();
}
//============REDO/UNDO============
function cloneFrame(frame) {
  return frame.map(function(row) {
    return [...row];
  });
}

function saveState() {
  //if(!isPainting) {return;}
  history.push(cloneFrame(frame));
  if(history.length > MAX_HISTORY) {history.shift();}
  redoStack = [];
}

function applyFrame(snapshot) {
  for (let row = 0; row < GRID_SIZE; row++) {
    frame[row] = [...snapshot[row]];
  }
}

function undo() {
  if (history.length === 0) {
    return;
  }
  redoStack.push(cloneFrame(frame));
  const previousFrame = history.pop();
  applyFrame(previousFrame);
  render();
}

function redo() {
  if (redoStack.length === 0) {
    return;
  }
  history.push(cloneFrame(frame));
  const nextFrame = redoStack.pop();
  applyFrame(nextFrame);
  render();
}
//=================================

//=========Fill Background=========
function fillBackground(bgColor) {
  saveState();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let column = 0; column < GRID_SIZE; column++) {
      if(frame[row][column] === null) {
        frame[row][column] = bgColor;
      }
    }
  }

  render();
}
//=================================

//============Save Image===========
function exportImage(exportSize = 512) {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = exportSize;
  exportCanvas.height = exportSize;
  const ctx = exportCanvas.getContext('2d');

  const pixelSize  = exportSize / GRID_SIZE;

  for(let row = 0; row < GRID_SIZE; row++){
    for(let col = 0; col < GRID_SIZE; col++){
      const color = frame[row][col];
      if(color){
        ctx.fillStyle = color;
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  const imageURL = exportCanvas.toDataURL('image/png');
  const downloadLink = document.createElement('a');
  downloadLink.download = 'pixelforge-art.png';
  downloadLink.href = imageURL;
  downloadLink.click();
}
//=================================

//========BTN EventListener========
pencilBtn.addEventListener('click', function () {
  setActiveTool('pencil');
});

eraserBtn.addEventListener('click', function () {
  setActiveTool('eraser');
});

pickerBtn.addEventListener('click', function () {
  setActiveTool('picker');
});

clearBtn.addEventListener('click', clearFrame);

fillBgBtn.addEventListener('click', () => {
  const tempColorInput = document.createElement('input');
  tempColorInput.type = 'color';
  tempColorInput.value = currentColor; 

  tempColorInput.addEventListener('change', (e) => {
    const selectedBgColor = e.target.value;
    fillBackground(selectedBgColor);
  });

  tempColorInput.click();
});
saveBtn.addEventListener('click', function () {
  exportImage(512);
});
//=================================

window.addEventListener('keydown', (e) => {
  const isCtrlOrCmd = e.ctrlKey || e.metaKey;

  // Undo (Ctrl+Z  Cmd+Z) 
  if (isCtrlOrCmd && e.code === 'KeyZ' && !e.shiftKey) {
    e.preventDefault();
    undo();
  }

  //  Redo (Ctrl+Y  Ctrl+Shift+Z  Cmd+Shift+Z)
  if (
    (isCtrlOrCmd && e.code === 'KeyY') ||
    (isCtrlOrCmd && e.shiftKey && e.code === 'KeyZ')
  ) {
    e.preventDefault();
    redo();
  }
});

//==============EventListener======
canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);
colorPicker.addEventListener('input', function(event) {
  currentColor = event.target.value;
  activeTool = 'pencil';
});
window.addEventListener('beforeunload', (e) => {
  if(history.length <= 0) {return;}
  e.preventDefault();
  e.returnValue = '';
});

//=================================
render();