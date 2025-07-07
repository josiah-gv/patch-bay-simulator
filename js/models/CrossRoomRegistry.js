/**
 * Cross-Room Port Registry
 * Manages port tracking across multiple rooms and cross-room signal propagation
 */

/**
 * Global registry for tracking ports across all rooms
 * Structure: {
 *   portId: {
 *     rooms: [roomId1, roomId2, ...],
 *     masterSource: { roomId: 'roomId', connected: true },
 *     signals: {
 *       roomId: { color: [r,g,b], sourceRoom: 'roomId' }
 *     },
 *     connections: {
 *       roomId: boolean // tracks if port is connected in each room
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
 * Sets a port as the master source for its portID
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID where the master source is located
 * @param {Array} color - The signal color [r, g, b]
 */
function setMasterSource(portId, roomId, color) {
  if (!portId || !roomId || !color) return;
  
  console.log('Setting master source:', { portId, roomId, color });
  
  if (!crossRoomPortRegistry[portId]) {
    console.log('Port not registered, registering now:', portId, roomId);
    registerPort(portId, roomId);
  }
  
  // Set this port as the master source
  crossRoomPortRegistry[portId].masterSource = {
    roomId: roomId,
    connected: true
  };
  
  // Mark this port as connected in its room
  if (!crossRoomPortRegistry[portId].connections) {
    crossRoomPortRegistry[portId].connections = {};
  }
  crossRoomPortRegistry[portId].connections[roomId] = true;
  
  // Set the signal for this room
  crossRoomPortRegistry[portId].signals[roomId] = {
    color: color,
    sourceRoom: roomId
  };
  
  console.log('Registry after setting master source:', crossRoomPortRegistry[portId]);
  
  // Propagate signal to all other rooms (making them receivers)
  propagateSignalToOtherRooms(portId, roomId, color);
}

/**
 * Sets a signal for a port in a specific room (legacy function for compatibility)
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
  
  // Check if this is the first connection for this portID
  const hasExistingMaster = crossRoomPortRegistry[portId].masterSource;
  
  if (!hasExistingMaster) {
    // This becomes the master source
    setMasterSource(portId, roomId, color);
  } else {
    // This is a connection in another room, mark as connected
    setPortConnectionStatus(portId, roomId, true);
    
    // Set the signal
    crossRoomPortRegistry[portId].signals[roomId] = {
      color: color,
      sourceRoom: crossRoomPortRegistry[portId].masterSource.roomId
    };
  }
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
 * Gets the signal color from other rooms (not the current room)
 * @param {string} portId - The port ID
 * @param {string} currentRoomId - The current room ID
 * @returns {Array|null} - The signal color [r, g, b] from another room or null
 */
function getPortCrossRoomSignalColor(portId, currentRoomId) {
  if (!portId || !currentRoomId || !crossRoomPortRegistry[portId]) return null;
  
  const signals = crossRoomPortRegistry[portId].signals;
  // Find the first signal from a different room
  for (const roomId in signals) {
    const signal = signals[roomId];
    if (signal && signal.sourceRoom !== currentRoomId) {
      return signal.color;
    }
  }
  return null;
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
 * Checks if a port has signals from other rooms (not the current room)
 * @param {string} portId - The port ID
 * @param {string} currentRoomId - The current room ID
 * @returns {boolean} - True if the port has signals from other rooms
 */
function hasPortCrossRoomSignal(portId, currentRoomId) {
  if (!portId || !currentRoomId || !crossRoomPortRegistry[portId]) return false;
  
  // Check if there are any signals from rooms OTHER than the current room
  const signals = crossRoomPortRegistry[portId].signals;
  return Object.keys(signals).some(roomId => {
    const signal = signals[roomId];
    return signal && signal.sourceRoom !== currentRoomId;
  });
}

/**
 * Sets a port connection status in a specific room
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID
 * @param {boolean} connected - Whether the port is connected
 */
function setPortConnectionStatus(portId, roomId, connected) {
  if (!portId || !roomId) return;
  
  if (!crossRoomPortRegistry[portId]) {
    registerPort(portId, roomId);
  }
  
  if (!crossRoomPortRegistry[portId].connections) {
    crossRoomPortRegistry[portId].connections = {};
  }
  
  crossRoomPortRegistry[portId].connections[roomId] = connected;
}

/**
 * Gets the port type for a specific port in a room
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID
 * @returns {string} - 'master', 'receiver', 'transmitter', or 'unconnected'
 */
function getPortType(portId, roomId) {
  if (!portId || !roomId || !crossRoomPortRegistry[portId]) return 'unconnected';
  
  const registry = crossRoomPortRegistry[portId];
  const isConnectedInRoom = registry.connections && registry.connections[roomId];
  const isMasterSource = registry.masterSource && registry.masterSource.roomId === roomId;
  const hasSignalFromOtherRoom = hasPortCrossRoomSignal(portId, roomId);
  
  if (isMasterSource) {
    return 'master';
  } else if (hasSignalFromOtherRoom) {
    return isConnectedInRoom ? 'transmitter' : 'receiver';
  } else {
    return 'unconnected';
  }
}

/**
 * Checks if a port should display a ring
 * @param {string} portId - The port ID
 * @param {string} roomId - The room ID
 * @returns {boolean} - True if the port should show a ring
 */
function shouldPortShowRing(portId, roomId) {
  const portType = getPortType(portId, roomId);
  // Only receivers and transmitters show rings, not master sources
  return portType === 'receiver' || portType === 'transmitter';
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
  setMasterSource,
  setPortConnectionStatus,
  removePortSignal,
  propagateSignalToOtherRooms,
  getPortSignalColor,
  getPortCrossRoomSignalColor,
  getRoomsWithPort,
  hasPortCrossRoomSignal,
  getPortType,
  shouldPortShowRing,
  getPortSignalSourceRoom,
  clearPortSignals,
  getRegistry,
  clearRegistry,
  initializeRegistryFromRooms
};