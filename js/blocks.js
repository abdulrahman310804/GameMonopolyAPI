const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');

// Block Blast-style puzzle: 8x8 board, 3 pieces at the bottom,
// no falling blocks. Place pieces manually and clear full rows/columns.
const BOARD = 8;
const CELL = 38;
const BOARD_X = 18;
const BOARD_Y = 18;
const BOARD_SIZE = BOARD * CELL;
const TRAY_Y = BOARD_Y + BOARD_SIZE + 45;
const SLOT_W = 105;
const TRAY_CENTERS = [72, 180, 288];

const COLORS = ['#4fc3f7', '#7e57c2', '#ffb74d', '#ef5350', '#66bb6a', '#ffee58', '#ec407a'];
const SHAPES = [
  [[1]],
  [[1, 1]],
  [[1, 1, 1]],
  [[1, 1, 1, 1]],
  [[1], [1]],
  [[1], [1], [1]],
  [[1], [1], [1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [1, 1, 1]],
  [[1, 1], [1, 1], [1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 0], [1, 1], [0, 1]],
  [[0, 1], [1, 1], [1, 0]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 1, 1], [0, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]]
];

let board = [];
let pieces = [];
let score = 0;
let lines = 0;
let level = 1;
let dragging = null;
let pointerId = null;
let dragX = 0;
let dragY = 0;
let previewCell = null;

function cloneShape(shape) {
  return shape.map(row => row.slice());
}

function randomPiece() {
  const shape = cloneShape(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
  return {
    shape,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    used: false,
    x: 0,
    y: 0
  };
}

function newPieces() {
  pieces = [randomPiece(), randomPiece(), randomPiece()];
}

function reset() {
  board = Array.from({ length: BOARD }, () => Array(BOARD).fill(null));
  score = 0;
  lines = 0;
  level = 1;
  dragging = null;
  previewCell = null;
  newPieces();
  update();
  draw();
}

function update() {
  scoreEl.textContent = score.toLocaleString('id-ID');
  levelEl.textContent = level;
  linesEl.textContent = lines;
}

function boardCellFromPoint(px, py) {
  const col = Math.floor((px - BOARD_X) / CELL);
  const row = Math.floor((py - BOARD_Y) / CELL);
  if (col < 0 || col >= BOARD || row < 0 || row >= BOARD) return null;
  return { col, row };
}

function canPlace(piece, row, col) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const br = row + r;
      const bc = col + c;
      if (br < 0 || br >= BOARD || bc < 0 || bc >= BOARD) return false;
      if (board[br][bc]) return false;
    }
  }
  return true;
}

function place(piece, row, col) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) board[row + r][col + c] = piece.color;
    }
  }

  const cleared = clearCompleted();
  const blockCount = piece.shape.flat().filter(Boolean).length;
  score += blockCount * 5;
  if (cleared.total > 0) {
    const comboBonus = cleared.total > 1 ? cleared.total * 25 : 0;
    score += cleared.total * 100 + comboBonus;
    lines += cleared.total;
    level = Math.floor(lines / 5) + 1;
  }

  piece.used = true;
  if (pieces.every(p => p.used)) newPieces();
  update();
  draw();

  if (!hasAnyMove()) {
    setTimeout(() => drawGameOver(), 100);
  }
}

function clearCompleted() {
  const rows = [];
  const cols = [];

  for (let r = 0; r < BOARD; r++) {
    if (board[r].every(Boolean)) rows.push(r);
  }
  for (let c = 0; c < BOARD; c++) {
    let full = true;
    for (let r = 0; r < BOARD; r++) {
      if (!board[r][c]) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }

  if (!rows.length && !cols.length) return { total: 0 };

  const remove = new Set();
  rows.forEach(r => { for (let c = 0; c < BOARD; c++) remove.add(`${r},${c}`); });
  cols.forEach(c => { for (let r = 0; r < BOARD; r++) remove.add(`${r},${c}`); });

  remove.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    board[r][c] = null;
  });

  return { total: rows.length + cols.length };
}

function hasAnyMove() {
  for (const piece of pieces) {
    if (piece.used) continue;
    for (let r = 0; r < BOARD; r++) {
      for (let c = 0; c < BOARD; c++) {
        if (canPlace(piece, r, c)) return true;
      }
    }
  }
  return false;
}

function pointerToCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function pieceAt(x, y) {
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    if (p.used) continue;
    const w = p.shape[0].length * 25;
    const h = p.shape.length * 25;
    const cx = TRAY_CENTERS[i];
    const top = TRAY_Y + 15;
    if (x >= cx - Math.max(45, w / 2) && x <= cx + Math.max(45, w / 2) &&
        y >= top - 15 && y <= top + Math.max(65, h)) return i;
  }
  return -1;
}

