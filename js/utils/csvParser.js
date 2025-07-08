/**
 * CSV Parser Module
 * Handles loading and parsing of room data from CSV files
 */

// Function to load and parse CSV files from the rooms folder
async function loadRooms() {
  return new Promise(async (resolve, reject) => {
    try {
      // Get list of CSV files from the rooms directory
      const csvFiles = await discoverCSVFiles();
      console.log(`Found ${csvFiles.length} CSV files:`, csvFiles);
      
      if (csvFiles.length === 0) {
        console.error('No CSV files found in rooms folder');
        resolve([]);
        return;
      }
      
      const rooms = [];
      
      // Load each CSV file
      for (const csvFile of csvFiles) {
        const roomName = csvFile.replace('.csv', '');
        console.log(`Attempting to load room: ${roomName}`);
        
        try {
          // Add cache-busting parameter to force fresh load
          const cacheBuster = Date.now();
          const csvResponse = await fetch(`rooms/${csvFile}?v=${cacheBuster}`);
          if (!csvResponse.ok) {
            console.error(`Failed to load room ${roomName}: ${csvResponse.status} ${csvResponse.statusText}`);
            continue; // Skip this file and continue with others
          }
          
          const csvText = await csvResponse.text();
          console.log(`Loaded CSV file for ${roomName}, length: ${csvText.length} characters`);
          
          if (csvText.trim() === '') {
            console.error(`CSV file ${csvFile} is empty`);
            continue; // Skip empty files
          }
          
          // Parse the CSV data
          const room = parseRoomCSV(csvText, roomName);
          
          if (!room || !room.sections || room.sections.length === 0) {
            console.error(`Failed to parse room data properly for ${roomName}`);
            continue; // Skip files that don't parse correctly
          }
          
          rooms.push(room);
          console.log('Room loaded successfully:', roomName);
          console.log('Sections:', room.sections.length);
        } catch (error) {
          console.error(`Error loading room ${roomName}:`, error);
          // Continue with other files even if one fails
        }
      }
      
      if (rooms.length === 0) {
        console.error('No rooms loaded successfully');
      } else {
        console.log(`Successfully loaded ${rooms.length} rooms`);
      }
      
      resolve(rooms);
    } catch (error) {
      console.error('Error in loadRooms function:', error);
      reject(error);
    }
  });
}

// Function to discover CSV files in the rooms folder
async function discoverCSVFiles() {
  try {
    // Since we can't directly list directory contents from the browser,
    // we'll try to load known files and also attempt common patterns
    const knownFiles = [
      '1862 Edit Suite 2.csv',
      '1863 Server Room.csv'
    ];
    
    const existingFiles = [];
    
    // Test each known file to see if it exists
    for (const file of knownFiles) {
      try {
        // Add cache-busting parameter to force fresh load
        const cacheBuster = Date.now();
        const response = await fetch(`rooms/${file}?v=${cacheBuster}`, { method: 'HEAD' });
        if (response.ok) {
          existingFiles.push(file);
        }
      } catch (error) {
        // File doesn't exist, skip it
        console.log(`File ${file} not found, skipping`);
      }
    }
    
    return existingFiles;
  } catch (error) {
    console.error('Error discovering CSV files:', error);
    return [];
  }
}

// Function to create a fallback room if loading fails
function createFallbackRoom() {
  console.log('Creating fallback room with simple grid');
  
  // Create a simple 2x48 grid with basic port IDs
  const fallbackRoom = {
    name: 'Default Room',
    sections: [{
      topRow: {
        groupLabels: [{ label: 'Top Row', startIndex: 0, endIndex: 47 }],
        channelNumbers: Array.from({ length: 48 }, (_, i) => String(i + 1)),
        portIds: Array.from({ length: 48 }, (_, i) => `p${String(i + 1).padStart(4, '0')}`)
      },
      bottomRow: {
        groupLabels: [{ label: 'Bottom Row', startIndex: 0, endIndex: 47 }],
        channelNumbers: Array.from({ length: 48 }, (_, i) => String(i + 1)),
        portIds: Array.from({ length: 48 }, (_, i) => `p${String(i + 49).padStart(4, '0')}`)
      }
    }]
  };
  
  const rooms = [fallbackRoom];
  console.log('Fallback room created with simple grid');
  
  return rooms;
}

