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
  canvasHeight
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
  let yOffset = margin + 120; // Increased extra space to move room down
  let updatedCanvasHeight = canvasHeight;
  
  console.log(`Generating ports for room: ${room.name} with ${room.sections.length} sections`);
  
  // For each section in the room
  room.sections.forEach((section, sectionIndex) => {
    // Calculate the width needed for 48 ports with spacing
    const sectionWidth = 24 * portSpacing + midGapWidth + 24 * portSpacing;
    const startX = (canvasWidth - sectionWidth) / 2;
    
    console.log(`Processing section ${sectionIndex}`);
    
    // Generate top row ports
    for (let i = 0; i < 48; i++) {
      // Add a gap between columns 24 and 25
      const xOffset = i < 24 ? 0 : midGapWidth;
      const x = startX + i * portSpacing + xOffset;
      
      // Safely access port ID
      const portId = section.topRow.portIds[i];
      if (portId && typeof portId === 'string' && portId.trim() !== '') {
        // Safely access channel number
        const channelNumber = section.topRow.channelNumbers && section.topRow.channelNumbers[i] ? 
                             section.topRow.channelNumbers[i].trim() : '';
        
        const groupInfo = findGroupForPort(section.topRow.groupLabels, i);
        ports.push({
          x: x,
          y: yOffset,
          id: portId.trim(),
          channelNumber: channelNumber,
          groupLabel: groupInfo.label,
          groupInternalId: groupInfo.internalId,
          row: 'top',
          section: sectionIndex
        });
      }
    }
    
    // Generate bottom row ports
    for (let i = 0; i < 48; i++) {
      // Add a gap between columns 24 and 25
      const xOffset = i < 24 ? 0 : midGapWidth;
      const x = startX + i * portSpacing + xOffset;
      
      // Safely access port ID
      const portId = section.bottomRow.portIds[i];
      if (portId && typeof portId === 'string' && portId.trim() !== '') {
        // Safely access channel number
        const channelNumber = section.bottomRow.channelNumbers && section.bottomRow.channelNumbers[i] ? 
                             section.bottomRow.channelNumbers[i].trim() : '';
        
        const groupInfo = findGroupForPort(section.bottomRow.groupLabels, i);
        ports.push({
          x: x,
          y: yOffset + rowSpacing,
          id: portId.trim(),
          channelNumber: channelNumber,
          groupLabel: groupInfo.label,
          groupInternalId: groupInfo.internalId,
          row: 'bottom',
          section: sectionIndex
        });
      }
    }
    
    // Move down for the next section
    yOffset += rowSpacing * 2 + sectionSpacing;
  });
  
  console.log(`Generated ${ports.length} ports`);
  
  // Calculate required canvas height based on the number of sections
  const requiredHeight = yOffset + margin;
  if (requiredHeight > updatedCanvasHeight) {
    updatedCanvasHeight = requiredHeight;
  }
  
  return {
    ports,
    updatedCanvasHeight
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