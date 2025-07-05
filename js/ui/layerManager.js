/**
 * Layer Manager Module
 * Handles the creation and management of canvas layers for the patch bay
 */

// Import constants
import { canvasWidth, canvasHeight, layerIds, LAYERS } from '../config/constants.js';

// Canvas contexts for each layer
let canvasContexts = {};

// Flag to track if layers have been initialized
let layersInitialized = false;

// Dirty flags to track which layers need redrawing
let dirtyLayers = {};

// Initialize all layers as dirty by default
function initializeDirtyFlags() {
  layerIds.forEach(layerId => {
    dirtyLayers[layerId] = true;
  });
}

/**
 * Initialize all canvas layers
 * This function should be called once during application setup
 * @returns {boolean} - Whether initialization was successful
 */
export function initializeLayers() {
  // Get all canvas elements
  let allLayersFound = true;
  
  for (const layerId of layerIds) {
    const canvas = document.getElementById(layerId);
    
    if (!canvas) {
      console.error(`Canvas element with ID ${layerId} not found`);
      allLayersFound = false;
      continue;
    }
    
    // Get and store the 2D context
    const context = canvas.getContext('2d');
    
    // Set pixel ratio based on device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    // Set the canvas dimensions accounting for device pixel ratio
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    // Scale the context to counter the increased canvas size
    context.scale(dpr, dpr);
    // Set CSS size to maintain physical dimensions
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvasContexts[layerId] = context;
    
    // Clear the canvas initially using logical dimensions
    context.clearRect(0, 0, canvasWidth, canvasHeight);
  }
  
  // Initialize dirty flags for all layers
  initializeDirtyFlags();
  
  // Set initialization flag
  layersInitialized = allLayersFound;
  
  if (layersInitialized) {
    console.log('Canvas layers initialized successfully');
  } else {
    console.warn('Some canvas layers could not be initialized');
  }
  
  return layersInitialized;
}

/**
 * Check if layers have been initialized
 * @returns {boolean} - Whether layers have been initialized
 */
export function areLayersInitialized() {
  return layersInitialized;
}

/**
 * Check if a specific layer exists
 * @param {string} layerId - The ID of the layer to check
 * @returns {boolean} - Whether the layer exists
 */
export function doesLayerExist(layerId) {
  if (!layersInitialized) {
    console.error('Canvas layers have not been initialized. Call initializeLayers() first.');
    return false;
  }
  
  return !!canvasContexts[layerId];
}

/**
 * Get the context for a specific layer
 * @param {string} layerId - The ID of the layer to get the context for
 * @returns {CanvasRenderingContext2D|null} - The 2D context for the specified layer
 */
export function getLayerContext(layerId) {
  if (!layersInitialized) {
    console.error('Canvas layers have not been initialized. Call initializeLayers() first.');
    return null;
  }
  
  if (!canvasContexts[layerId]) {
    console.error(`Context for layer ${layerId} not found`);
    return null;
  }
  
  return canvasContexts[layerId];
}

/**
 * Clear a specific layer
 * @param {string} layerId - The ID of the layer to clear
 * @returns {boolean} - Whether the layer was successfully cleared
 */
export function clearLayer(layerId) {
  if (!layersInitialized) {
    console.error('Canvas layers have not been initialized. Call initializeLayers() first.');
    return false;
  }
  
  const context = getLayerContext(layerId);
  
  if (context) {
    // Clear the canvas using logical dimensions (DPI scaling is already applied)
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    // Mark the layer as dirty after clearing
    markLayerAsDirty(layerId);
    return true;
  }
  
  return false;
}

/**
 * Clear all layers
 * @returns {boolean} - Whether all layers were successfully cleared
 */
export function clearAllLayers() {
  if (!layersInitialized) {
    console.error('Canvas layers have not been initialized. Call initializeLayers() first.');
    return false;
  }
  
  let allLayersCleared = true;
  
  for (const layerId of layerIds) {
    const layerCleared = clearLayer(layerId);
    if (!layerCleared) {
      allLayersCleared = false;
    }
  }
  
  // Mark all layers as dirty after clearing
  markAllLayersAsDirty();
  
  return allLayersCleared;
}

/**
 * Clear the background layer
 */
export function clearBackgroundLayer() {
  clearLayer(LAYERS.BACKGROUND);
}

/**
 * Clear the group box layer
 */
export function clearGroupBoxLayer() {
  clearLayer(LAYERS.GROUP_BOX);
}

/**
 * Clear the cable layer
 */
export function clearCableLayer() {
  clearLayer(LAYERS.CABLE);
}

/**
 * Clear the port layer
 */
