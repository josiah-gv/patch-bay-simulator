/**
 * Configuration constants for the Patch Bay application
 */

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
export const portRadius = 9; // Scaled for 1920x1080 resolution
export const safeZoneRadius = portRadius * 1.5; // Match the highlight and selection radius
export const margin = 80; // Scaled for 1920x1080 resolution
export const portSpacing = 32; // Scaled for 1920x1080 resolution
export const rowSpacing = 74; // Scaled for 1920x1080 resolution
export const sectionSpacing = 111; // Scaled for 1920x1080 resolution
export const midGapWidth = 32; // width of gap between columns 24 and 25 (same as portSpacing)

// Canvas dimensions
export const canvasWidth = 1920; // Updated to 1920x1080 (Full HD) resolution
export const canvasHeight = 1080; // Updated to 1920x1080 (Full HD) resolution

// Cable appearance
export const cableStrokeWeight = 6; // Scaled for 1920x1080 resolution
export const cableHoverThreshold = 20; // Scaled for 1920x1080 resolution
export const cableDeleteThreshold = 12; // Distance threshold for cable deletion (reduced from 16 for easier selection)
export const cableSagBase = 48; // Scaled for 1920x1080 resolution
export const cableSagFactor = 0.08; // Scaled for 1920x1080 resolution

// Group box appearance
export const groupBoxStrokeWeight = 2; // Scaled for 1920x1080 resolution

// Text sizes
export const titleTextSize = 38; // Scaled for 1920x1080 resolution
export const groupLabelTextSize = 21; // Scaled for 1920x1080 resolution
export const channelNumberTextSize = 20; // Scaled for 1920x1080 resolution

// Padding values
export const topLabelPadding = 62; // Scaled for 1920x1080 resolution
export const bottomLabelPadding = 62; // Scaled for 1920x1080 resolution
export const channelNumberPadding = 31; // Scaled for 1920x1080 resolution

// Group box padding
export const groupBoxHorizontalPadding = 16; // Scaled for 1920x1080 resolution
export const groupBoxVerticalPadding = 12; // Scaled for 1920x1080 resolution

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
export const textShadowOffsetX = 2; // Horizontal offset for text shadow
export const textShadowOffsetY = 2; // Vertical offset for text shadow
export const textShadowBlur = 4; // Blur amount for text shadow (smoother with Canvas API)
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
export const roomBoxStrokeWeight = 2; // Slightly thicker than group boxes
export const roomBoxPadding = 49; // Scaled for 1920x1080 resolution
export const roomBoxTopPadding = 12; // Scaled for 1920x1080 resolution
export const roomBoxBottomPadding = 49; // Scaled for 1920x1080 resolution
export const roomBoxLeftPadding = 49; // Scaled for 1920x1080 resolution
export const roomBoxRightPadding = 49; // Scaled for 1920x1080 resolution