/**
 * Configuration constants for the Patch Bay application
 */

// Port and spacing dimensions
export const portRadius = 7; // Increased by 30% from 5, rounded up
export const safeZoneRadius = portRadius * 1.5; // Match the highlight and selection radius
export const margin = 65; // Further increased from 52 for more padding
export const portSpacing = 26; // Increased by 30% from 20
export const rowSpacing = 60; // Further increased from 52 for more vertical padding
export const sectionSpacing = 90; // Further increased from 78 for more horizontal padding between sections
export const midGapWidth = 26; // width of gap between columns 24 and 25 (same as portSpacing)

// Canvas dimensions
export const canvasWidth = 1560; // Increased by 30% from 1200
export const canvasHeight = 780; // Increased by 30% from 600

// Cable appearance
export const cableStrokeWeight = 5; // Increased by 30% from 4, rounded
export const cableHoverThreshold = 16; // Increased threshold by 30% from 12
export const cableSagBase = 39; // Increased by 30% from 30
export const cableSagFactor = 0.065; // Increased by 30% from 0.05

// Group box appearance
export const groupBoxStrokeWeight = 1; // Increased line weight for better visibility

// Text sizes
export const titleTextSize = 31; // Increased by 30% from 24
export const groupLabelTextSize = 17; // Reduced by 10% from 19 for group labels
export const channelNumberTextSize = 16; // Increased by 30% from 12

// Padding values
export const topLabelPadding = 50; // Increased padding by 20% (from 50 to 60)
export const bottomLabelPadding = 50; // Increased padding by 20% (from 50 to 60)
export const channelNumberPadding = 25; // Increased padding by 20% (from 30 to 36)

// Group box padding
export const groupBoxHorizontalPadding = 13; // Horizontal padding for group boxes
export const groupBoxVerticalPadding = 10; // Vertical padding for group boxes

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
export const roomBoxPadding = 40; // Padding between the room box and the elements inside