export function clearPortLayer() {
  clearLayer(LAYERS.PORT);
}

/**
 * Clear the text layer
 */
export function clearTextLayer() {
  clearLayer(LAYERS.TEXT);
}

/**
 * Get all layer contexts
 * @returns {Object} - An object containing all layer contexts
 */
export function getAllLayerContexts() {
  return canvasContexts;
}

/**
 * Get the background layer context
 * @returns {CanvasRenderingContext2D|null} - The background layer context
 */
export function getBackgroundContext() {
  return getLayerContext(LAYERS.BACKGROUND);
}

/**
 * Get the group box layer context
 * @returns {CanvasRenderingContext2D|null} - The group box layer context
 */
export function getGroupBoxContext() {
  return getLayerContext(LAYERS.GROUP_BOX);
}

/**
 * Get the cable layer context
 * @returns {CanvasRenderingContext2D|null} - The cable layer context
 */
export function getCableContext() {
  return getLayerContext(LAYERS.CABLE);
}

/**
 * Get the port layer context
 * @returns {CanvasRenderingContext2D|null} - The port layer context
 */
export function getPortContext() {
  return getLayerContext(LAYERS.PORT);
}

/**
 * Get the text layer context
 * @returns {CanvasRenderingContext2D|null} - The text layer context
 */
export function getTextContext() {
  return getLayerContext(LAYERS.TEXT);
}

/**
 * Resize all canvas layers to new dimensions
 * @param {number} width - The new width for all canvases
 * @param {number} height - The new height for all canvases
 * @returns {boolean} - Whether all layers were successfully resized
 */
export function resizeAllLayers(width, height) {
  if (!layersInitialized) {
    console.error('Canvas layers have not been initialized. Call initializeLayers() first.');
    return false;
  }
  
  let allLayersResized = true;
  
  for (const layerId of layerIds) {
    const canvas = document.getElementById(layerId);
    
    if (!canvas) {
      console.error(`Canvas element with ID ${layerId} not found during resize`);
      allLayersResized = false;
      continue;
    }
    
    // Set new canvas dimensions with device pixel ratio for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Set CSS size to maintain physical dimensions
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Clear the canvas after resize
    const context = canvasContexts[layerId];
    if (context) {
      // Reset the context with proper DPI scaling
      context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      context.scale(dpr, dpr); // Apply DPI scaling
      context.clearRect(0, 0, width, height); // Clear using logical dimensions
      // Mark layer as dirty after resize
      markLayerAsDirty(layerId);
    } else {
      allLayersResized = false;
    }
  }
  
  return allLayersResized;
}

/**
 * Mark a layer as dirty (needs redrawing)
 * @param {string} layerId - The ID of the layer to mark as dirty
 */
export function markLayerAsDirty(layerId) {
  if (!layersInitialized) {
    console.warn('Canvas layers have not been initialized. Call initializeLayers() first.');
    return;
  }
  
  if (layerIds.includes(layerId)) {
    dirtyLayers[layerId] = true;
  } else {
    console.warn(`Unknown layer ID: ${layerId}`);
  }
}

/**
 * Mark all layers as dirty (need redrawing)
 */
export function markAllLayersAsDirty() {
  if (!layersInitialized) {
    console.warn('Canvas layers have not been initialized. Call initializeLayers() first.');
    return;
  }
  
  layerIds.forEach(layerId => {
    dirtyLayers[layerId] = true;
  });
}

/**
 * Check if a layer is dirty (needs redrawing)
 * @param {string} layerId - The ID of the layer to check
 * @returns {boolean} - Whether the layer is dirty
 */
export function isLayerDirty(layerId) {
  if (!layersInitialized) {
    console.warn('Canvas layers have not been initialized. Call initializeLayers() first.');
    return true; // Default to dirty if not initialized
  }
  
  if (layerIds.includes(layerId)) {
    return dirtyLayers[layerId];
  } else {
    console.warn(`Unknown layer ID: ${layerId}`);
    return true; // Default to dirty for unknown layers
  }
}

/**
 * Mark a layer as clean (no need for redrawing)
 * @param {string} layerId - The ID of the layer to mark as clean
 */
export function markLayerAsClean(layerId) {
  if (!layersInitialized) {
    console.warn('Canvas layers have not been initialized. Call initializeLayers() first.');
    return;
  }
  
  if (layerIds.includes(layerId)) {
    dirtyLayers[layerId] = false;
  } else {
    console.warn(`Unknown layer ID: ${layerId}`);
  }
}

/**
 * Get the dirty status of all layers
 * @returns {Object} - An object containing the dirty status of all layers
 */
export function getDirtyLayersStatus() {
  return { ...dirtyLayers };
}