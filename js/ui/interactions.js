/**
 * Interactions Module
 * Handles user interactions with the patch bay
 */

// Import constants
import { portRadius } from '../config/constants.js';

// Import port utilities
import { getPortAt, isPortConnected } from '../models/Port.js';

/**
 * Handles mouse press events
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function mousePressed(p5, state) {
  try {
    // Check if we're hovering over a connection to delete it
    // Only allow deletion if we're not currently holding a cable
    if (state.hoverConnection && !state.activeCable) {
      const index = state.connections.indexOf(state.hoverConnection);
      if (index !== -1) state.connections.splice(index, 1);
      return;
    }

    // Use the same radius as the highlight threshold for consistent behavior
    const p = getPortAt(state.mouseX, state.mouseY, state.ports, portRadius * 1.5);
    if (p) {
      if (!state.activeCable) {
        // Start a new cable from this port if it's not already connected
        if (!isPortConnected(p, state.connections)) {
          state.activeCable = p;
        }
      } else {
        // Only connect if the target port is not the same as the source and not already connected
        if (p !== state.activeCable && !isPortConnected(p, state.connections)) {
          // Create a new connection with the current color
          state.connections.push({ 
            a: state.activeCable, 
            b: p, 
            color: state.cableColors[state.currentColorIndex]
          });
          
          // Cycle to the next color for the next cable
          state.currentColorIndex = (state.currentColorIndex + 1) % state.cableColors.length;
          
          // Only reset the active cable if we successfully made a connection
          state.activeCable = null;
          state.controlOffsetY = 0;
          state.controlOffsetX = 0;
        }
        // If the port is already connected, we do nothing and the user keeps holding the cable
      }
    } else if (!state.activeCable) {
      // If we clicked in empty space and we're not holding a cable,
      // check if we should start a cable from the highlighted port
      if (state.closestAvailablePort && !isPortConnected(state.closestAvailablePort, state.connections)) {
        state.activeCable = state.closestAvailablePort;
      }
    }
  } catch (error) {
    console.error('Error in mousePressed function:', error);
    // Reset active cable to prevent issues
    state.activeCable = null;
    state.controlOffsetY = 0;
    state.controlOffsetX = 0;
  }
}

/**
 * Handles mouse movement events
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function mouseMoved(p5, state) {
  state.cursorX = state.mouseX;
  state.cursorY = state.mouseY;
}

/**
 * Checks if the mouse is near a bezier curve
 * @param {Object} a - The starting point
 * @param {Object} b - The ending point
 * @param {number} offsetY - Vertical offset for control points
 * @param {number} offsetX - Horizontal offset for control points
 * @param {number} threshold - The distance threshold
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 * @returns {boolean} - True if mouse is near the curve
 */
function isMouseNearBezierSegments(a, b, offsetY, offsetX, threshold, p5, state) {
  const samples = 50;
  const sag = 39 + Math.abs(a.x - b.x) * 0.065; // Increased by 30% from 30 and 0.05
  let points = [];
  for (let t = 0; t <= 1; t += 1 / samples) {
    const x = bezierPoint(a.x, p5.lerp(a.x, b.x, 0.25) + offsetX, p5.lerp(a.x, b.x, 0.75) + offsetX, b.x, t);
    const y = bezierPoint(a.y, Math.max(a.y, b.y) + sag + offsetY,
                          Math.max(a.y, b.y) + sag + offsetY, b.y, t);
    points.push({ x, y });
  }
  for (let i = 0; i < points.length - 1; i++) {
    if (distToSegment({ x: state.mouseX, y: state.mouseY }, points[i], points[i + 1]) < threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates a point on a bezier curve
 * @param {number} a - Start point
 * @param {number} b - First control point
 * @param {number} c - Second control point
 * @param {number} d - End point
 * @param {number} t - Parameter (0 to 1)
 * @returns {number} - The point on the curve
 */
function bezierPoint(a, b, c, d, t) {
  const t1 = 1 - t;
  return t1 * t1 * t1 * a + 3 * t1 * t1 * t * b + 3 * t1 * t * t * c + t * t * t * d;
}

/**
 * Calculates the distance from a point to a line segment
 * @param {Object} p - The point
 * @param {Object} a - The start of the segment
 * @param {Object} b - The end of the segment
 * @returns {number} - The distance
 */
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

/**
 * Handles the "Clear All Patches" button click
 * @param {Object} state - The application state
 */
function clearAllPatches(state) {
  state.connections = [];
}

/**
 * Handles keyboard press events
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function keyPressed(p5, state) {
  try {
    // Check if the Escape key was pressed
    if (p5.keyCode === 27) { // 27 is the keyCode for Escape
      // If there's an active cable, delete it
      if (state.activeCable) {
        state.activeCable = null;
        state.controlOffsetY = 0;
        state.controlOffsetX = 0;
        console.log('Cable deleted with Escape key');
      }
    }
  } catch (error) {
    console.error('Error in keyPressed function:', error);
  }
}

// Export the functions
export {
  mousePressed,
  mouseMoved,
  isMouseNearBezierSegments,
  distToSegment,
  bezierPoint,
  clearAllPatches,
  keyPressed
};