/**
 * Main Application Entry Point
 * 
 * This file serves as the entry point for the Patch Bay application.
 * It imports all necessary modules, creates a global state object,
 * defines p5.js setup and draw functions, and initializes the application.
 */

// Import constants
import {
  canvasWidth,
  canvasHeight,
  containerWidth,
  containerHeight,
  pageBackgroundColor,
  cableColors,
  fontFamily
} from './config/constants.js';

// Import models
import { generatePortsFromRoom, getRoomTitle } from './models/Room.js';
import { getPortAt, isPortConnected } from './models/Port.js';
import { createConnection, drawCable } from './models/Connection.js';

// Import UI modules
import { draw as renderDraw } from './ui/renderer.js';
import { mousePressed, mouseMoved, clearAllPatches, keyPressed } from './ui/interactions.js';
import { initializeLayers, resizeAllLayers, areLayersInitialized, markAllLayersAsDirty } from './ui/layerManager.js';

// Import utilities
import { loadRooms, createFallbackRoom } from './utils/csvParser.js';

// Create global app state
const appState = {
  // Room data
  rooms: [],
  roomStates: {}, // Track visibility and data for each room
  activeRoomId: null, // Track the currently active room
  
  // Port and connection data
  ports: [],
  connections: [], // Temporary array for active room's connections
  
  // Active cable state
  activeCable: null,
  activeCableColor: null,
  cursorX: 0,
  cursorY: 0,
  prevCursorX: 0,
  prevCursorY: 0,
  controlOffsetY: 0,
  controlOffsetX: 0,
  
  // UI state
  hoverConnection: null,
  mouseX: 0,
  mouseY: 0,
  closestAvailablePort: null, // Track closest available port even when not holding a cable
  
  // Canvas dimensions
  canvasWidth: canvasWidth,
  canvasHeight: canvasHeight,
  
  // Cable colors
  cableColors: cableColors,
  currentColorIndex: 0
};

/**
 * p5.js setup function
 * This function is called once when the program starts.
 */
window.setup = function() {
  try {
    // Set CSS custom properties to match canvas dimensions
    document.documentElement.style.setProperty('--container-width', `${containerWidth}px`);
    document.documentElement.style.setProperty('--container-height', `${containerHeight}px`);
    
    // Create a p5.js canvas for handling mouse events and other p5 functionality
    // This canvas will be positioned on top of our layered canvases but with opacity 0
    createCanvas(appState.canvasWidth, appState.canvasHeight);
    // Allow p5.js to use the device's pixel density for crisp rendering
    // We're handling DPI scaling in our custom canvas layers
    // Make the p5 canvas transparent but keep it positioned correctly for mouse events
    const p5Canvas = document.querySelector('canvas');
    p5Canvas.style.opacity = '0';
    p5Canvas.style.position = 'absolute';
    p5Canvas.style.top = '0';
    p5Canvas.style.left = '0';
    p5Canvas.style.width = '100%';
    p5Canvas.style.height = '100%';
    p5Canvas.style.zIndex = '10'; // Place it on top for mouse events
    p5Canvas.style.pointerEvents = 'auto'; // Ensure it can capture mouse events
    
    // Add the p5 canvas to the canvas container
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      // Remove the canvas from its current position in the DOM
      p5Canvas.parentNode.removeChild(p5Canvas);
      // Add it to the canvas container
      canvasContainer.appendChild(p5Canvas);
    }
    
    document.body.style.backgroundColor = pageBackgroundColor;
    
    console.log('Canvas created with dimensions:', appState.canvasWidth, 'x', appState.canvasHeight);
    
    // Initialize the layered canvas system
    if (!initializeLayers()) {
      console.error('Failed to initialize canvas layers');
    } else {
      // Mark all layers as dirty after initialization
      markAllLayersAsDirty();
    }
    
    // Set a higher frame rate to match high refresh rate monitors
    frameRate(120); // Increase to 120 FPS for smoother animations
    
    // Set the default font for the application
    textFont(fontFamily);

    // Load rooms from CSV files
    loadRooms().then((rooms) => {
      console.log('Rooms loaded successfully');
      appState.rooms = rooms;
      
      // Initialize room states for each room
      rooms.forEach(room => {
        appState.roomStates[room.name] = {
          visible: false,
          ports: [],
          connections: [], // Per-room connection storage
          yOffset: 0 // Will be calculated when rooms are positioned (legacy)
        };
      });
      
      // Generate toggle buttons for all rooms
      generateRoomToggleButtons(rooms);
      
      // Mark all layers as dirty
      markAllLayersAsDirty();
    }).catch(error => {
      console.error('Error loading rooms:', error);
      // If room loading fails, create a fallback room
      const fallbackRooms = createFallbackRoom();
      appState.rooms = Array.isArray(fallbackRooms) ? fallbackRooms : [fallbackRooms];
      
      // Initialize room states for fallback room
      appState.rooms.forEach(room => {
        appState.roomStates[room.name] = {
          visible: false,
          ports: [],
          connections: [], // Per-room connection storage
          yOffset: 0 // Legacy field
        };
      });
      
      // Generate toggle buttons for fallback rooms
      generateRoomToggleButtons(appState.rooms);
      
      // Mark all layers as dirty
      markAllLayersAsDirty();
    });

    // Create a Clear All button
    const btn = createButton("Clear All Patches");
    btn.position(10, appState.canvasHeight + 10);
    btn.mousePressed(() => clearAllPatches(appState));
    
    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Error in setup function:', error);
  }
};