function startDrag(e) {
  if (dragging) return;
  const p = pointerToCanvas(e);
  const index = pieceAt(p.x, p.y);
  if (index < 0) return;

  const target = pieces[index];
  dragging = { index, piece: target };
  pointerId = e.pointerId;
  canvas.setPointerCapture?.(pointerId);
  updateDrag(p.x, p.y);
  draw();
  e.preventDefault();
}

function updateDrag(x, y) {
  if (!dragging) return;
  dragX = x;
  dragY = y;
  const col = Math.floor((x - BOARD_X) / CELL - dragging.piece.shape[0].length / 2 + 0.5);
  const row = Math.floor((y - BOARD_Y) / CELL - dragging.piece.shape.length / 2 + 0.5);
  if (canPlace(dragging.piece, row, col)) {
    previewCell = { row, col, valid: true };
  } else {
    previewCell = { row, col, valid: false };
  }
}

function moveDrag(e) {
  if (!dragging || e.pointerId !== pointerId) return;
  const p = pointerToCanvas(e);
  updateDrag(p.x, p.y);
  draw();
  e.preventDefault();
}

function endDrag(e) {
  if (!dragging || e.pointerId !== pointerId) return;
  const current = dragging;
  const preview = previewCell;
  dragging = null;
  pointerId = null;
  previewCell = null;

  if (preview?.valid) place(current.piece, preview.row, preview.col);
  else draw();
  e.preventDefault();
}

function drawRoundedRect(x, y, w, h, radius, fill, stroke = null) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawBlock(x, y, color, size = CELL, alpha = 1) {
  ctx.globalAlpha = alpha;
  drawRoundedRect(x + 2, y + 2, size - 4, size - 4, 5, color);
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.fillRect(x + 5, y + 5, size - 10, 3);
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  ctx.fillRect(x + 5, y + size - 8, size - 10, 3);
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#080d18';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Board panel
  drawRoundedRect(7, 7, BOARD_SIZE + 22, BOARD_SIZE + 22, 12, '#111a2c');

  // Empty cells
  for (let r = 0; r < BOARD; r++) {
    for (let c = 0; c < BOARD; c++) {
      const x = BOARD_X + c * CELL;
      const y = BOARD_Y + r * CELL;
      drawRoundedRect(x + 3, y + 3, CELL - 6, CELL - 6, 5, '#1b2740');
      if (board[r][c]) drawBlock(x, y, board[r][c]);
    }
  }

  // Placement preview
  if (dragging && previewCell) {
    const p = dragging.piece;
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        const x = BOARD_X + (previewCell.col + c) * CELL;
        const y = BOARD_Y + (previewCell.row + r) * CELL;
        if (previewCell.valid && previewCell.row + r >= 0 && previewCell.col + c >= 0 && previewCell.row + r < BOARD && previewCell.col + c < BOARD) {
          drawBlock(x, y, p.color, CELL, 0.48);
        }
      }
    }
  }

  ctx.fillStyle = '#9db7c1';
  ctx.font = '700 12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('SERET BALOK KE PAPAN', canvas.width / 2, TRAY_Y - 12);

  // Piece tray
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    const cx = TRAY_CENTERS[i];
    drawRoundedRect(cx - 48, TRAY_Y, 96, 92, 12, p.used ? '#0f1726' : '#111a2c');
    if (p.used) continue;

    const mini = 25;
    const w = p.shape[0].length * mini;
    const h = p.shape.length * mini;
    const sx = cx - w / 2;
    const sy = TRAY_Y + 46 - h / 2;
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c]) drawBlock(sx + c * mini, sy + r * mini, p.color, mini);
      }
    }
  }

  if (!hasAnyMove() && pieces.some(p => !p.used)) drawGameOver();
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(5,8,15,.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '800 28px system-ui';
  ctx.fillText('GAME OVER', canvas.width / 2, BOARD_Y + BOARD_SIZE / 2 - 5);
  ctx.font = '600 13px system-ui';
  ctx.fillStyle = '#b9c9d1';
  ctx.fillText('Klik atau ketuk untuk bermain lagi', canvas.width / 2, BOARD_Y + BOARD_SIZE / 2 + 24);
}

canvas.addEventListener('pointerdown', e => {
  if (!hasAnyMove() && pieces.some(p => !p.used)) {
    reset();
    return;
  }
  startDrag(e);
});
canvas.addEventListener('pointermove', moveDrag);
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', e => {
  if (dragging && e.pointerType === 'mouse') moveDrag(e);
});

// Prevent browser scrolling while dragging on touch screens.
canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
canvas.addEventListener('touchend', e => e.preventDefault(), { passive: false });

reset();
