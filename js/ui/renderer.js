/**
 * Renderer Module
 * Handles drawing and rendering of the patch bay UI using a layered canvas approach
 */

// Import constants
import {
  backgroundColor,
  textColor,
  textShadowColor,
  textShadowOffsetX,
  textShadowOffsetY,
  textShadowBlur,
  textShadowOpacity,
  channelNumberColor,
  defaultPortColor,
  highlightPortColor,
  groupBoxColor,
  portRadius,
  cableStrokeWeight,
  cableDeleteThreshold,
  groupBoxStrokeWeight,
  titleTextSize,
  groupLabelTextSize,
  channelNumberTextSize,
  topLabelPadding,
  bottomLabelPadding,
  channelNumberPadding,
  groupBoxHorizontalPadding,
  groupBoxVerticalPadding,
  canvasWidth,
  canvasHeight,
  margin,
  fontFamily,
  LAYERS,
  gridOrigin,
  gridBounds,
  portSpacing,
  midGapWidth
} from '../config/constants.js';

// Import room box constants and grid system
import {
  roomBoxColor,
  roomBoxStrokeWeight,
  roomBoxPadding,
  roomBoxTopPadding,
  roomBoxBottomPadding,
  roomBoxLeftPadding,
  roomBoxRightPadding,
  getGridCanvasBounds
} from '../config/constants.js';

// Import port utilities
import { isPortConnected, getPortAt } from '../models/Port.js';

// Import cross-room registry functions
import { getPortSignalColor, hasPortCrossRoomSignal, getPortCrossRoomSignalColor, shouldPortShowRing } from '../models/CrossRoomRegistry.js';

// Import layer manager
import {
  getBackgroundContext,
  getGroupBoxContext,
  getCableContext,
  getPortContext,
  getTextContext,
  clearBackgroundLayer,
  clearGroupBoxLayer,
  clearCableLayer,
  clearPortLayer,
  clearTextLayer,
  initializeLayers,
  areLayersInitialized,
  markLayerAsDirty,
  markLayerAsClean,
  markAllLayersAsDirty,
  isLayerDirty
} from './layerManager.js';