/**
 * Show room function
 * Displays a specific room on the canvas (single room display)
 */
function showRoom(event) {
  const roomName = event.detail.roomName;
  const room = appState.rooms.find(r => r.name === roomName);
  
  if (room && appState.roomStates[roomName]) {
    // Save connections for currently active room before switching
    if (appState.activeRoomId && appState.activeRoomId !== roomName) {
      saveConnectionsForRoom(appState.activeRoomId);
      
      // Hide the currently active room
      if (appState.roomStates[appState.activeRoomId]) {
        appState.roomStates[appState.activeRoomId].visible = false;
        appState.roomStates[appState.activeRoomId].ports = [];
      }
    }
    
    // Set new active room
    appState.activeRoomId = roomName;
    appState.roomStates[roomName].visible = true;
    
    // Generate ports from the room at origin (0,0) - no Y offset
    const { ports } = generatePortsFromRoom(room);
    appState.roomStates[roomName].ports = ports;
    
    // Load connections for the newly active room
    loadConnectionsForRoom(roomName);
    
    // Recalculate combined ports and connections
    updateCombinedPortsAndConnections();
    
    // Resize canvas to fit the active room
    resizeCanvasToActiveRoom();
    
    // Mark all layers as dirty to trigger redraw
    markAllLayersAsDirty();
    console.log(`Room '${roomName}' displayed as active room`);
  }
}

/**
 * Hide room function
 * Hides a specific room from the canvas (single room display)
 */
function hideRoom(event) {
  const roomName = event.detail.roomName;
  
  if (appState.roomStates[roomName]) {
    // Save connections before hiding if this is the active room
    if (appState.activeRoomId === roomName) {
      saveConnectionsForRoom(roomName);
      appState.activeRoomId = null;
    }
    
    appState.roomStates[roomName].visible = false;
    appState.roomStates[roomName].ports = [];
    
    // Clear any active cable if it was from this room
    if (appState.activeCable) {
      appState.activeCable = null;
    }
    
    // Clear connections from global state (they're saved in room state)
    appState.connections = [];
    
    // Recalculate combined ports and connections
    updateCombinedPortsAndConnections();
    
    // Mark all layers as dirty to trigger redraw
    markAllLayersAsDirty();
    console.log(`Room '${roomName}' hidden`);
  }
}

/**
 * Generate toggle buttons for all rooms
 */
