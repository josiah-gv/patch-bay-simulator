/**
 * Connection Model Module
 * Handles connection-related functionality
 */

// Import constants
import { cableSagBase, cableSagFactor, cableHoverThreshold } from '../config/constants.js';

// Import port utilities
import { dist } from '../models/Port.js';

/**
 * Creates a new connection between two ports with room context
 * @param {Object} portA - The first port
 * @param {Object} portB - The second port
 * @param {Array} color - The color of the connection
 * @param {string} roomId - The room ID where this connection exists
 * @returns {Object} - The created connection
 */
function createConnection(portA, portB, color, roomId = null) {
  // Support both legacy format (port IDs) and new format (port objects)
  const portAId = typeof portA === 'string' ? portA : portA.id;
  const portBId = typeof portB === 'string' ? portB : portB.id;
  
  return {
    // Legacy format for backward compatibility
    from: portAId,
    to: portBId,
    color: color,
    
    // New room-scoped format
    roomId: roomId,
    portA: {
      id: portAId,
      roomId: roomId
    },
    portB: {
      id: portBId,
      roomId: roomId
    },
    
    // Legacy object references (deprecated but maintained for compatibility)
    a: portA,
    b: portB
  };
}

/**
 * Checks if the mouse is near a bezier curve
 * @param {Object} a - The starting point
 * @param {Object} b - The ending point
 * @param {number} offsetY - Vertical offset for control points
 * @param {number} offsetX - Horizontal offset for control points
 * @param {number} threshold - The distance threshold
 * @param {number} mouseX - Mouse X position
 * @param {number} mouseY - Mouse Y position
 * @returns {boolean} - True if mouse is near the curve
 */
function isMouseNearBezierSegments(a, b, offsetY, offsetX, threshold, mouseX, mouseY) {
  const samples = 50;
  const sag = cableSagBase + Math.abs(a.x - b.x) * cableSagFactor;
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
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} amt - Amount (0 to 1)
 * @returns {number} - The interpolated value
 */
function lerp(start, end, amt) {
  return start + (end - start) * amt;
}

/**
 * Draws a cable between two points
 * @param {Object} p5 - The p5 instance
 * @param {Object} a - The starting point
 * @param {Object} b - The ending point
 * @param {number} offsetY - Vertical offset for control points
 * @param {number} offsetX - Horizontal offset for control points
 */
function drawCable(p5, a, b, offsetY = 0, offsetX = 0) {
  const sag = cableSagBase + Math.abs(a.x - b.x) * cableSagFactor;

  const cp1X = lerp(a.x, b.x, 0.25) + offsetX;
  const cp2X = lerp(a.x, b.x, 0.75) + offsetX;

  const controlY = Math.max(a.y, b.y) + sag + offsetY;

  p5.bezier(a.x, a.y, cp1X, controlY, cp2X, controlY, b.x, b.y);
}

/**
 * Finds a connection that contains the specified port within a specific room
 * @param {Object} port - The port to check
 * @param {Array} connections - The array of connections
 * @param {string} roomId - Optional room ID to scope the search
 * @returns {Object|null} - The connection containing the port, or null if none found
 */
function findConnectionWithPort(port, connections, roomId = null) {
  if (!port || !connections || !Array.isArray(connections)) {
    return null;
  }
  
  const portId = typeof port === 'string' ? port : port.id;
  
  return connections.find(conn => {
    if (!conn) return false;
    
    // If room ID is specified, only check connections in that room
    if (roomId && conn.roomId && conn.roomId !== roomId) {
      return false;
    }
    
    // Check both legacy and new formats
    return (conn.a === port || conn.b === port || 
            conn.from === portId || conn.to === portId ||
            (conn.portA && conn.portA.id === portId) ||
            (conn.portB && conn.portB.id === portId));
  });
}

/**
 * Finds all connections for a specific room
 * @param {Array} connections - The array of connections
 * @param {string} roomId - The room ID to filter by
 * @returns {Array} - Array of connections for the specified room
 */
function findConnectionsForRoom(connections, roomId) {
  if (!connections || !Array.isArray(connections) || !roomId) {
    return [];
  }
  
  return connections.filter(conn => {
    if (!conn) return false;
    return conn.roomId === roomId;
  });
}

/**
 * Checks if a port is connected within a specific room
 * @param {Object|string} port - The port to check (object or ID)
 * @param {Array} connections - The array of connections
 * @param {string} roomId - The room ID to scope the search
 * @returns {boolean} - True if the port is connected in the specified room
 */
function isPortConnectedInRoom(port, connections, roomId) {
  return findConnectionWithPort(port, connections, roomId) !== null;
}

// Export the functions
export {
  createConnection,
  isMouseNearBezierSegments,
  distToSegment,
  bezierPoint,
  lerp,
  drawCable,
  findConnectionWithPort,
  findConnectionsForRoom,
  isPortConnectedInRoom
};