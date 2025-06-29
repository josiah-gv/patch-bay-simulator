/**
 * Renderer Module
 * Handles drawing and rendering of the patch bay UI
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
  fontFamily
} from '../config/constants.js';

// Import port utilities
import { isPortConnected, getPortAt } from '../models/Port.js';

/**
 * Main draw function for the patch bay
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function draw(p5, state) {
  try {
    p5.background(backgroundColor);
    state.hoverConnection = null;

    if (!state.currentRoom) return;

    const dx = state.cursorX - state.prevCursorX;
    const dy = state.cursorY - state.prevCursorY;

    // Vertical jiggle momentum
    state.controlOffsetY += (dy * 2 - state.controlOffsetY) * 0.2;

    // Horizontal swing momentum
    state.controlOffsetX += (dx * 2 - state.controlOffsetX) * 0.2;

    state.prevCursorX = state.cursorX;
    state.prevCursorY = state.cursorY;

    // Draw group labels and channel numbers with boxes (moved before cables to ensure boxes are behind)
    drawLabelsAndNumbers(p5, state);
    
    // Draw connections
    drawConnections(p5, state);

    // Draw active cable if one exists
    if (state.activeCable) {
      drawActiveCable(p5, state);
    }

    // Find the closest available port for highlighting
    state.closestAvailablePort = findClosestAvailablePort(state);
    
    // Draw ports
    drawPorts(p5, state, state.closestAvailablePort);
  } catch (error) {
    console.error('Error in draw function:', error);
  }
}

/**
 * Draws all connections
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function drawConnections(p5, state) {
  p5.strokeWeight(cableStrokeWeight);
  p5.noFill();
  
  state.connections.forEach(conn => {
    const isHovering = isMouseNearBezierSegments(
      conn.a, 
      conn.b, 
      0, 
      0, 
      16, // Hover threshold
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
      p5.stroke(cableColor[0] * 0.6, cableColor[1] * 0.6, cableColor[2] * 0.6);
      state.hoverConnection = conn;
    } else {
      // Use the cable's normal color
      p5.stroke(cableColor[0], cableColor[1], cableColor[2]);
    }
    
    drawCable(p5, conn.a, conn.b);
  });
}

/**
 * Draws the active cable being dragged
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 */
function drawActiveCable(p5, state) {
  // Use the next color in the sequence for the active cable
  const nextColor = state.cableColors[state.currentColorIndex];
  p5.stroke(nextColor[0], nextColor[1], nextColor[2]);
  drawCable(
    p5,
    state.activeCable, 
    { x: state.cursorX, y: state.cursorY }, 
    state.controlOffsetY, 
    state.controlOffsetX
  );
}

/**
 * Draws all ports
 * @param {Object} p5 - The p5 instance
 * @param {Object} state - The application state
 * @param {Object} closestAvailablePort - The closest available port for highlighting
 */