function generateRoomToggleButtons(rooms) {
  const roomGrid = document.querySelector('.room-grid');
  if (!roomGrid) {
    console.error('Room grid container not found');
    return;
  }
  
  // Clear existing buttons
  roomGrid.innerHTML = '';
  
  // Create a button for each room
   rooms.forEach(room => {
     const button = document.createElement('div');
     button.className = 'room-card inactive';
     button.id = `room-toggle-${room.name.replace(/\s+/g, '-').toLowerCase()}`;
     
     // Determine icon based on room name
     let icon = '🎛️'; // Default icon
     if (room.name.toLowerCase().includes('server')) {
       icon = '🖥️';
     } else if (room.name.toLowerCase().includes('foley')) {
       icon = '🎬';
     } else if (room.name.toLowerCase().includes('studio')) {
       icon = '🎙️';
     } else if (room.name.toLowerCase().includes('control')) {
       icon = '🎚️';
     }
     
     button.innerHTML = `
       <span class="room-icon">${icon}</span>
       <h3>${room.name}</h3>
       <p>Toggle room display</p>
     `;
    
    // Add click event listener for single room display
    button.addEventListener('click', () => {
      const isActive = button.classList.contains('active');
      
      if (isActive) {
        // Hide the currently active room
        button.classList.remove('active');
        button.classList.add('inactive');
        window.dispatchEvent(new CustomEvent('hideRoom', { 
          detail: { roomName: room.name } 
        }));
      } else {
        // Deactivate all other room buttons first
        const allRoomButtons = document.querySelectorAll('.room-card');
        allRoomButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.classList.add('inactive');
        });
        
        // Activate this room button
        button.classList.remove('inactive');
        button.classList.add('active');
        
        // Show this room (which will automatically hide others)
        window.dispatchEvent(new CustomEvent('showRoom', { 
          detail: { roomName: room.name } 
        }));
      }
    });
    
    roomGrid.appendChild(button);
  });
}

// Legacy calculateCanvasHeight function removed - no longer needed for single room display

/**
 * Update combined ports and connections from active room only
 */
function updateCombinedPortsAndConnections() {
  // Clear ports array
  appState.ports = [];
  
  // Only process the active room
  if (appState.activeRoomId && appState.roomStates[appState.activeRoomId]) {
    const activeRoomState = appState.roomStates[appState.activeRoomId];
    if (activeRoomState.visible) {
      appState.ports.push(...activeRoomState.ports);
    }
    
    // Debug: Log active room info
    console.log(`Active room '${appState.activeRoomId}': ports=${activeRoomState.ports.length}, connections=${appState.connections.length}`);
  } else {
    console.log('No active room set');
  }
  
  // Debug: Log combined ports info
  console.log(`Total ports: ${appState.ports.length}`);
  if (appState.ports.length > 0) {
    console.log(`First few port IDs: ${appState.ports.slice(0, 5).map(p => p.id).join(', ')}`);
  }
}

/**
 * Save connections for a specific room
 * @param {string} roomId - The ID/name of the room to save connections for
 */
function saveConnectionsForRoom(roomId) {
  if (roomId && appState.roomStates[roomId]) {
    appState.roomStates[roomId].connections = [...appState.connections];
    console.log(`Saved ${appState.connections.length} connections for room '${roomId}'`);
  }
}

/**
 * Load connections for a specific room
 * @param {string} roomId - The ID/name of the room to load connections from
 */
function loadConnectionsForRoom(roomId) {
  if (roomId && appState.roomStates[roomId]) {
    appState.connections = [...appState.roomStates[roomId].connections];
    console.log(`Loaded ${appState.connections.length} connections for room '${roomId}'`);
  } else {
    appState.connections = [];
  }
}

/**
 * Resize canvas to fit the active room optimally
 */
function resizeCanvasToActiveRoom() {
  if (appState.activeRoomId && appState.roomStates[appState.activeRoomId]) {
    const activeRoom = appState.rooms.find(r => r.name === appState.activeRoomId);
    if (activeRoom) {
      const { updatedCanvasHeight, actualRoomHeight } = generatePortsFromRoom(activeRoom);
      const roomWidth = appState.canvasWidth; // Keep original width
      const roomHeight = actualRoomHeight;
      
      // Update canvas dimensions
      appState.canvasHeight = roomHeight;
      
      // Resize both p5 canvas and layered canvases
      resizeCanvas(roomWidth, roomHeight);
      resizeAllLayers(roomWidth, roomHeight);
      
      console.log(`Canvas resized to ${roomWidth}x${roomHeight} for room '${appState.activeRoomId}'`);
    }
  }
}

