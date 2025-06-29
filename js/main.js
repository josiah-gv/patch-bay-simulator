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
      appState.currentRoom = rooms[0];
      
      // Generate ports from the current room
      const { ports, updatedCanvasHeight } = generatePortsFromRoom(appState.currentRoom);
      appState.ports = ports;
      
      // Resize canvas if needed
      if (updatedCanvasHeight > appState.canvasHeight) {
        appState.canvasHeight = updatedCanvasHeight;
        // Resize both p5 canvas and our layered canvases
        resizeCanvas(appState.canvasWidth, appState.canvasHeight);
        resizeAllLayers(appState.canvasWidth, appState.canvasHeight);
        
        // Update canvas container size in CSS
        const container = document.getElementById('canvas-container');
        if (container) {
          container.style.width = `${appState.canvasWidth}px`;
          container.style.height = `${appState.canvasHeight}px`;
        }
      } else {
        // Mark all layers as dirty even if we didn't resize
        markAllLayersAsDirty();
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
        // Resize both p5 canvas and our layered canvases
        resizeCanvas(appState.canvasWidth, appState.canvasHeight);
        resizeAllLayers(appState.canvasWidth, appState.canvasHeight);
        
        // Update canvas container size in CSS
        const container = document.getElementById('canvas-container');
        if (container) {
          container.style.width = `${appState.canvasWidth}px`;
          container.style.height = `${appState.canvasHeight}px`;
        }
      } else {
        // Mark all layers as dirty even if we didn't resize
        markAllLayersAsDirty();
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
  try {
    // Get the canvas container element
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
      console.error('Canvas container not found');
      return;
    }
    
    // Get the p5.js canvas element
    const p5Canvas = document.querySelector('canvas');
    if (!p5Canvas) {
      console.error('p5.js canvas not found');
      return;
    }
    
    // Calculate the mouse position directly using p5.js mouseX/mouseY
    // p5.js already handles the scaling and positioning internally
    appState.mouseX = mouseX;
    appState.mouseY = mouseY;
    
    // Log mouse coordinates for debugging
    // console.log('Mouse position:', appState.mouseX, appState.mouseY);
    
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
  // Only process mouse events if they occur within the canvas bounds
  if (mouseX >= 0 && mouseX < appState.canvasWidth && 
      mouseY >= 0 && mouseY < appState.canvasHeight) {
    // Update mouse position in the state before processing the event
    appState.mouseX = mouseX;
    appState.mouseY = mouseY;
    mousePressed(window, appState);
  }
};

/**
 * p5.js mouseMoved function
 * This function is called when the mouse is moved.
 * Events are captured on the p5.js canvas but processed based on application state
 */
window.mouseMoved = function() {
  // Update mouse position in the state regardless of whether it's in bounds
  // This allows for smoother transitions when moving in and out of the canvas
  appState.mouseX = mouseX;
  appState.mouseY = mouseY;
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