function drawPorts(p5, state, closestAvailablePort) {
  state.ports.forEach(p => {
    if (isPortConnected(p, state.connections)) {
      // Find the connection this port belongs to
      const conn = state.connections.find(c => c.a === p || c.b === p);
      if (conn && conn.color) {
        // Use the cable's color for the port, but slightly darker
        p5.fill(conn.color[0] * 0.8, conn.color[1] * 0.8, conn.color[2] * 0.8);
      } else {
        // Fallback if no color found
        p5.fill(150, 100, 100);
      }
    } else if (p === closestAvailablePort) {
      // Highlight the closest available port regardless of whether we're holding a cable
      p5.fill(highlightPortColor[0], highlightPortColor[1], highlightPortColor[2]); // green highlight for closest available port
    } else {
      p5.fill(defaultPortColor); // default gray for unconnected ports
    }
    p5.noStroke();
    p5.circle(p.x, p.y, portRadius * 2);
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
    if ((state.activeCable && p !== state.activeCable) || !state.activeCable) {
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

function drawLabelsAndNumbers(p5, state) {
  if (!state.currentRoom || !state.currentRoom.name) {
    console.warn('Cannot draw labels: currentRoom is not properly defined');
    return;
  }
  
  try {
    // Draw room title
    p5.fill(textColor);
    p5.textSize(titleTextSize);
    p5.textAlign(p5.CENTER, p5.TOP);
    p5.textStyle(p5.BOLD); // Make room title bold
    drawTextWithShadow(p5, state.currentRoom.name, canvasWidth / 2, margin / 4); // Further adjusted for more padding
    p5.textStyle(p5.NORMAL); // Reset text style
    
    // Set text properties for labels and numbers
    p5.textSize(channelNumberTextSize);
    p5.textAlign(p5.CENTER, p5.CENTER);
    
    // Check if we have ports to draw
    if (!state.ports || state.ports.length === 0) {
      console.warn('No ports available to draw labels for');
      return;
    }
    
    // Group the ports by section and row
    const portsBySection = {};
    
    state.ports.forEach(port => {
      if (!port || typeof port.section === 'undefined' || !port.row) {
        console.warn('Invalid port object:', port);
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
          // Now using port.groupInternalId to distinguish between duplicate labels
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
        
        // Draw each label group
        labelGroups.forEach(group => {
          const label = group.label;
          const portsWithLabel = group.ports;
          if (portsWithLabel.length === 0) return;
          
          const firstPort = portsWithLabel[0];
          const lastPort = portsWithLabel[portsWithLabel.length - 1];
          const centerX = (firstPort.x + lastPort.x) / 2;
          
          // Draw the group box
          p5.stroke(groupBoxColor[0], groupBoxColor[1], groupBoxColor[2]);
          p5.strokeWeight(groupBoxStrokeWeight);
          p5.noFill();
          
          // Calculate box dimensions - around the label and channel numbers
          const boxLeft = firstPort.x - groupBoxHorizontalPadding;
          const boxRight = lastPort.x + groupBoxHorizontalPadding;
          const boxTop = firstPort.y - topLabelPadding - groupBoxVerticalPadding;
          const boxBottom = firstPort.y - channelNumberPadding + groupBoxVerticalPadding;
          
          // Draw the rectangle - around both label and channel numbers
          p5.rect(boxLeft, boxTop, boxRight - boxLeft, boxBottom - boxTop);
          
          // Draw the label
          p5.fill(textColor);
          p5.textStyle(p5.BOLD); // Make group labels bold
          p5.textSize(groupLabelTextSize);
          drawTextWithShadow(p5, label, centerX, firstPort.y - topLabelPadding);
          p5.textSize(channelNumberTextSize); // Reset to default size for other text
          p5.textStyle(p5.NORMAL); // Reset text style
        });
        
        // Channel numbers
        section.top.forEach(port => {
          if (port.channelNumber) {
            p5.fill(channelNumberColor[0], channelNumberColor[1], channelNumberColor[2]);
            drawTextWithShadow(p5, port.channelNumber, port.x, port.y - channelNumberPadding);
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
          // Now using port.groupInternalId to distinguish between duplicate labels
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
        
        // Draw each label group
        labelGroups.forEach(group => {
          const label = group.label;
          const portsWithLabel = group.ports;
          if (portsWithLabel.length === 0) return;
          
          const firstPort = portsWithLabel[0];
          const lastPort = portsWithLabel[portsWithLabel.length - 1];
          const centerX = (firstPort.x + lastPort.x) / 2;
          
          // Draw the group box
          p5.stroke(groupBoxColor[0], groupBoxColor[1], groupBoxColor[2]);
          p5.strokeWeight(groupBoxStrokeWeight);
          p5.noFill();
          
          // Calculate box dimensions - around the label and channel numbers
          const boxLeft = firstPort.x - groupBoxHorizontalPadding;
          const boxRight = lastPort.x + groupBoxHorizontalPadding;
          const boxTop = firstPort.y + channelNumberPadding - groupBoxVerticalPadding;
          const boxBottom = firstPort.y + bottomLabelPadding + groupBoxVerticalPadding;
          
          // Draw the rectangle - around both label and channel numbers
          p5.rect(boxLeft, boxTop, boxRight - boxLeft, boxBottom - boxTop);
          
          // Draw the label
          p5.fill(textColor);
          p5.textStyle(p5.BOLD); // Make group labels bold
          p5.textSize(groupLabelTextSize);
          drawTextWithShadow(p5, label, centerX, firstPort.y + bottomLabelPadding);
          p5.textSize(channelNumberTextSize); // Reset to default size for other text
          p5.textStyle(p5.NORMAL); // Reset text style
        });
        
        // Channel numbers
        section.bottom.forEach(port => {
          if (port.channelNumber) {
            p5.fill(channelNumberColor[0], channelNumberColor[1], channelNumberColor[2]);
            drawTextWithShadow(p5, port.channelNumber, port.x, port.y + channelNumberPadding);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error drawing labels and numbers:', error);
  }
}

/**
 * Draws a cable between two points
 * @param {Object} p5 - The p5 instance
 * @param {Object} a - The starting point
 * @param {Object} b - The ending point
 * @param {number} offsetY - Vertical offset for control points
 * @param {number} offsetX - Horizontal offset for control points
 */
function drawCable(p5, a, b, offsetY = 0, offsetX = 0) {
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
  const samples = 50;
  const sag = 39 + Math.abs(a.x - b.x) * 0.065; // Increased by 30% from 30 and 0.05
  let points = [];
  for (let t = 0; t <= 1; t += 1 / samples) {
    const x = bezierPoint(a.x, p5.lerp(a.x, b.x, 0.25) + offsetX, p5.lerp(a.x, b.x, 0.75) + offsetX, b.x, t);
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

// Export the functions
export {
  draw,
  drawLabelsAndNumbers,
  drawCable,
  isMouseNearBezierSegments,
  distToSegment,
  bezierPoint
};