// Function to parse CSV data for a room
function parseRoomCSV(csvText, roomName) {
  console.log(`Parsing CSV for room: ${roomName}`);
  console.log(`CSV text length: ${csvText.length} characters`);
  
  try {
    // Parse the CSV text using Papa Parse
    // Note: Papa is expected to be available globally from the script included in index.html
    const result = Papa.parse(csvText, { skipEmptyLines: false });
    const lines = result.data;
    
    console.log(`Parsed ${lines.length} rows from CSV using Papa Parse`);
    
    // Debug: Log the actual CSV content
    console.log('First few lines of parsed CSV:');
    lines.slice(0, 6).forEach((line, index) => {
      console.log(`Line ${index}:`, line.slice(0, 10)); // First 10 columns
    });
    
    // Check if we have enough rows for at least one section
    if (lines.length < 6) {
      console.error('CSV file does not have enough rows for a complete section');
      return { name: roomName, sections: [] };
    }
    
    const sections = [];
    
    // Process the CSV in chunks of 6 rows (for each section)
    for (let i = 0; i < lines.length; i += 6) {
      // Skip if we don't have enough rows for a complete section
      if (i + 6 > lines.length) {
        console.log(`Skipping incomplete section at row ${i}`);
        break;
      }
      
      // Debug logging
      console.log(`Processing section starting at row ${i}`);
      console.log(`Row lengths: ${lines[i].length}, ${lines[i+1]?.length}, ${lines[i+2]?.length}, ${lines[i+3]?.length}, ${lines[i+4]?.length}, ${lines[i+5]?.length}`);
      
      // Create section with proper error handling
      try {
        // Ensure all rows exist and have data
        const topGroupLabelsRow = lines[i] || [];
        const topChannelNumbersRow = lines[i+1] || [];
        const topPortIdsRow = lines[i+2] || [];
        const bottomPortIdsRow = lines[i+3] || [];
        const bottomChannelNumbersRow = lines[i+4] || [];
        const bottomGroupLabelsRow = lines[i+5] || [];
        
        // Debug: Log the port ID rows specifically
        console.log(`Top port IDs (row ${i+2}):`, topPortIdsRow.slice(0, 5));
        console.log(`Bottom port IDs (row ${i+3}):`, bottomPortIdsRow.slice(0, 5));
        
        // Check if this section has any data
        if (topPortIdsRow.length === 0 || (topPortIdsRow.length === 1 && topPortIdsRow[0].trim() === '')) {
          console.log(`Skipping empty section at row ${i}`);
          continue;
        }
        
        const section = {
          topRow: {
            groupLabels: parseGroupLabels(topGroupLabelsRow),
            channelNumbers: topChannelNumbersRow,
            portIds: topPortIdsRow
          },
          bottomRow: {
            portIds: bottomPortIdsRow,
            channelNumbers: bottomChannelNumbersRow,
            groupLabels: parseGroupLabels(bottomGroupLabelsRow)
          }
        };
        
        sections.push(section);
        console.log(`Added section ${sections.length} with ${topPortIdsRow.length} columns`);
      } catch (error) {
        console.error(`Error parsing section at row ${i}:`, error);
      }
    }
    
    console.log(`Parsed ${sections.length} sections for room ${roomName}`);
    
    return {
      name: roomName,
      sections: sections
    };
  } catch (error) {
    console.error('Error parsing CSV with Papa Parse:', error);
    return { name: roomName, sections: [] };
  }
}

// Function to parse group labels from a row
function parseGroupLabels(row) {
  if (!row || !Array.isArray(row)) {
    return [];
  }
  
  console.log(`Parsing group labels from row with ${row.length} cells`);
  
  const groups = [];
  let currentGroup = null;
  
  // Track label occurrences to add unique identifiers to duplicates
  const labelCounts = {};
  
  // Process each cell in the row
  for (let i = 0; i < row.length; i++) {
    const cell = row[i] ? (typeof row[i] === 'string' ? row[i].trim() : String(row[i])) : '';
    
    if (cell.toLowerCase() === 'end') {
      // If we encounter 'END', include this cell with the previous group
      if (currentGroup) {
        currentGroup.endIndex = i;
        console.log(`Extended group '${currentGroup.label}' to include END marker at index ${i}`);
      }
      continue;
    }
    
    if (cell !== '') {
      // Found a cell with text - create a new group
      console.log(`Found label '${cell}' at index ${i}`);
      
      // Track occurrences of this label
      if (!labelCounts[cell]) {
        labelCounts[cell] = 1;
      } else {
        labelCounts[cell]++;
      }
      
      // Create a unique internal identifier for duplicate labels
      const internalId = `${cell}__${labelCounts[cell]}`;
      
      currentGroup = {
        label: cell,           // The visible label (unchanged)
        internalId: internalId, // Unique identifier for internal use
        startIndex: i,
        endIndex: i
      };
      
      groups.push(currentGroup);
      console.log(`Created new group '${cell}' (internal ID: ${internalId}) at index ${i}`);
    } else if (currentGroup) {
      // Empty cell - extend the current group to include this cell
      currentGroup.endIndex = i;
      console.log(`Extended group '${currentGroup.label}' to include empty cell at index ${i}`);
    }
  }
  
  console.log(`Parsed ${groups.length} groups from row`);
  return groups;
}

// Helper function to find the group label and internal ID for a port at a specific index
function findGroupForPort(groupLabels, portIndex) {
  if (!groupLabels || !Array.isArray(groupLabels)) {
    return { label: '', internalId: '' };
  }
  
  for (const group of groupLabels) {
    if (group && typeof group === 'object' && 
        'startIndex' in group && 'endIndex' in group && 'label' in group &&
        portIndex >= group.startIndex && portIndex <= group.endIndex) {
      // Return both the label and the internal ID
      return { 
        label: group.label, 
        internalId: group.internalId || group.label // Fallback to label if internalId doesn't exist
      };
    }
  }
  return { label: '', internalId: '' };
}

// Export the functions as an ES module
export {
  loadRooms,
  parseRoomCSV,
  parseGroupLabels,
  findGroupForPort,
  createFallbackRoom
};