// Add event listeners for room show/hide
window.addEventListener('showRoom', showRoom);
window.addEventListener('hideRoom', hideRoom);

// Make functions globally accessible
window.saveConnectionsForRoom = saveConnectionsForRoom;
window.loadConnectionsForRoom = loadConnectionsForRoom;

// Global mouse tracking variables
let globalMouseX = 0;
let globalMouseY = 0;

// Add global mouse event listeners to track actual page coordinates
document.addEventListener('mousemove', function(event) {
  globalMouseX = event.clientX;
  globalMouseY = event.clientY;
});

/**
 * p5.js draw function
 * This function is called continuously to render the application.
 * It updates the mouse position and calls the renderer.
 */
window.draw = function() {
  try {
    // Get the canvas container element to calculate proper mouse coordinates
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      const rect = canvasContainer.getBoundingClientRect();
      // Calculate mouse position relative to the canvas container using global mouse coordinates
      const adjustedMouseX = globalMouseX - rect.left;
      const adjustedMouseY = globalMouseY - rect.top;
      
      // Ensure we're within bounds before scaling
      if (adjustedMouseX >= 0 && adjustedMouseX <= rect.width && 
          adjustedMouseY >= 0 && adjustedMouseY <= rect.height) {
        // Fix: Don't scale by canvas dimensions, use direct pixel coordinates
        // The canvases are already handling DPR scaling internally
        appState.mouseX = adjustedMouseX;
        appState.mouseY = adjustedMouseY;
      }
    } else {
      // Fallback to direct p5.js coordinates if container not found
      appState.mouseX = mouseX;
      appState.mouseY = mouseY;
    }
    
    // Remove excessive logging that was causing performance issues
    
    // Make sure layers are initialized before drawing
    if (areLayersInitialized()) {
      // Call the renderer's draw function
      renderDraw(window, appState);
    } else {
      console.warn('Canvas layers not initialized yet, skipping draw');
    }
  } catch (error) {
    console.error('Error in draw function:', error);
  }
};

/**
 * p5.js mousePressed function
 * This function is called when the mouse is pressed.
 * Events are captured on the p5.js canvas but processed based on application state
 */
window.mousePressed = function() {
  // Get the canvas container element to calculate proper mouse coordinates
  const canvasContainer = document.getElementById('canvas-container');
  if (canvasContainer) {
    const rect = canvasContainer.getBoundingClientRect();
    // Calculate mouse position relative to the canvas container using global coordinates
    const adjustedMouseX = globalMouseX - rect.left;
    const adjustedMouseY = globalMouseY - rect.top;
    
    // Only process mouse events if they occur within the canvas container bounds
    if (adjustedMouseX >= 0 && adjustedMouseX <= rect.width && 
        adjustedMouseY >= 0 && adjustedMouseY <= rect.height) {
      // Fix: Use direct pixel coordinates, same as in draw function
      appState.mouseX = adjustedMouseX;
      appState.mouseY = adjustedMouseY;
      mousePressed(window, appState);
    }
  }
};

/**
 * p5.js mouseMoved function
 * This function is called when the mouse is moved.
 * Events are captured on the p5.js canvas but processed based on application state
 */
window.mouseMoved = function() {
  // Get the canvas container element to calculate proper mouse coordinates
  const canvasContainer = document.getElementById('canvas-container');
  if (canvasContainer) {
    const rect = canvasContainer.getBoundingClientRect();
    // Calculate mouse position relative to the canvas container using global coordinates
    const adjustedMouseX = globalMouseX - rect.left;
    const adjustedMouseY = globalMouseY - rect.top;
    
    // Fix: Use direct pixel coordinates, same as in draw function
    appState.mouseX = adjustedMouseX;
    appState.mouseY = adjustedMouseY;
  } else {
    // Fallback to direct p5.js coordinates if container not found
    appState.mouseX = mouseX;
    appState.mouseY = mouseY;
  }
  mouseMoved(window, appState);
};

/**
 * p5.js keyPressed function
 * This function is called when a key is pressed.
 * Key events are processed globally but actions depend on application state
 */
window.keyPressed = function() {
  keyPressed(window, appState);
};

// Note: Dynamic scaling system removed
