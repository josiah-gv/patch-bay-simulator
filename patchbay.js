const cols = 10;
const rows = 4;
const portRadius = 8;
const safeZoneRadius = 24; // safe zone radius for deletion prevention
const margin = 40;

let ports = [];
let connections = [];
let activeCable = null;
let cursorX = 0, cursorY = 0;
let prevCursorX = 0, prevCursorY = 0;
let controlOffsetY = 0;
let controlOffsetX = 0;
let hoverConnection = null;

function setup() {
  createCanvas(1000, 400);
  document.body.style.backgroundColor = '#222222'; // set dark grey page background

  const wSpacing = (width - margin * 2) / (cols - 1);
  const hSpacing = (height - margin * 2) / (rows - 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ports.push({
        x: margin + c * wSpacing,
        y: margin + r * hSpacing,
        id: `${c}-${r}`
      });
    }
  }

  // Create a Clear All button
  const btn = createButton("Clear All Patches");
  btn.position(10, height + 10);
  btn.mousePressed(() => connections = []);
}

function draw() {
  background(30);
  hoverConnection = null;

  const dx = cursorX - prevCursorX;
  const dy = cursorY - prevCursorY;

  // Vertical jiggle momentum
  controlOffsetY += (dy * 2 - controlOffsetY) * 0.2;

  // Horizontal swing momentum
  controlOffsetX += (dx * 2 - controlOffsetX) * 0.2;

  prevCursorX = cursorX;
  prevCursorY = cursorY;

  strokeWeight(4);
  noFill();
  connections.forEach(conn => {
    const isHovering = isMouseNearBezierSegments(conn.a, conn.b, 0, 0, 12);
    const inSafeZone = getPortAt(mouseX, mouseY, safeZoneRadius);
    if (isHovering && !inSafeZone) {
      stroke(255, 100, 100); // red highlight only if not in safe zone
      hoverConnection = conn;
    } else {
      stroke(100, 200, 255);
    }
    drawCable(conn.a, conn.b);
  });

  if (activeCable) {
    stroke(200, 200, 255);
    drawCable(activeCable, { x: cursorX, y: cursorY }, controlOffsetY, controlOffsetX);
  }

  ports.forEach(p => {
    fill(100);
    noStroke();
    circle(p.x, p.y, portRadius * 2);
  });
}

function mousePressed() {
  if (getPortAt(mouseX, mouseY, safeZoneRadius)) {
    // Handle port connection below
  } else if (hoverConnection) {
    const index = connections.indexOf(hoverConnection);
    if (index !== -1) connections.splice(index, 1);
    return;
  }

  const p = getPortAt(mouseX, mouseY, safeZoneRadius);
  if (p) {
    if (!activeCable) {
      activeCable = p;
    } else {
      if (p !== activeCable) {
        connections.push({ a: activeCable, b: p });
      }
      activeCable = null;
      controlOffsetY = 0;
      controlOffsetX = 0;
    }
  }
}

function mouseMoved() {
  cursorX = mouseX;
  cursorY = mouseY;
}

function getPortAt(x, y, radius = portRadius) {
  return ports.find(p => dist(p.x, p.y, x, y) < radius);
}

function isMouseNearBezierSegments(a, b, offsetY, offsetX, threshold) {
  const samples = 50;
  const sag = 30 + Math.abs(a.x - b.x) * 0.05;
  let points = [];
  for (let t = 0; t <= 1; t += 1 / samples) {
    const x = bezierPoint(a.x, lerp(a.x, b.x, 0.25) + offsetX, lerp(a.x, b.x, 0.75) + offsetX, b.x, t);
    const y = bezierPoint(a.y, Math.max(a.y, b.y) + sag + offsetY,
                          Math.max(a.y, b.y) + sag + offsetY, b.y, t);
    points.push({ x, y });
  }
  for (let i = 0; i < points.length - 1; i++) {
    if (distToSegment({ x: mouseX, y: mouseY }, points[i], points[i + 1]) < threshold) {
      return true;
    }
  }
  return false;
}

function distToSegment(p, a, b) {
  const A = p.x - a.x;
  const B = p.y - a.y;
  const C = b.x - a.x;
  const D = b.y - a.y;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;

  let xx, yy;
  if (param < 0) {
    xx = a.x;
    yy = a.y;
  } else if (param > 1) {
    xx = b.x;
    yy = b.y;
  } else {
    xx = a.x + param * C;
    yy = a.y + param * D;
  }

  const dx = p.x - xx;
  const dy = p.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function drawCable(a, b, offsetY = 0, offsetX = 0) {
  const sag = 30 + Math.abs(a.x - b.x) * 0.05;

  const cp1X = lerp(a.x, b.x, 0.25) + offsetX;
  const cp2X = lerp(a.x, b.x, 0.75) + offsetX;

  const controlY = Math.max(a.y, b.y) + sag + offsetY;

  bezier(a.x, a.y, cp1X, controlY, cp2X, controlY, b.x, b.y);
}