/**
 * Main draw function for the patch bay
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function draw(p5, state) {
  try {
    // Initialize layers if not already done
    if (!areLayersInitialized()) {
      if (!initializeLayers()) {
        console.error('Failed to initialize canvas layers');
        return;
      }
    }
    
    // Reset hover connection
    state.hoverConnection = null;

    // Check if any rooms are visible
    const hasVisibleRooms = state.roomStates && Object.values(state.roomStates).some(roomState => roomState.visible);
    
    if (!hasVisibleRooms) {
      // If no rooms are visible, just draw background and return
      if (isLayerDirty(LAYERS.BACKGROUND)) {
        clearBackgroundLayer();
        drawBackground(p5, state);
        markLayerAsClean(LAYERS.BACKGROUND);
      }
      
      // Clear other layers when no rooms are visible
      if (isLayerDirty(LAYERS.GROUP_BOX)) {
        clearGroupBoxLayer();
        markLayerAsClean(LAYERS.GROUP_BOX);
      }
      if (isLayerDirty(LAYERS.CABLE)) {
        clearCableLayer();
        markLayerAsClean(LAYERS.CABLE);
      }
      if (isLayerDirty(LAYERS.PORT)) {
        clearPortLayer();
        markLayerAsClean(LAYERS.PORT);
      }
      if (isLayerDirty(LAYERS.TEXT)) {
        clearTextLayer();
        markLayerAsClean(LAYERS.TEXT);
      }
      return;
    }

    const dx = state.cursorX - state.prevCursorX;
    const dy = state.cursorY - state.prevCursorY;
    
    // Calculate delta time factor (for frame rate independence)
    const targetFrameRate = 60; // The frame rate the animation was designed for
    const currentFrameRate = p5.frameRate() || targetFrameRate;
    const deltaFactor = targetFrameRate / currentFrameRate;
    
    // Frame rate independent momentum calculations
    const dampingFactor = 0.2 * deltaFactor;
    
    // Determine if we need to redraw based on cursor movement
    const significantMovement = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;
    
    // Vertical jiggle momentum (frame rate independent)
    state.controlOffsetY += (dy * 2 - state.controlOffsetY) * dampingFactor;
    // Horizontal swing momentum (frame rate independent)
    state.controlOffsetX += (dx * 2 - state.controlOffsetX) * dampingFactor;

    state.prevCursorX = state.cursorX;
    state.prevCursorY = state.cursorY;
    
    // Find the closest available port for highlighting
    const previousClosestPort = state.closestAvailablePort;
    state.closestAvailablePort = findClosestAvailablePort(state);
    
    // Check if the closest port has changed, which would require redrawing the port layer
    const closestPortChanged = previousClosestPort !== state.closestAvailablePort;
    
    // Mark layers as dirty based on state changes
    if (significantMovement || state.activeCable) {
      // If there's cursor movement or an active cable, the cable layer needs redrawing
      markLayerAsDirty(LAYERS.CABLE);
    }
    
    if (closestPortChanged) {
      // If the closest port changed, the port layer needs redrawing
      markLayerAsDirty(LAYERS.PORT);
    }
    
    // Only clear and redraw layers that are marked as dirty
    if (isLayerDirty(LAYERS.BACKGROUND)) {
      clearBackgroundLayer();
      drawBackground(p5, state);
      markLayerAsClean(LAYERS.BACKGROUND);
    }
    
    if (isLayerDirty(LAYERS.GROUP_BOX)) {
      clearGroupBoxLayer();
      drawRoomBox(p5, state);
      drawGroupBoxes(p5, state);
      markLayerAsClean(LAYERS.GROUP_BOX);
    }
    
    if (isLayerDirty(LAYERS.CABLE)) {
      clearCableLayer();
      drawCables(p5, state);
      markLayerAsClean(LAYERS.CABLE);
    }
    
    if (isLayerDirty(LAYERS.PORT)) {
      clearPortLayer();
      drawPorts(p5, state, state.closestAvailablePort);
      markLayerAsClean(LAYERS.PORT);
    }
    
    if (isLayerDirty(LAYERS.TEXT)) {
      clearTextLayer();
      drawText(p5, state);
      markLayerAsClean(LAYERS.TEXT);
    }
    
    // FPS calculation still happens but display is hidden
    Math.round(p5.frameRate());
  } catch (error) {
    console.error('Error in draw function:', error);
  }
}

/**
 * Draws the background layer
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function drawBackground(p5, state) {
  const ctx = getBackgroundContext();
  if (!ctx) return;
  
  // Fill the background
  ctx.fillStyle = `rgb(${backgroundColor}, ${backgroundColor}, ${backgroundColor})`;
  // Account for device pixel ratio when filling the background
  const dpr = window.devicePixelRatio || 1;
  ctx.fillRect(0, 0, canvasWidth * dpr, canvasHeight * dpr);
}

/**
 * Draws all cables (connections and active cable) on the cable layer
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function drawCables(p5, state) {
  const ctx = getCableContext();
  if (!ctx) return;
  
  // Set common cable properties
  ctx.lineWidth = cableStrokeWeight;
  
  // Draw existing connections
  state.connections.forEach(conn => {
    // Find the port objects by their IDs instead of using array indexing
    const portA = state.ports.find(port => port.id === conn.from);
    const portB = state.ports.find(port => port.id === conn.to);
    
    // Skip if ports don't exist
    if (!portA || !portB) return;
    
    const isHovering = isMouseNearBezierSegments(
      portA, 
      portB, 
      0, 
      0, 
      cableDeleteThreshold, // Hover threshold for cable deletion
      p5,
      state
    );
    
    // Use the same radius as port selection and highlighting for consistency
    const inSafeZone = getPortAt(
      state.mouseX, 
      state.mouseY, 
      state.ports, 
      portRadius * 1.5
    );
    
    // Get the cable's color
    const cableColor = conn.color || state.cableColors[0]; // Default to first color if none stored
    
    if (isHovering && !inSafeZone && !state.activeCable) {
      // Use a darker shade of the cable's color for deletion hover
      // Only set hover connection if we're not holding a cable
      ctx.strokeStyle = `rgb(${cableColor[0] * 0.6}, ${cableColor[1] * 0.6}, ${cableColor[2] * 0.6})`;
      state.hoverConnection = conn;
    } else {
      // Use the cable's normal color
      ctx.strokeStyle = `rgb(${cableColor[0]}, ${cableColor[1]}, ${cableColor[2]})`;
    }
    
    drawCableOnContext(ctx, portA, portB);
  });
  
  // Draw active cable if one exists
  if (state.activeCable !== null) {
    // Find the port object by its ID instead of using array indexing
    const activePort = state.ports.find(port => port.id === state.activeCable);
    
    // Skip if port doesn't exist
    if (!activePort) return;
    
    // Use the stored cable color if available (from picking up an existing cable)
    // Otherwise use the next color in the sequence for new cables
    const cableColor = state.activeCableColor || state.cableColors[state.currentColorIndex];
    ctx.strokeStyle = `rgb(${cableColor[0]}, ${cableColor[1]}, ${cableColor[2]})`;
    
    drawCableOnContext(
      ctx,
      activePort, 
      { x: state.cursorX, y: state.cursorY }, 
      state.controlOffsetY, 
      state.controlOffsetX
    );
  }
}

/**
 * Draws all ports on the port layer
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 * @param {Object} closestAvailablePort - The closest available port for highlighting
 */
