/**
 * Port Model Module
 * Handles port-related functionality
 */

// Import constants
import { portRadius } from '../config/constants.js';

/**
 * Finds a port at the given coordinates
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @param {Array} ports - The array of ports to search
 * @param {number} radius - The radius to check (defaults to portRadius)
 * @returns {Object|null} - The port at the given coordinates, or null if none found
 */
function getPortAt(x, y, ports, radius = portRadius) {
  if (!ports || !Array.isArray(ports) || ports.length === 0) {
    return null;
  }
  
  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
    console.warn('Invalid coordinates passed to getPortAt:', x, y);
    return null;
  }
  
  const checkRadius = radius || portRadius;
  
  // Find the closest port within the radius
  let closestPort = null;
  let closestDistance = checkRadius; // Start with the maximum allowed distance
  
  for (let i = 0; i < ports.length; i++) {
    const port = ports[i];
    
    // Check if port has valid coordinates
    if (!port || typeof port.x !== 'number' || typeof port.y !== 'number' || 
        isNaN(port.x) || isNaN(port.y)) {
      continue;
    }
    
    const distance = dist(x, y, port.x, port.y);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPort = port;
    }
  }
  
  return closestPort;
}

/**
 * Checks if a port is connected
 * @param {Object} port - The port to check
 * @param {Array} connections - The array of connections
 * @returns {boolean} - True if the port is connected, false otherwise
 */
function isPortConnected(port, connections) {
  if (!port || !connections || !Array.isArray(connections)) {
    return false;
  }
  
  // Get the port's index in the state.ports array
  // This is needed because connections store port indices, not port objects
  const portIndex = port.id;
  
  return connections.some(conn => {
    if (!conn) return false;
    
    // Check for different connection formats
    if (conn.port1 && conn.port2) {
      return conn.port1 === port || conn.port2 === port;
    } else if (conn.a && conn.b) {
      return conn.a === port || conn.b === port;
    } else if (conn.from !== undefined && conn.to !== undefined) {
      return conn.from === portIndex || conn.to === portIndex;
    }
    
    return false;
  });
}

/**
 * Helper function to calculate distance between two points
 * @param {number} x1 - First point x coordinate
 * @param {number} y1 - First point y coordinate
 * @param {number} x2 - Second point x coordinate
 * @param {number} y2 - Second point y coordinate
 * @returns {number} - The distance between the points
 */
function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

/**
 * Gets all ports in a specific section
 * @param {Array} ports - The array of all ports
 * @param {number} sectionIndex - The section index to filter by
 * @param {string} row - Optional row to filter by ('top' or 'bottom')
 * @returns {Array} - The filtered ports
 */
function getPortsBySection(ports, sectionIndex, row = null) {
  if (!ports || !Array.isArray(ports)) {
    return [];
  }
  
  return ports.filter(port => {
    if (port.section !== sectionIndex) {
      return false;
    }
    
    if (row !== null && port.row !== row) {
      return false;
    }
    
    return true;
  });
}

// Export the functions
export {
  getPortAt,
  isPortConnected,
  dist,
  getPortsBySection
};