/**
 * Cross-Room Port Registry
 * Manages port tracking across multiple rooms and cross-room signal propagation
 */

/**
 * Global registry for tracking ports across all rooms
 * Structure: {
 *   portId: {
 *     rooms: [roomId1, roomId2, ...],
 *     signals: {
 *       roomId: { color: [r,g,b], sourceRoom: 'roomId' }
 *     }
 *   }
 * }
 */
let crossRoomPortRegistry = {};

/**
 * Registers a port in the cross-room registry
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID where the port exists
 */
function registerPort(portId, roomId) {
  if (!portId || !roomId) return;
  
  if (!crossRoomPortRegistry[portId]) {
    crossRoomPortRegistry[portId] = {
      rooms: [],
      signals: {}
    };
  }
  
  if (!crossRoomPortRegistry[portId].rooms.includes(roomId)) {
    crossRoomPortRegistry[portId].rooms.push(roomId);
  }
}

/**
 * Unregisters a port from a specific room
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID to remove the port from
 */
function unregisterPort(portId, roomId) {
  if (!portId || !roomId || !crossRoomPortRegistry[portId]) return;
  
  const roomIndex = crossRoomPortRegistry[portId].rooms.indexOf(roomId);
  if (roomIndex > -1) {
    crossRoomPortRegistry[portId].rooms.splice(roomIndex, 1);
  }
  
  // Remove signal for this room
  delete crossRoomPortRegistry[portId].signals[roomId];
  
  // Clean up if no rooms left
  if (crossRoomPortRegistry[portId].rooms.length === 0) {
    delete crossRoomPortRegistry[portId];
  }
}

/**
 * Sets a signal for a port in a specific room
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID where the signal originates
 * @param {Array} color - The signal color [r, g, b]
 */
function setPortSignal(portId, roomId, color) {
  if (!portId || !roomId || !color) return;
  
  console.log('Setting port signal:', { portId, roomId, color });
  
  if (!crossRoomPortRegistry[portId]) {
    console.log('Port not registered, registering now:', portId, roomId);
    registerPort(portId, roomId);
  }
  
  crossRoomPortRegistry[portId].signals[roomId] = {
    color: color,
    sourceRoom: roomId
  };
  
  console.log('Registry after setting signal:', crossRoomPortRegistry[portId]);
  
  // Propagate signal to all other rooms with this port
  propagateSignalToOtherRooms(portId, roomId, color);
}

/**
 * Removes a signal for a port in a specific room
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID to remove the signal from
 */
function removePortSignal(portId, roomId) {
  if (!portId || !roomId || !crossRoomPortRegistry[portId]) return;
  
  delete crossRoomPortRegistry[portId].signals[roomId];
  
  // If this was the source room, clear signals from all other rooms
  const remainingSignals = Object.values(crossRoomPortRegistry[portId].signals);
  const sourceSignal = remainingSignals.find(signal => signal.sourceRoom === roomId);
  
  if (sourceSignal || remainingSignals.length === 0) {
    // Clear all propagated signals
    crossRoomPortRegistry[portId].signals = {};
  }
}

/**
 * Propagates a signal from one room to all other rooms with the same port ID
 * @param {string} portId - The port ID
 * @param {string} sourceRoomId - The room ID where the signal originates
 * @param {Array} color - The signal color
 */
function propagateSignalToOtherRooms(portId, sourceRoomId, color) {
  if (!crossRoomPortRegistry[portId]) return;
  
  const rooms = crossRoomPortRegistry[portId].rooms;
  console.log('Propagating signal to other rooms:', { portId, sourceRoomId, rooms, color });
  
  rooms.forEach(roomId => {
    if (roomId !== sourceRoomId) {
      crossRoomPortRegistry[portId].signals[roomId] = {
        color: color,
        sourceRoom: sourceRoomId
      };
      console.log('Signal propagated to room:', roomId, 'for port:', portId);
    }
  });
  
  console.log('Final registry state for port:', portId, crossRoomPortRegistry[portId]);
}

/**
 * Gets the signal color for a port in a specific room
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID
 * @returns {Array|null} - The signal color [r, g, b] or null if no signal
 */
function getPortSignalColor(portId, roomId) {
  if (!portId || !roomId || !crossRoomPortRegistry[portId]) return null;
  
  const signal = crossRoomPortRegistry[portId].signals[roomId];
  return signal ? signal.color : null;
}

/**
 * Gets all rooms that contain a specific port ID
 * @param {string} portId - The port ID
 * @returns {Array} - Array of room IDs
 */
function getRoomsWithPort(portId) {
  if (!portId || !crossRoomPortRegistry[portId]) return [];
  return [...crossRoomPortRegistry[portId].rooms];
}

/**
 * Checks if a port has any cross-room signals
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID to check
 * @returns {boolean} - True if the port has cross-room signals
 */
function hasPortCrossRoomSignal(portId, roomId) {
  if (!portId || !roomId || !crossRoomPortRegistry[portId]) return false;
  
  const signal = crossRoomPortRegistry[portId].signals[roomId];
  return signal && signal.sourceRoom !== roomId;
}

/**
 * Gets the source room for a port's signal
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID to check
 * @returns {string|null} - The source room ID or null
 */
function getPortSignalSourceRoom(portId, roomId) {
  if (!portId || !roomId || !crossRoomPortRegistry[portId]) return null;
  
  const signal = crossRoomPortRegistry[portId].signals[roomId];
  return signal ? signal.sourceRoom : null;
}

/**
 * Clears all signals for a specific port
 * @param {string} portId - The port ID
 */
function clearPortSignals(portId) {
  if (!portId || !crossRoomPortRegistry[portId]) return;
  crossRoomPortRegistry[portId].signals = {};
}

/**
 * Gets the entire registry (for debugging)
 * @returns {Object} - The complete cross-room port registry
 */
function getRegistry() {
  return crossRoomPortRegistry;
}

/**
 * Clears the entire registry
 */
function clearRegistry() {
  crossRoomPortRegistry = {};
}

/**
 * Initializes the registry with existing ports from all rooms
 * @param {Object} rooms - Object containing all room data
 */
function initializeRegistryFromRooms(rooms) {
  clearRegistry();
  
  if (!rooms || typeof rooms !== 'object') return;
  
  Object.keys(rooms).forEach(roomId => {
    const room = rooms[roomId];
    if (room && room.ports && Array.isArray(room.ports)) {
      room.ports.forEach(port => {
        if (port && port.id) {
          registerPort(port.id, roomId);
        }
      });
    }
  });
}

// Export the functions
export {
  registerPort,
  unregisterPort,
  setPortSignal,
  removePortSignal,
  propagateSignalToOtherRooms,
  getPortSignalColor,
  getRoomsWithPort,
  hasPortCrossRoomSignal,
  getPortSignalSourceRoom,
  clearPortSignals,
  getRegistry,
  clearRegistry,
  initializeRegistryFromRooms
};