function drawPorts(p5, state, closestAvailablePort) {
  const ctx = getPortContext();
  if (!ctx) return;
  
  // Enhanced debug logging - only on click events
  if (state.debugOnClick) {
    // console.log('Drawing ports:', state.ports.length, 'total ports');
    
    // Debug: Log the first 3 port coordinates and details
    // if (state.ports && state.ports.length > 0) {
    //   const first3Ports = state.ports.slice(0, 3);
    //   console.log('First 3 ports details:');
    //   first3Ports.forEach(p => {
    //     console.log(`  Port ${p.id}: x=${p.x}, y=${p.y}, room=${p.roomName}`);
    //   });
    // }
    
    // Debug: Log canvas dimensions and port radius
    // console.log(`Canvas context: width=${ctx.canvas.width}, height=${ctx.canvas.height}`);
    // console.log(`Port radius: ${portRadius}`);
  }
  
  state.ports.forEach(p => {
    // Check for cross-room signal first
    const currentRoomId = state.activeRoomId;
    const hasCrossRoomSignal = hasPortCrossRoomSignal(p.id, currentRoomId);
    const crossRoomSignalColor = getPortCrossRoomSignalColor(p.id, currentRoomId);
    
    // Debug logging for cross-room signals - only on click events
    if (p.id === 'p0001' && state.debugOnClick) {
      console.log('Port p0001 cross-room check:', {
        currentRoomId,
        crossRoomSignalColor,
        hasCrossRoomSignal
      });
    }
    
    // Draw cross-room signal ring if present and port should show ring
    if (hasCrossRoomSignal && crossRoomSignalColor && shouldPortShowRing(p.id, currentRoomId)) {
      ctx.beginPath();
      ctx.strokeStyle = `rgb(${crossRoomSignalColor[0]}, ${crossRoomSignalColor[1]}, ${crossRoomSignalColor[2]})`;
      ctx.lineWidth = 4; // 4-pixel thick ring
      ctx.arc(p.x, p.y, portRadius + 2, 0, Math.PI * 2); // Ring outside the port circle
      ctx.stroke();
    }
    
    // Begin a new path for the port circle
    ctx.beginPath();
    
    // Determine port fill color
    let portFillColor;
    if (isPortConnected(p, state.connections)) {
      // Find the connection this port belongs to
      const conn = state.connections.find(c => {
        // Check for different connection formats
        return (c.from === p.id || c.to === p.id) || // Legacy format
               (c.portA && c.portA.id === p.id) ||        // New format portA
               (c.portB && c.portB.id === p.id) ||        // New format portB
               (c.a === p || c.b === p);                  // Legacy object format
      });
      if (conn && conn.color) {
        // Use the cable's color for the port at full brightness
        portFillColor = `rgb(${conn.color[0]}, ${conn.color[1]}, ${conn.color[2]})`;
      } else {
        // Fallback if no color found
        portFillColor = 'rgb(150, 100, 100)';
      }
    } else if (state.activeCable !== null && p.id === state.activeCable) {
      // Highlight the active cable source port with the stored cable color at full brightness
      const currentColor = state.activeCableColor || state.cableColors[state.currentColorIndex];
      portFillColor = `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`;
    } else if (p === closestAvailablePort) {
      // Check if this port already has a cross-room signal color assigned
      if (hasCrossRoomSignal && crossRoomSignalColor) {
        // Use the existing cross-room signal color for hover highlight
        portFillColor = `rgb(${crossRoomSignalColor[0]}, ${crossRoomSignalColor[1]}, ${crossRoomSignalColor[2]})`;
      } else {
        // Highlight the closest available port with the color of the active cable (if any) or next color
        const nextColor = state.activeCableColor || state.cableColors[state.currentColorIndex];
        portFillColor = `rgb(${nextColor[0]}, ${nextColor[1]}, ${nextColor[2]})`;
      }
    } else {
      // Default gray for unconnected ports (including those with cross-room signals)
      // Cross-room signals are indicated by the ring only, not port color
      portFillColor = `rgb(${defaultPortColor}, ${defaultPortColor}, ${defaultPortColor})`;
    }
    
    ctx.fillStyle = portFillColor;
    
    // Draw the port circle
    ctx.arc(p.x, p.y, portRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Finds the closest available port to the mouse
 * @param {Object} state - The application state
 * @returns {Object|null} - The closest available port or null
 */
function findClosestAvailablePort(state) {
  let closestAvailablePort = null;
  let closestDistance = Infinity;
  const highlightThreshold = portRadius * 1.5; // Maximum distance to highlight a port (just slightly larger than the port itself)
  
  state.ports.forEach(p => {
    // Skip the active cable port if it exists
    if ((state.activeCable !== null && p.id !== state.activeCable) || state.activeCable === null) {
      // Only consider unconnected ports
      if (!isPortConnected(p, state.connections)) {
        const distance = Math.sqrt(
          Math.pow(p.x - state.mouseX, 2) + 
          Math.pow(p.y - state.mouseY, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestAvailablePort = p;
        }
      }
    }
  });
  
  // Only return the closest port if it's within the highlight threshold
  return closestDistance <= highlightThreshold ? closestAvailablePort : null;
}

/**
 * Draws labels and numbers for ports
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
/**
 * Helper function to draw text with shadow
 * @param {Object} p5 - The p5 instance
 * @param {string} text - The text to draw
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function drawTextWithShadow(p5, text, x, y) {
  // Save current context state
  p5.drawingContext.save();
  
  // Set the font family
  p5.textFont(fontFamily);
  
  // Ensure no stroke is applied to text
  p5.noStroke();
  
  // Apply a smooth shadow using Canvas API with configurable opacity
  p5.drawingContext.shadowColor = `rgba(${textShadowColor}, ${textShadowColor}, ${textShadowColor}, ${textShadowOpacity})`;
  p5.drawingContext.shadowBlur = textShadowBlur;
  p5.drawingContext.shadowOffsetX = textShadowOffsetX;
  p5.drawingContext.shadowOffsetY = textShadowOffsetY;
  
  // Draw the text once with the shadow applied
  p5.text(text, x, y);
  
  // Restore the context to remove shadow settings
  p5.drawingContext.restore();
}

/**
 * Helper function to draw text with shadow using canvas context
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} text - The text to draw
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 */
function drawTextWithShadowOnContext(ctx, text, x, y) {
  // Store current text alignment settings
  const currentTextAlign = ctx.textAlign;
  const currentTextBaseline = ctx.textBaseline;
  
  // Save current context state
  ctx.save();
  
  // Restore text alignment after save
  ctx.textAlign = currentTextAlign;
  ctx.textBaseline = currentTextBaseline;
  
  // Apply shadow settings
  ctx.shadowColor = `rgba(${textShadowColor}, ${textShadowColor}, ${textShadowColor}, ${textShadowOpacity})`;
  ctx.shadowBlur = textShadowBlur;
  ctx.shadowOffsetX = textShadowOffsetX;
  ctx.shadowOffsetY = textShadowOffsetY;
  
  // Draw the text with shadow
  ctx.fillText(text, x, y);
  
  // Restore the context
  ctx.restore();
}

/**
 * Draws group boxes on the group box layer
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function drawGroupBoxes(p5, state) {
  const ctx = getGroupBoxContext();
  if (!ctx) return;
  
  // Check if we have any visible rooms and ports
  const hasVisibleRooms = state.roomStates && Object.values(state.roomStates).some(roomState => roomState.visible);
  if (!hasVisibleRooms || !state.ports || state.ports.length === 0) {
    return;
  }
  
  try {
    // Set common group box properties
    ctx.strokeStyle = `rgb(${groupBoxColor[0]}, ${groupBoxColor[1]}, ${groupBoxColor[2]})`;
    ctx.lineWidth = groupBoxStrokeWeight;
    
    // Group the ports by section and row
    const portsBySection = {};
    
    state.ports.forEach(port => {
      if (!port || typeof port.section === 'undefined' || !port.row) {
        return;
      }
      
      if (!portsBySection[port.section]) {
        portsBySection[port.section] = { top: [], bottom: [] };
      }
      
      portsBySection[port.section][port.row].push(port);
    });
    
    // Draw group boxes for each section
    Object.keys(portsBySection).forEach(sectionIndex => {
      const section = portsBySection[sectionIndex];
      
      // Draw top row group boxes
      if (section.top && section.top.length > 0) {
        // Group labels - Create groups of consecutive ports with the same label
        const labelGroups = [];
        let currentGroup = null;
        
        // Process ports in order to find consecutive groups with the same label
        section.top.forEach((port, index) => {
          if (!port.groupLabel) return;
          
          // If this is a new group or a different label than the previous group
          if (!currentGroup || currentGroup.internalId !== port.groupInternalId) {
            // Save the previous group if it exists
            if (currentGroup) {
              labelGroups.push(currentGroup);
            }
            // Start a new group
            currentGroup = {
              label: port.groupLabel,
              internalId: port.groupInternalId,
              ports: [port]
            };
          } else {
            // Add to the current group
            currentGroup.ports.push(port);
          }
          
          // If this is the last port, add the current group
          if (index === section.top.length - 1 && currentGroup) {
            labelGroups.push(currentGroup);
          }
        });
        
        // Draw each group box
        labelGroups.forEach(group => {
          const portsWithLabel = group.ports;
          if (portsWithLabel.length === 0) return;
          
          const firstPort = portsWithLabel[0];
          const lastPort = portsWithLabel[portsWithLabel.length - 1];
          
          // Calculate box dimensions - around the label and channel numbers
          const boxLeft = firstPort.x - groupBoxHorizontalPadding;
          const boxRight = lastPort.x + groupBoxHorizontalPadding;
          const boxTop = firstPort.y - topLabelPadding - groupBoxVerticalPadding;
          const boxBottom = firstPort.y - channelNumberPadding + groupBoxVerticalPadding;
          
          // Draw the rectangle - around both label and channel numbers
          ctx.beginPath();
          ctx.rect(boxLeft, boxTop, boxRight - boxLeft, boxBottom - boxTop);
          ctx.stroke();
        });
      }
      
      // Draw bottom row group boxes
      if (section.bottom && section.bottom.length > 0) {
        // Group labels - Create groups of consecutive ports with the same label
        const labelGroups = [];
        let currentGroup = null;
        
        // Process ports in order to find consecutive groups with the same label
        section.bottom.forEach((port, index) => {
          if (!port.groupLabel) return;
          
          // If this is a new group or a different label than the previous group
          if (!currentGroup || currentGroup.internalId !== port.groupInternalId) {
            // Save the previous group if it exists
            if (currentGroup) {
              labelGroups.push(currentGroup);
            }
            // Start a new group
            currentGroup = {
              label: port.groupLabel,
              internalId: port.groupInternalId,
              ports: [port]
            };
          } else {
            // Add to the current group
            currentGroup.ports.push(port);
          }
          
          // If this is the last port, add the current group
          if (index === section.bottom.length - 1 && currentGroup) {
            labelGroups.push(currentGroup);
          }
        });
        
        // Draw each group box
        labelGroups.forEach(group => {
          const portsWithLabel = group.ports;
          if (portsWithLabel.length === 0) return;
          
          const firstPort = portsWithLabel[0];
          const lastPort = portsWithLabel[portsWithLabel.length - 1];
          
          // Calculate box dimensions - around the label and channel numbers
          const boxLeft = firstPort.x - groupBoxHorizontalPadding;
          const boxRight = lastPort.x + groupBoxHorizontalPadding;
          const boxTop = firstPort.y + channelNumberPadding - groupBoxVerticalPadding;
          const boxBottom = firstPort.y + bottomLabelPadding + groupBoxVerticalPadding;
          
          // Draw the rectangle - around both label and channel numbers
          ctx.beginPath();
          ctx.rect(boxLeft, boxTop, boxRight - boxLeft, boxBottom - boxTop);
          ctx.stroke();
        });
      }
    });
  } catch (error) {
    console.error('Error drawing group boxes:', error);
  }
}

/**
 * Draws text labels and channel numbers on the text layer
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function drawText(p5, state) {
  const ctx = getTextContext();
  if (!ctx) return;
  
  // Check if we have any visible rooms
  const hasVisibleRooms = state.roomStates && Object.values(state.roomStates).some(roomState => roomState.visible);
  if (!hasVisibleRooms) {
    return;
  }
  
  try {
    // Draw room titles for all visible rooms
    ctx.fillStyle = `rgb(${textColor}, ${textColor}, ${textColor})`;
    ctx.font = `bold ${titleTextSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Draw room title with shadow - centered over the actual port layout
    // Port layout starts at gridBounds.padding.left + 40 and spans 48 ports with gap
    const portLayoutStartX = gridBounds.padding.left + 40;
    const portLayoutWidth = 24 * portSpacing + midGapWidth + 24 * portSpacing;
    const portLayoutCenterX = gridOrigin.x + portLayoutStartX + (portLayoutWidth / 2);
    
    // Draw titles for all visible rooms
    if (state.roomStates) {
      Object.entries(state.roomStates).forEach(([roomName, roomState]) => {
        if (roomState.visible) {
          // Find the room object from the main rooms array
          const room = state.rooms ? state.rooms.find(r => r.name === roomName) : null;
          if (room) {
            // Position room title at the top of the active room (no yOffset needed for single room display)
            const roomTitleY = gridOrigin.y + gridBounds.padding.top + 25;
            drawTextWithShadowOnContext(ctx, room.name, portLayoutCenterX, roomTitleY);
          }
        }
      });
    }
    
    // Set text properties for labels and numbers
    ctx.font = `${channelNumberTextSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Check if we have ports to draw
    if (!state.ports || state.ports.length === 0) {
      return;
    }
    
    // Group the ports by section and row
    const portsBySection = {};
    
    state.ports.forEach(port => {
      if (!port || typeof port.section === 'undefined' || !port.row) {
        return;
      }
      
      if (!portsBySection[port.section]) {
        portsBySection[port.section] = { top: [], bottom: [] };
      }
      
      portsBySection[port.section][port.row].push(port);
    });
    
    // Draw group labels and channel numbers for each section
    Object.keys(portsBySection).forEach(sectionIndex => {
      const section = portsBySection[sectionIndex];
      
      // Draw top row labels and numbers
      if (section.top && section.top.length > 0) {
        // Group labels - Create groups of consecutive ports with the same label
        const labelGroups = [];
        let currentGroup = null;
        
        // Process ports in order to find consecutive groups with the same label
        section.top.forEach((port, index) => {
          if (!port.groupLabel) return;
          
          // If this is a new group or a different label than the previous group
          if (!currentGroup || currentGroup.internalId !== port.groupInternalId) {
            // Save the previous group if it exists
            if (currentGroup) {
              labelGroups.push(currentGroup);
            }
            // Start a new group
            currentGroup = {
              label: port.groupLabel,
              internalId: port.groupInternalId,
              ports: [port]
            };
          } else {
            // Add to the current group
            currentGroup.ports.push(port);
          }
          
          // If this is the last port, add the current group
          if (index === section.top.length - 1 && currentGroup) {
            labelGroups.push(currentGroup);
          }
        });
        
        // Draw each label text
        labelGroups.forEach(group => {
          const label = group.label;
          const portsWithLabel = group.ports;
          if (portsWithLabel.length === 0) return;
          
          const firstPort = portsWithLabel[0];
          const lastPort = portsWithLabel[portsWithLabel.length - 1];
          const centerX = (firstPort.x + lastPort.x) / 2;
          
          // Draw the label text
          ctx.fillStyle = `rgb(${textColor}, ${textColor}, ${textColor})`;
          ctx.font = `bold ${groupLabelTextSize}px ${fontFamily}`;
          drawTextWithShadowOnContext(ctx, label, centerX, firstPort.y - topLabelPadding);
          ctx.font = `${channelNumberTextSize}px ${fontFamily}`; // Reset to default size for other text
        });
        
        // Channel numbers
        section.top.forEach(port => {
          if (port.channelNumber) {
            ctx.fillStyle = `rgb(${channelNumberColor[0]}, ${channelNumberColor[1]}, ${channelNumberColor[2]})`;
            drawTextWithShadowOnContext(ctx, port.channelNumber, port.x, port.y - channelNumberPadding);
          }
        });
      }
      
      // Draw bottom row labels and numbers
      if (section.bottom && section.bottom.length > 0) {
        // Group labels - Create groups of consecutive ports with the same label
        const labelGroups = [];
        let currentGroup = null;
        
        // Process ports in order to find consecutive groups with the same label
        section.bottom.forEach((port, index) => {
          if (!port.groupLabel) return;
          
          // If this is a new group or a different label than the previous group
          if (!currentGroup || currentGroup.internalId !== port.groupInternalId) {
            // Save the previous group if it exists
            if (currentGroup) {
              labelGroups.push(currentGroup);
            }
            // Start a new group
            currentGroup = {
              label: port.groupLabel,
              internalId: port.groupInternalId,
              ports: [port]
            };
          } else {
            // Add to the current group
            currentGroup.ports.push(port);
          }
          
          // If this is the last port, add the current group
          if (index === section.bottom.length - 1 && currentGroup) {
            labelGroups.push(currentGroup);
          }
        });
        
        // Draw each label text
        labelGroups.forEach(group => {
          const label = group.label;
          const portsWithLabel = group.ports;
          if (portsWithLabel.length === 0) return;
          
          const firstPort = portsWithLabel[0];
          const lastPort = portsWithLabel[portsWithLabel.length - 1];
          const centerX = (firstPort.x + lastPort.x) / 2;
          
          // Draw the label text
          ctx.fillStyle = `rgb(${textColor}, ${textColor}, ${textColor})`;
          ctx.font = `bold ${groupLabelTextSize}px ${fontFamily}`;
          drawTextWithShadowOnContext(ctx, label, centerX, firstPort.y + bottomLabelPadding);
          ctx.font = `${channelNumberTextSize}px ${fontFamily}`; // Reset to default size for other text
        });
        
        // Channel numbers
        section.bottom.forEach(port => {
          if (port.channelNumber) {
            ctx.fillStyle = `rgb(${channelNumberColor[0]}, ${channelNumberColor[1]}, ${channelNumberColor[2]})`;
            drawTextWithShadowOnContext(ctx, port.channelNumber, port.x, port.y + channelNumberPadding);
          }
        });
      }
    });
    
    // Draw grid origin indicator on top of everything else
   // drawGridOriginIndicator(ctx);
  } catch (error) {
    console.error('Error drawing labels and text:', error);
  }
}

/**
 * Draws a visual indicator at the grid origin
 * @param {CanvasRenderingContext2D} ctx - The text layer canvas context
 */
function drawGridOriginIndicator(ctx) {
  // Save current context state
  ctx.save();
  
  // Draw red 1-pixel square at grid origin
  ctx.fillStyle = 'rgb(255, 0, 0)';
  ctx.fillRect(gridOrigin.x - 0.5, gridOrigin.y - 0.5, 1, 1);
  
  // Draw circle outline around the grid origin
  ctx.strokeStyle = 'rgb(255, 0, 0)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(gridOrigin.x, gridOrigin.y, 10, 0, Math.PI * 2);
  ctx.stroke();
  
  // Restore context state
  ctx.restore();
}

// Combined function that calls both drawing functions
function drawLabelsAndNumbers(p5, state) {
  // This function is kept for backward compatibility
  // It now just calls the two separate functions
  drawGroupBoxes(p5, state);
  drawText(p5, state);
}

/**
 * Draws a cable between two points using canvas context
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} a - The starting point
 * @param {Object} b - The ending point
 * @param {number} offsetY - Vertical offset for control points
 * @param {number} offsetX - Horizontal offset for control points
 */
function drawCableOnContext(ctx, a, b, offsetY = 0, offsetX = 0) {
  // Check if a and b are defined and have valid coordinates
  if (!a || !b || typeof a.x !== 'number' || typeof a.y !== 'number' || 
      typeof b.x !== 'number' || typeof b.y !== 'number') {
    console.warn('Invalid port coordinates in drawCableOnContext', a, b);
    return;
  }
  
  const sag = 39 + Math.abs(a.x - b.x) * 0.065; // Increased by 30% from 30 and 0.05

  // Linear interpolation function
  const lerp = (start, end, amt) => start * (1 - amt) + end * amt;
  
  const cp1X = lerp(a.x, b.x, 0.25) + offsetX;
  const cp2X = lerp(a.x, b.x, 0.75) + offsetX;

  const controlY = Math.max(a.y, b.y) + sag + offsetY;

  // Draw bezier curve
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.bezierCurveTo(cp1X, controlY, cp2X, controlY, b.x, b.y);
  ctx.stroke();
}

/**
 * Legacy function for drawing a cable between two points using p5
 * @param {Object} p5 - The p5 instance
 * @param {Object} a - The starting point
 * @param {Object} b - The ending point
 * @param {number} offsetY - Vertical offset for control points
 * @param {number} offsetX - Horizontal offset for control points
 */
function drawCable(p5, a, b, offsetY = 0, offsetX = 0) {
  // Check if a and b are defined and have valid coordinates
  if (!a || !b || typeof a.x !== 'number' || typeof a.y !== 'number' || 
      typeof b.x !== 'number' || typeof b.y !== 'number') {
    console.warn('Invalid port coordinates in drawCable', a, b);
    return;
  }
  
  // Check if p5 is defined and has the required functions
  if (!p5 || typeof p5.lerp !== 'function' || typeof p5.bezier !== 'function') {
    console.warn('Invalid p5 instance in drawCable');
    return;
  }
  
  const sag = 39 + Math.abs(a.x - b.x) * 0.065; // Increased by 30% from 30 and 0.05

  const cp1X = p5.lerp(a.x, b.x, 0.25) + offsetX;
  const cp2X = p5.lerp(a.x, b.x, 0.75) + offsetX;

  const controlY = Math.max(a.y, b.y) + sag + offsetY;

  p5.bezier(a.x, a.y, cp1X, controlY, cp2X, controlY, b.x, b.y);
}

/**
 * Checks if the mouse is near a bezier curve
 * @param {Object} a - The starting point
 * @param {Object} b - The ending point
 * @param {number} offsetY - Vertical offset for control points
 * @param {number} offsetX - Horizontal offset for control points
 * @param {number} threshold - The distance threshold
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 * @returns {boolean} - True if mouse is near the curve
 */
function isMouseNearBezierSegments(a, b, offsetY, offsetX, threshold, p5, state) {
  // Check if a and b are defined and have valid coordinates
  if (!a || !b || typeof a.x !== 'number' || typeof a.y !== 'number' || 
      typeof b.x !== 'number' || typeof b.y !== 'number') {
    console.warn('Invalid port coordinates in isMouseNearBezierSegments', a, b);
    return false;
  }
  
  // Check if state has valid mouse coordinates
  if (!state || typeof state.mouseX !== 'number' || typeof state.mouseY !== 'number') {
    console.warn('Invalid state or mouse coordinates in isMouseNearBezierSegments', state);
    return false;
  }
  
  const samples = 50;
  const sag = 39 + Math.abs(a.x - b.x) * 0.065; // Increased by 30% from 30 and 0.05
  let points = [];
  
  // Linear interpolation function (in case p5.lerp is not available)
  const lerp = (start, end, amt) => {
    return start * (1 - amt) + end * amt;
  };
  
  for (let t = 0; t <= 1; t += 1 / samples) {
    // Use p5.lerp if available, otherwise use our own lerp function
    const lerpFunc = (p5 && typeof p5.lerp === 'function') ? 
      ((start, end, amt) => p5.lerp(start, end, amt)) : 
      lerp;
    
    const x = bezierPoint(a.x, lerpFunc(a.x, b.x, 0.25) + offsetX, lerpFunc(a.x, b.x, 0.75) + offsetX, b.x, t);
    const y = bezierPoint(a.y, Math.max(a.y, b.y) + sag + offsetY,
                          Math.max(a.y, b.y) + sag + offsetY, b.y, t);
    points.push({ x, y });
  }
  for (let i = 0; i < points.length - 1; i++) {
    if (distToSegment({ x: state.mouseX, y: state.mouseY }, points[i], points[i + 1]) < threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates a point on a bezier curve
 * @param {number} a - Start point
 * @param {number} b - First control point
 * @param {number} c - Second control point
 * @param {number} d - End point
 * @param {number} t - Parameter (0 to 1)
 * @returns {number} - The point on the curve
 */
function bezierPoint(a, b, c, d, t) {
  const t1 = 1 - t;
  return t1 * t1 * t1 * a + 3 * t1 * t1 * t * b + 3 * t1 * t * t * c + t * t * t * d;
}

/**
 * Calculates the distance from a point to a line segment
 * @param {Object} p - The point
 * @param {Object} a - The start of the segment
 * @param {Object} b - The end of the segment
 * @returns {number} - The distance
 */
function distToSegment(p, a, b) {
  const A = p.x - a.x;
  const B = p.y - a.y;
  const C = b.x - a.x;
  const D = b.y - a.y;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;

  let xx, yy;
  if (param < 0) {
    xx = a.x;
    yy = a.y;
  } else if (param > 1) {
    xx = b.x;
    yy = b.y;
  } else {
    xx = a.x + param * C;
    yy = a.y + param * D;
  }

  const dx = p.x - xx;
  const dy = p.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Draws a box around the entire room grid, including room name at top and group boxes at bottom
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function drawRoomBox(p5, state) {
  const ctx = getGroupBoxContext();
  if (!ctx) return;
  
  // Check if we have any visible rooms
  const hasVisibleRooms = state.roomStates && Object.values(state.roomStates).some(roomState => roomState.visible);
  if (!hasVisibleRooms) {
    return;
  }
  
  // Use the grid bounds system for consistent positioning
  const bounds = getGridCanvasBounds();
  
  // Draw the room box using grid bounds
  ctx.strokeStyle = `rgb(${roomBoxColor[0]}, ${roomBoxColor[1]}, ${roomBoxColor[2]})`;
  ctx.lineWidth = roomBoxStrokeWeight;
  
  ctx.beginPath();
  ctx.rect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  ctx.stroke();
}

// Export the functions
export {
  draw,
  drawBackground,
  drawRoomBox,
  drawGroupBoxes,
  drawCables,
  drawPorts,
  drawText,
  isMouseNearBezierSegments,
  findClosestAvailablePort,
  distToSegment,
  bezierPoint,
  drawCableOnContext
};
