/**
 * Configuration constants for the Patch Bay application
 */

/**
 * Fixed scale factor for room sizing
 * Static value - no longer reads from CSS variable
 */
export const SCALE_FACTOR = 0.89;

/**
 * Helper function to apply fixed scaling
 * @param {number} value - The original value to scale
 * @returns {number} - The scaled value, rounded to nearest integer
 */
export const scaled = (value) => {
  return Math.round(value * SCALE_FACTOR);
}

// Layer IDs for multi-canvas setup
export const layerIds = [
  'backgroundCanvas',
  'groupBoxCanvas',
  'cableCanvas',
  'portCanvas',
  'textCanvas'
];

// Layer constants for easier reference
export const LAYERS = {
  BACKGROUND: 'backgroundCanvas',
  GROUP_BOX: 'groupBoxCanvas',
  CABLE: 'cableCanvas',
  PORT: 'portCanvas',
  TEXT: 'textCanvas'
};


// Port and spacing dimensions
export const portRadius = scaled(9); // Scaled for 1920x1080 resolution
export const safeZoneRadius = scaled(portRadius * 1.5); // Match the highlight and selection radius
export const margin = scaled(10); // Set to match roomBoxTopPadding so outer box edges touch canvas edges
export const portSpacing = scaled(32); // Scaled for 1920x1080 resolution
export const rowSpacing = scaled(74); // Scaled for 1920x1080 resolution
export const sectionSpacing = scaled(74); // Scaled for 1920x1080 resolution
export const midGapWidth = scaled(32); // width of gap between columns 24 and 25 (same as portSpacing)

// Canvas dimensions
export const canvasWidth = scaled(1920); // Updated to 1920x1080 (Full HD) resolution
export const canvasHeight = scaled(950); // Reduced to better fit grid content

// Container dimensions - driven by canvas dimensions
export const containerWidth = canvasWidth;   
export const containerHeight = canvasHeight; 

// Cable appearance
export const cableStrokeWeight = scaled(6); // Scaled for 1920x1080 resolution
export const cableHoverThreshold = scaled(20); // Scaled for 1920x1080 resolution
export const cableDeleteThreshold = scaled(12); // Distance threshold for cable deletion (reduced from 16 for easier selection)
export const cableSagBase = scaled(48); // Scaled for 1920x1080 resolution
export const cableSagFactor = 0.08; // Ratio - remains unscaled

// Group box appearance
export const groupBoxStrokeWeight = scaled(1); // Scaled for 1920x1080 resolution

// Text sizes
export const titleTextSize = scaled(38); // Scaled for 1920x1080 resolution
export const groupLabelTextSize = scaled(16); // Scaled for 1920x1080 resolution
export const channelNumberTextSize = scaled(13); // Scaled for 1920x1080 resolution

// Padding values
export const topLabelPadding = scaled(50); // Scaled for 1920x1080 resolution
export const bottomLabelPadding = scaled(50); // Scaled for 1920x1080 resolution
export const channelNumberPadding = scaled(31); // Scaled for 1920x1080 resolution

// Group box padding
export const groupBoxHorizontalPadding = scaled(16); // Scaled for 1920x1080 resolution
export const groupBoxVerticalPadding = scaled(12); // Scaled for 1920x1080 resolution

// Colors
export const backgroundColor = 30; // Dark background
export const pageBackgroundColor = '#0d0d0f'; // Dark grey page background
export const textColor = 255; // White text
export const textShadowColor = 0; // Black for text shadows (used in RGBA format)
export const channelNumberColor = [200, 200, 200]; // Light grey for channel numbers
export const defaultPortColor = 100; // Default gray for unconnected ports
export const deadPortColor = 35; // Darker gray for dead ports (60% of default)
export const highlightPortColor = [100, 200, 100]; // Green highlight for closest available port
export const groupBoxColor = [100, 100, 100]; // Brighter grey for better visibility of group boxes

// Text shadow settings
export const textShadowOffsetX = scaled(2); // Horizontal offset for text shadow
export const textShadowOffsetY = scaled(2); // Vertical offset for text shadow
export const textShadowBlur = scaled(4); // Blur amount for text shadow (smoother with Canvas API)
export const textShadowOpacity = 1.0; // Opacity of text shadow (0.0 to 1.0)

// Font settings
export const fontFamily = 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif'; // Main font for the application

// Grid positioning system
// Grid origin point - serves as the anchor for all relative positioning
export const gridOrigin = {
  x: scaled(0),  // Default grid X position on canvas
  y: scaled(10)   // Default grid Y position on canvas
};

// Grid logical dimensions (relative to grid origin)
export const gridBounds = {
  width: scaled(1600),   // Internal grid width
  height: scaled(100),   // Default height - will be overridden dynamically
  padding: {
    top: scaled(0),     // Reduced top padding to prevent negative bounds
    right: scaled(0),   // Right padding
    bottom: scaled(-35),  // Bottom padding
    left: scaled(-5)     // Left padding
  }
};

/**
 * Updates the grid bounds height dynamically based on content
 * @param {number} newHeight - The new height for the grid bounds
 */
export function updateGridBounds(newHeight) {
  gridBounds.height = newHeight;
}

/**
 * Converts grid-relative coordinates to absolute canvas coordinates
 * @param {number} gridX - X coordinate relative to grid origin
 * @param {number} gridY - Y coordinate relative to grid origin
 * @param {Object} origin - Grid origin point (optional, defaults to gridOrigin)
 * @returns {Object} - Object with x, y canvas coordinates
 */
export function gridToCanvas(gridX, gridY, origin = gridOrigin) {
  return {
    x: origin.x + gridX,
    y: origin.y + gridY
  };
}

/**
 * Converts absolute canvas coordinates to grid-relative coordinates
 * @param {number} canvasX - X coordinate on canvas
 * @param {number} canvasY - Y coordinate on canvas
 * @param {Object} origin - Grid origin point (optional, defaults to gridOrigin)
 * @returns {Object} - Object with x, y grid coordinates
 */
export function canvasToGrid(canvasX, canvasY, origin = gridOrigin) {
  return {
    x: canvasX - origin.x,
    y: canvasY - origin.y
  };
}

/**
 * Gets the absolute canvas bounds of the grid including padding
 * @param {Object} origin - Grid origin point (optional, defaults to gridOrigin)
 * @returns {Object} - Object with minX, minY, maxX, maxY canvas coordinates
 */
export function getGridCanvasBounds(origin = gridOrigin) {
  return {
    minX: origin.x + gridBounds.padding.left,
    minY: origin.y + gridBounds.padding.top,
    maxX: origin.x + gridBounds.width + gridBounds.padding.right,
    maxY: origin.y + gridBounds.height + gridBounds.padding.bottom
  };
}

// Ring appearance settings
export const ringLineWidth = 3; // Thickness of cross-room signal rings
export const ringGap = 3; // Gap between port and ring (in pixels)

// Cable colors
export const cableColors = [
  [100, 200, 255], // blue
  [255, 100, 100], // red
  [100, 255, 100], // green
  [255, 255, 100], // yellow
  [255, 100, 255], // magenta
  [100, 255, 255]  // cyan
];