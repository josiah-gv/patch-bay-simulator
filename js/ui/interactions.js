/**
 * Interactions Module
 * Handles user interactions with the patch bay
 * Updated to work with the layered canvas approach
 */

// Import constants
import { portRadius, LAYERS } from '../config/constants.js';

// Import port utilities
import { getPortAt, isPortConnected } from '../models/Port.js';

// Import connection utilities
import { findConnectionWithPort } from '../models/Connection.js';

// Import layer manager
import { getLayerContext, markLayerAsDirty, markAllLayersAsDirty } from './layerManager.js';

/**
 * Handles mouse press events
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function mousePressed(p5, state) {
  // Get mouse coordinates from the state
  const mouseX = state.mouseX;
  const mouseY = state.mouseY;
  
  // Check if we're clicking on a port first (ports take priority over cable deletion)
  const port = getPortAt(mouseX, mouseY, state.ports, portRadius * 1.5);
  if (port !== null) {
    // If we have an active cable, try to connect it
    if (state.activeCable !== null) {
      // Check if the port is already connected
      const isPortConnected = state.connections.some(conn => 
        conn.from === port.id || conn.to === port.id
      );

      if (!isPortConnected) {
        // Connect the cable
        // Use the stored cable color if available (from picking up an existing cable)
        // Otherwise use the current color from the color cycle
        const cableColor = state.activeCableColor || state.cableColors[state.currentColorIndex];
        
        state.connections.push({
          from: state.activeCable,
          to: port.id,
          color: cableColor
        });
        
        // Only cycle to the next cable color if we used a new color (not a picked up cable)
        if (!state.activeCableColor) {
          state.currentColorIndex = (state.currentColorIndex + 1) % state.cableColors.length;
        }
        
        // Clear the active cable and stored color
        state.activeCable = null;
        state.activeCableColor = null;
        
        // Mark cable and port layers as dirty since we added a connection
        markLayerAsDirty(LAYERS.CABLE);
        markLayerAsDirty(LAYERS.PORT);
      }
    } else {
      // Check if the port is already connected
      const existingConnection = state.connections.find(conn => 
        conn.from === port.id || conn.to === port.id
      );

      if (existingConnection) {
        // If the port is already connected, pick up the cable
        // Remove the connection from the connections array
        const index = state.connections.indexOf(existingConnection);
        state.connections.splice(index, 1);
        
        // Determine which end of the cable to pick up
        // If we clicked on the 'from' port, pick up from the 'to' port
        // If we clicked on the 'to' port, pick up from the 'from' port
        if (existingConnection.from === port.id) {
          state.activeCable = existingConnection.to;
        } else {
          state.activeCable = existingConnection.from;
        }
        
        // Store the cable color so we can reuse it when reconnecting
        state.activeCableColor = existingConnection.color;
        
        // Mark cable and port layers as dirty since we modified a connection
        markLayerAsDirty(LAYERS.CABLE);
        markLayerAsDirty(LAYERS.PORT);
      } else {
        // Start a new cable from this port
        state.activeCable = port.id;
        
        // Mark cable layer as dirty since we're starting a new cable
        markLayerAsDirty(LAYERS.CABLE);
      }
    }
  } else if (state.activeCable !== null) {
    // If we click anywhere else with an active cable, cancel it
    state.activeCable = null;
    state.activeCableColor = null;
    
    // Mark cable layer as dirty since we cancelled the active cable
    markLayerAsDirty(LAYERS.CABLE);
  } else {
    // If we're not clicking on a port and don't have an active cable,
    // check if we're clicking on a connection to delete it
    for (let i = 0; i < state.connections.length; i++) {
      const conn = state.connections[i];
      const a = state.ports.find(port => port.id === conn.from);
      const b = state.ports.find(port => port.id === conn.to);
      
      // Check if both ports exist before checking if mouse is near the cable
      if (a && b && isMouseNearBezierSegments(a, b, 0, 0, 16, p5, state)) {
        state.connections.splice(i, 1);
        // Mark cable and port layers as dirty since we removed a connection
        markLayerAsDirty(LAYERS.CABLE);
        markLayerAsDirty(LAYERS.PORT);
        return;
      }
    }
  }
}

/**
 * Handles mouse movement events
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function mouseMoved(p5, state) {
  // Store previous cursor position
  const prevCursorX = state.cursorX;
  const prevCursorY = state.cursorY;
  
  // Update cursor position in the state
  // This is used for drawing the active cable and other hover effects
  state.cursorX = state.mouseX;
  state.cursorY = state.mouseY;
  
  // Calculate movement delta
  const dx = state.cursorX - prevCursorX;
  const dy = state.cursorY - prevCursorY;
  const significantMovement = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
  
  // If there's an active cable or significant movement, mark the cable layer as dirty
  if (state.activeCable || significantMovement) {
    markLayerAsDirty(LAYERS.CABLE);
  }
  
  // Check if we're hovering over a port
  const hoveredPort = getPortAt(state.mouseX, state.mouseY, state.ports, portRadius * 1.5);
  if (hoveredPort !== null) {
    // Mark the port layer as dirty when hovering over a port
    markLayerAsDirty(LAYERS.PORT);
  }
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
  // Check if a and b are defined and have valid coordinates
  if (!a || !b || typeof a.x !== 'number' || typeof a.y !== 'number' || 
      typeof b.x !== 'number' || typeof b.y !== 'number') {
    console.warn('Invalid port coordinates in isMouseNearBezierSegments');
    return false;
  }
  
  // Check if state has valid mouse coordinates
  if (!state || typeof state.mouseX !== 'number' || typeof state.mouseY !== 'number') {
    console.warn('Invalid state or mouse coordinates in isMouseNearBezierSegments');
    return false;
  }
  
  // Get the mouse coordinates from the state
  const mouseX = state.mouseX;
  const mouseY = state.mouseY;
  
  const samples = 50;
  const sag = 39 + Math.abs(a.x - b.x) * 0.065; // Increased by 30% from 30 and 0.05
  let points = [];
  
  // Linear interpolation function (in case p5.lerp is not available)
  const lerp = (start, end, amt) => {
    return start * (1 - amt) + end * amt;
  };
  
  for (let t = 0; t <= 1; t += 1 / samples) {
    // Use p5.lerp if available, otherwise use our own lerp function
    const lerpFunc = p5 && p5.lerp ? p5.lerp : lerp;
    
    const x = bezierPoint(a.x, lerpFunc(a.x, b.x, 0.25) + offsetX, lerpFunc(a.x, b.x, 0.75) + offsetX, b.x, t);
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
  // Only mark layers as dirty if there were connections to clear
  if (state.connections.length > 0) {
    state.connections = [];
    
    // Mark cable and port layers as dirty since we cleared all connections
    markLayerAsDirty(LAYERS.CABLE);
    markLayerAsDirty(LAYERS.PORT);
  }
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
        state.activeCableColor = null;
        // Reset any control offsets if they exist in the state
        if ('controlOffsetY' in state) state.controlOffsetY = 0;
        if ('controlOffsetX' in state) state.controlOffsetX = 0;
        
        // Mark the cable layer as dirty since we deleted the active cable
        markLayerAsDirty(LAYERS.CABLE);
        
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