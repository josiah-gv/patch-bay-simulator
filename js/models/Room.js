/**
 * Room Model Module
 * Handles room data and port generation
 */

// Import constants
import {
  portSpacing,
  midGapWidth,
  margin,
  rowSpacing,
  sectionSpacing,
  canvasWidth,
  canvasHeight,
  gridOrigin,
  gridBounds,
  gridToCanvas,
  updateGridBounds
} from '../config/constants.js';

// Import utility functions
import { findGroupForPort } from '../utils/csvParser.js';

/**
 * Generates ports from room data
 * @param {Object} room - The room object containing sections data
 * @param {Function} resizeCanvas - p5.js function to resize canvas if needed
 * @returns {Object} - Object containing generated ports and updated canvas height
 */
function generatePortsFromRoom(room) {
  const ports = [];
  let updatedCanvasHeight = canvasHeight;
  
  console.log(`Generating ports for room: ${room.name} with ${room.sections.length} sections`);
  
  // Debug: Log the first few port IDs from the parsed room data
  if (room.sections.length > 0) {
    console.log('First section top row port IDs:', room.sections[0].topRow.portIds.slice(0, 5));
    console.log('First section bottom row port IDs:', room.sections[0].bottomRow.portIds.slice(0, 5));
  }
  
  // Grid-relative positioning
  let gridYOffset = gridBounds.padding.top + 130; // Start below room title area
  const gridStartX = gridBounds.padding.left + 40; // Left margin within grid
  
  // For each section in the room
  room.sections.forEach((section, sectionIndex) => {
    // Calculate the width needed for 48 ports with spacing
    const sectionWidth = 24 * portSpacing + midGapWidth + 24 * portSpacing;
    
    console.log(`Processing section ${sectionIndex}`);
    
    // Generate top row ports
    for (let i = 0; i < 48; i++) {
      // Add a gap between columns 24 and 25
      const xOffset = i < 24 ? 0 : midGapWidth;
      const gridX = gridStartX + i * portSpacing + xOffset;
      
      // Convert grid coordinates to canvas coordinates
      const canvasPos = gridToCanvas(gridX, gridYOffset);
      
      // Safely access port ID
      const portId = section.topRow.portIds[i];
      const hasValidPortId = portId && typeof portId === 'string' && portId.trim() !== '';
      
      // Debug: Log the first few port IDs being processed
      if (sectionIndex === 0 && i < 3) {
        console.log(`Creating port ${i}: ID=${hasValidPortId ? portId.trim() : 'null (dead port)'}`);
      }
      
      // Safely access channel number
      const channelNumber = section.topRow.channelNumbers && section.topRow.channelNumbers[i] ? 
                           section.topRow.channelNumbers[i].trim() : '';
      
      const groupInfo = findGroupForPort(section.topRow.groupLabels, i);
      
      // Create port object (either live or dead)
      const port = {
        x: canvasPos.x,
        y: canvasPos.y,
        gridX: gridX,
        gridY: gridYOffset,
        id: hasValidPortId ? portId.trim() : 'null',
        channelNumber: channelNumber,
        groupLabel: groupInfo.label,
        groupInternalId: groupInfo.internalId,
        row: 'top',
        section: sectionIndex,
        isDead: !hasValidPortId
      };
      
      ports.push(port);
    }
    
    // Generate bottom row ports
    for (let i = 0; i < 48; i++) {
      // Add a gap between columns 24 and 25
      const xOffset = i < 24 ? 0 : midGapWidth;
      const gridX = gridStartX + i * portSpacing + xOffset;
      const gridY = gridYOffset + rowSpacing;
      
      // Convert grid coordinates to canvas coordinates
      const canvasPos = gridToCanvas(gridX, gridY);
      
      // Safely access port ID
      const portId = section.bottomRow.portIds[i];
      const hasValidPortId = portId && typeof portId === 'string' && portId.trim() !== '';
      
      // Safely access channel number
      const channelNumber = section.bottomRow.channelNumbers && section.bottomRow.channelNumbers[i] ? 
                           section.bottomRow.channelNumbers[i].trim() : '';
      
      const groupInfo = findGroupForPort(section.bottomRow.groupLabels, i);
      
      // Create port object (either live or dead)
      const port = {
        x: canvasPos.x,
        y: canvasPos.y,
        gridX: gridX,
        gridY: gridY,
        id: hasValidPortId ? portId.trim() : 'null',
        channelNumber: channelNumber,
        groupLabel: groupInfo.label,
        groupInternalId: groupInfo.internalId,
        row: 'bottom',
        section: sectionIndex,
        isDead: !hasValidPortId
      };
      
      ports.push(port);
    }
    
    // Move down for the next section
    gridYOffset += rowSpacing * 2 + sectionSpacing;
  });
  
  // Calculate the required grid height directly from content position
  const requiredGridHeight = gridYOffset + gridBounds.padding.bottom;
  const actualRoomHeight = requiredGridHeight + gridOrigin.y; // Add grid origin offset
  
  // Fix: Actually update the grid bounds height
  updateGridBounds(requiredGridHeight);
  
  return {
    ports,
    updatedCanvasHeight,
    actualRoomHeight // Add this new property
  };
}

/**
 * Gets the current room's title
 * @param {Object} room - The room object
 * @returns {string} - The room title
 */
function getRoomTitle(room) {
  return room ? room.name : 'No Room Loaded';
}

// Export the functions
export {
  generatePortsFromRoom,
  getRoomTitle
};