/**
 * Configuration constants for the Patch Bay application
 */

/**
 * Global scale factor for room sizing
 * Now reads from CSS variable to allow dynamic updates
 */
export const SCALE_FACTOR = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale-factor')) || 0.8;

/**
 * Helper function to apply scaling to any dimension
 * @param {number} value - The original value to scale
 * @returns {number} - The scaled value, rounded to nearest integer
 */
export const scaled = (value) => {
  // Get current scale factor from CSS variable (fallback to 0.8)
  const currentScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale-factor')) || 0.8;
  return Math.round(value * currentScale);
};

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
export const margin = scaled(80); // Scaled for 1920x1080 resolution
export const portSpacing = scaled(32); // Scaled for 1920x1080 resolution
export const rowSpacing = scaled(74); // Scaled for 1920x1080 resolution
export const sectionSpacing = scaled(111); // Scaled for 1920x1080 resolution
export const midGapWidth = scaled(32); // width of gap between columns 24 and 25 (same as portSpacing)

// Canvas dimensions
export const canvasWidth = scaled(1920); // Updated to 1920x1080 (Full HD) resolution
export const canvasHeight = scaled(1080); // Updated to 1920x1080 (Full HD) resolution

// Cable appearance
export const cableStrokeWeight = scaled(6); // Scaled for 1920x1080 resolution
export const cableHoverThreshold = scaled(20); // Scaled for 1920x1080 resolution
export const cableDeleteThreshold = scaled(12); // Distance threshold for cable deletion (reduced from 16 for easier selection)
export const cableSagBase = scaled(48); // Scaled for 1920x1080 resolution
export const cableSagFactor = 0.08; // Ratio - remains unscaled

// Group box appearance
export const groupBoxStrokeWeight = scaled(2); // Scaled for 1920x1080 resolution

// Text sizes
export const titleTextSize = scaled(38); // Scaled for 1920x1080 resolution
export const groupLabelTextSize = scaled(21); // Scaled for 1920x1080 resolution
export const channelNumberTextSize = scaled(20); // Scaled for 1920x1080 resolution

// Padding values
export const topLabelPadding = scaled(62); // Scaled for 1920x1080 resolution
export const bottomLabelPadding = scaled(62); // Scaled for 1920x1080 resolution
export const channelNumberPadding = scaled(31); // Scaled for 1920x1080 resolution

// Group box padding
export const groupBoxHorizontalPadding = scaled(16); // Scaled for 1920x1080 resolution
export const groupBoxVerticalPadding = scaled(12); // Scaled for 1920x1080 resolution

// Colors
export const backgroundColor = 30; // Dark background
export const pageBackgroundColor = '#222222'; // Dark grey page background
export const textColor = 255; // White text
export const textShadowColor = 0; // Black for text shadows (used in RGBA format)
export const channelNumberColor = [200, 200, 200]; // Light grey for channel numbers
export const defaultPortColor = 100; // Default gray for unconnected ports
export const highlightPortColor = [100, 200, 100]; // Green highlight for closest available port
export const groupBoxColor = [150, 150, 150]; // Brighter grey for better visibility of group boxes

// Text shadow settings
export const textShadowOffsetX = scaled(2); // Horizontal offset for text shadow
export const textShadowOffsetY = scaled(2); // Vertical offset for text shadow
export const textShadowBlur = scaled(4); // Blur amount for text shadow (smoother with Canvas API)
export const textShadowOpacity = 1.0; // Opacity of text shadow (0.0 to 1.0)

// Font settings
export const fontFamily = 'Montserrat'; // Main font for the application

// Cable colors
export const cableColors = [
  [100, 200, 255], // blue
  [255, 100, 100], // red
  [100, 255, 100], // green
  [255, 255, 100], // yellow
  [255, 100, 255], // magenta
  [100, 255, 255]  // cyan
];

// Room box appearance settings
export const roomBoxColor = [150, 150, 150]; // Same as group box color by default
export const roomBoxStrokeWeight = scaled(2); // Slightly thicker than group boxes
export const roomBoxPadding = scaled(49); // Scaled for 1920x1080 resolution
export const roomBoxTopPadding = scaled(12); // Scaled for 1920x1080 resolution
export const roomBoxBottomPadding = scaled(49); // Scaled for 1920x1080 resolution
export const roomBoxLeftPadding = scaled(49); // Scaled for 1920x1080 resolution
export const roomBoxRightPadding = scaled(49); // Scaled for 1920x1080 resolution