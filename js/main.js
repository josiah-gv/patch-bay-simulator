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
  pageBackgroundColor,
  cableColors
} from './config/constants.js';

// Import models
import { generatePortsFromRoom, getRoomTitle } from './models/Room.js';
import { getPortAt, isPortConnected } from './models/Port.js';
import { createConnection, drawCable } from './models/Connection.js';

// Import UI modules
import { draw as renderDraw } from './ui/renderer.js';
import { mousePressed, mouseMoved, clearAllPatches, keyPressed } from './ui/interactions.js';

// Import utilities
import { loadRooms, createFallbackRoom } from './utils/csvParser.js';

// Create global app state
const appState = {
  // Room data
  rooms: [],
  currentRoom: null,
  
  // Port and connection data
  ports: [],
  connections: [],
  
  // Active cable state
  activeCable: null,
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
    // Create canvas with initial size (will be adjusted based on room data)
    createCanvas(appState.canvasWidth, appState.canvasHeight);
    document.body.style.backgroundColor = pageBackgroundColor;

    // Load rooms from CSV files
    loadRooms().then((rooms) => {
      console.log('Rooms loaded successfully');
      appState.rooms = rooms;
      appState.currentRoom = rooms[0];
      
      // Generate ports from the current room
      const { ports, updatedCanvasHeight } = generatePortsFromRoom(appState.currentRoom);
      appState.ports = ports;
      
      // Resize canvas if needed
      if (updatedCanvasHeight > appState.canvasHeight) {
        appState.canvasHeight = updatedCanvasHeight;
        resizeCanvas(appState.canvasWidth, appState.canvasHeight);
      }
    }).catch(error => {
      console.error('Error loading rooms:', error);
      // If room loading fails, create a fallback room
      appState.rooms = createFallbackRoom();
      appState.currentRoom = appState.rooms[0];
      
      // Generate ports from the fallback room
      const { ports, updatedCanvasHeight } = generatePortsFromRoom(appState.currentRoom);
      appState.ports = ports;
      
      // Resize canvas if needed
      if (updatedCanvasHeight > appState.canvasHeight) {
        appState.canvasHeight = updatedCanvasHeight;
        resizeCanvas(appState.canvasWidth, appState.canvasHeight);
      }
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
 * p5.js draw function
 * This function is called repeatedly to render the canvas.
 */
window.draw = function() {
  // Update mouse position in the state
  appState.mouseX = mouseX;
  appState.mouseY = mouseY;
  
  // Call the renderer's draw function
  renderDraw(window, appState);
};

/**
 * p5.js mousePressed function
 * This function is called when the mouse is pressed.
 */
window.mousePressed = function() {
  mousePressed(window, appState);
};

/**
 * p5.js mouseMoved function
 * This function is called when the mouse is moved.
 */
window.mouseMoved = function() {
  mouseMoved(window, appState);
};

/**
 * p5.js keyPressed function
 * This function is called when a key is pressed.
 */
window.keyPressed = function() {
  keyPressed(window, appState);
};