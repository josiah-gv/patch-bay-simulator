// Configuration constants
const portRadius = 8;
const safeZoneRadius = 24; // safe zone radius for deletion prevention
const margin = 40;
const portSpacing = 20; // horizontal spacing between ports
const rowSpacing = 40; // vertical spacing between port rows
const sectionSpacing = 60; // vertical spacing between sections
const midGapWidth = portSpacing; // width of gap between columns 24 and 25

// State variables
let rooms = [];
let currentRoom = null;
let ports = [];
let connections = [];
let activeCable = null;
let cursorX = 0, cursorY = 0;
let prevCursorX = 0, prevCursorY = 0;
let controlOffsetY = 0;
let controlOffsetX = 0;
let hoverConnection = null;
let canvasWidth = 1200;
let canvasHeight = 600;

// Define some cable colors to use
const cableColors = [
  [100, 200, 255], // blue
  [255, 100, 100], // red
  [100, 255, 100], // green
  [255, 255, 100], // yellow
  [255, 100, 255], // magenta
  [100, 255, 255]  // cyan
];

// Current color index for new cables
let currentColorIndex = 0;

// Function to load and parse CSV files from the rooms folder
async function loadRooms() {
  return new Promise(async (resolve, reject) => {
    try {
      // For simplicity, we'll directly load the known CSV file
      const csvFile = '1863 Server Room.csv';
      const roomName = csvFile.replace('.csv', '');
      console.log(`Attempting to load room: ${roomName}`);
      
      try {
        const csvResponse = await fetch(`rooms/${csvFile}`);
        if (!csvResponse.ok) {
          throw new Error(`Failed to load room: ${csvResponse.status} ${csvResponse.statusText}`);
        }
        
        const csvText = await csvResponse.text();
        console.log(`Loaded CSV file for ${roomName}, length: ${csvText.length} characters`);
        
        if (csvText.trim() === '') {
          throw new Error('CSV file is empty');
        }
        
        // Parse the CSV data
        const room = parseRoomCSV(csvText, roomName);
        
        if (!room || !room.sections || room.sections.length === 0) {
          throw new Error('Failed to parse room data properly');
        }
        
        rooms = []; // Clear any existing rooms
        rooms.push(room);
        
        // Set the current room
        currentRoom = rooms[0];
        generatePortsFromRoom(currentRoom);
        
        console.log('Room loaded successfully:', roomName);
        console.log('Sections:', currentRoom.sections.length);
        console.log('Ports generated:', ports.length);
        
        resolve(rooms);
      } catch (error) {
        console.error(`Error loading room ${roomName}:`, error);
        reject(error);
      }
    } catch (error) {
      console.error('Error in loadRooms function:', error);
      reject(error);
    }
  });
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
  
  rooms = [fallbackRoom];
  currentRoom = rooms[0];
  generatePortsFromRoom(currentRoom);
  
  console.log('Fallback room created with simple grid');
}

// Function to parse CSV data for a room
function parseRoomCSV(csvText, roomName) {
  console.log(`Parsing CSV for room: ${roomName}`);
  console.log(`CSV text length: ${csvText.length} characters`);
  
  try {
    // Parse the CSV text using Papa Parse
    const result = Papa.parse(csvText, { skipEmptyLines: false });
    const lines = result.data;
    
    console.log(`Parsed ${lines.length} rows from CSV using Papa Parse`);
    
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
    console.warn('Invalid row passed to parseGroupLabels:', row);
    return [];
  }
  
  console.log(`Parsing group labels from row with ${row.length} cells`);
  
  const groups = [];
  let currentGroup = null;
  
  for (let i = 0; i < row.length; i++) {
    // Safely access and trim the cell
    const cell = row[i] ? (typeof row[i] === 'string' ? row[i].trim() : String(row[i])) : '';
    
    if (cell === '') continue;
    
    console.log(`Cell ${i}: '${cell}'`);
    
    if (cell.toLowerCase() === 'end') {
      // End the current group
      if (currentGroup) {
        currentGroup.endIndex = i - 1;
        groups.push(currentGroup);
        console.log(`Ended group '${currentGroup.label}' at index ${currentGroup.endIndex}`);
        currentGroup = null;
      }
    } else if (!currentGroup) {
      // Start a new group
      currentGroup = {
        label: cell,
        startIndex: i,
        endIndex: null
      };
      console.log(`Started new group '${cell}' at index ${i}`);
    } else if (currentGroup && currentGroup.endIndex === null) {
      // If we encounter a new label before an 'end', the previous group ends at the previous column
      currentGroup.endIndex = i - 1;
      groups.push(currentGroup);
      console.log(`Ended group '${currentGroup.label}' at index ${currentGroup.endIndex} (new group found)`);
      
      // Start a new group
      currentGroup = {
        label: cell,
        startIndex: i,
        endIndex: null
      };
      console.log(`Started new group '${cell}' at index ${i}`);
    }
  }
  
  // If we have an open group at the end, close it at the last column
  if (currentGroup && currentGroup.endIndex === null) {
    currentGroup.endIndex = row.length - 1;
    groups.push(currentGroup);
    console.log(`Ended group '${currentGroup.label}' at index ${currentGroup.endIndex} (end of row)`);
  }
  
  console.log(`Parsed ${groups.length} groups from row`);
  return groups;
}

// Function to generate ports from the current room data
function generatePortsFromRoom(room) {
  ports = [];
  
  let yOffset = margin + 40; // Extra space for room title
  
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
        
        ports.push({
          x: x,
          y: yOffset,
          id: portId.trim(),
          channelNumber: channelNumber,
          groupLabel: findGroupForPort(section.topRow.groupLabels, i),
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
        
        ports.push({
          x: x,
          y: yOffset + rowSpacing,
          id: portId.trim(),
          channelNumber: channelNumber,
          groupLabel: findGroupForPort(section.bottomRow.groupLabels, i),
          row: 'bottom',
          section: sectionIndex
        });
      }
    }
    
    // Move down for the next section
    yOffset += rowSpacing * 2 + sectionSpacing;
  });
  
  console.log(`Generated ${ports.length} ports`);
  
  // Adjust canvas height based on the number of sections
  const requiredHeight = yOffset + margin;
  if (requiredHeight > canvasHeight) {
    canvasHeight = requiredHeight;
    resizeCanvas(canvasWidth, canvasHeight);
  }
}

// Helper function to find the group label for a port at a specific index
function findGroupForPort(groupLabels, portIndex) {
  if (!groupLabels || !Array.isArray(groupLabels)) {
    return '';
  }
  
  for (const group of groupLabels) {
    if (group && typeof group === 'object' && 
        'startIndex' in group && 'endIndex' in group && 'label' in group &&
        portIndex >= group.startIndex && portIndex <= group.endIndex) {
      return group.label;
    }
  }
  return '';
}

function setup() {
  try {
    // Create canvas with initial size (will be adjusted based on room data)
    createCanvas(canvasWidth, canvasHeight);
    document.body.style.backgroundColor = '#222222'; // set dark grey page background

    // Load rooms from CSV files
    loadRooms().then(() => {
      console.log('Rooms loaded successfully');
    }).catch(error => {
      console.error('Error loading rooms:', error);
      // If room loading fails, create a fallback room
      createFallbackRoom();
    });

    // Create a Clear All button
    const btn = createButton("Clear All Patches");
    btn.position(10, canvasHeight + 10);
    btn.mousePressed(() => connections = []);
    
    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Error in setup function:', error);
  }
}

function draw() {
  try {
    background(30);
    hoverConnection = null;

    if (!currentRoom) return;

    const dx = cursorX - prevCursorX;
    const dy = cursorY - prevCursorY;

    // Vertical jiggle momentum
    controlOffsetY += (dy * 2 - controlOffsetY) * 0.2;

    // Horizontal swing momentum
    controlOffsetX += (dx * 2 - controlOffsetX) * 0.2;

    prevCursorX = cursorX;
    prevCursorY = cursorY;

    // Draw room title
    textSize(24);
    textAlign(CENTER, TOP);
    fill(255);
    text(currentRoom.name, width / 2, margin / 2);

    // Draw group labels and channel numbers
    drawLabelsAndNumbers();

    // Draw connections
    strokeWeight(4);
    noFill();
    connections.forEach(conn => {
      const isHovering = isMouseNearBezierSegments(conn.a, conn.b, 0, 0, 12);
      const inSafeZone = getPortAt(mouseX, mouseY, safeZoneRadius);
      
      // Get the cable's color
      const cableColor = conn.color || cableColors[0]; // Default to first color if none stored
      
      if (isHovering && !inSafeZone) {
        // Use a darker shade of the cable's color for deletion hover
        stroke(cableColor[0] * 0.6, cableColor[1] * 0.6, cableColor[2] * 0.6);
        hoverConnection = conn;
      } else {
        // Use the cable's normal color
        stroke(cableColor[0], cableColor[1], cableColor[2]);
      }
      drawCable(conn.a, conn.b);
    });

    if (activeCable) {
      // Use the next color in the sequence for the active cable
      const nextColor = cableColors[currentColorIndex];
      stroke(nextColor[0], nextColor[1], nextColor[2]);
      drawCable(activeCable, { x: cursorX, y: cursorY }, controlOffsetY, controlOffsetX);
    }

    // Draw ports
    ports.forEach(p => {
      if (isPortConnected(p)) {
        // Find the connection this port belongs to
        const conn = connections.find(c => c.a === p || c.b === p);
        if (conn && conn.color) {
          // Use the cable's color for the port, but slightly darker
          fill(conn.color[0] * 0.8, conn.color[1] * 0.8, conn.color[2] * 0.8);
        } else {
          // Fallback if no color found
          fill(150, 100, 100);
        }
      } else if (activeCable && p !== activeCable && dist(p.x, p.y, mouseX, mouseY) < safeZoneRadius) {
        fill(100, 200, 100); // green highlight for available port
      } else {
        fill(100); // default gray for unconnected ports
      }
      noStroke();
      circle(p.x, p.y, portRadius * 2);
    });
  } catch (error) {
    console.error('Error in draw function:', error);
  }
}

// Function to draw labels and numbers
function drawLabelsAndNumbers() {
  if (!currentRoom || !currentRoom.name) {
    console.warn('Cannot draw labels: currentRoom is not properly defined');
    return;
  }
  
  try {
    // Draw room title
    fill(255);
    textSize(24);
    textAlign(CENTER, TOP);
    text(currentRoom.name, canvasWidth / 2, margin / 2);
    
    // Set text properties for labels and numbers
    textSize(12);
    textAlign(CENTER, CENTER);
    
    // Check if we have ports to draw
    if (!ports || ports.length === 0) {
      console.warn('No ports available to draw labels for');
      return;
    }
    
    // Group the ports by section and row
    const portsBySection = {};
    
    ports.forEach(port => {
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
        // Group labels
        const uniqueLabels = [...new Set(section.top.map(p => p.groupLabel).filter(Boolean))];
        uniqueLabels.forEach(label => {
          if (!label) return;
          
          const portsWithLabel = section.top.filter(p => p.groupLabel === label);
          if (portsWithLabel.length === 0) return;
          
          const firstPort = portsWithLabel[0];
          const lastPort = portsWithLabel[portsWithLabel.length - 1];
          const centerX = (firstPort.x + lastPort.x) / 2;
          
          fill(200, 200, 255);
          text(label, centerX, firstPort.y - 25);
        });
        
        // Channel numbers
        section.top.forEach(port => {
          if (port.channelNumber) {
            fill(180, 180, 180);
            text(port.channelNumber, port.x, port.y - 15);
          }
        });
      }
      
      // Draw bottom row labels and numbers
      if (section.bottom && section.bottom.length > 0) {
        // Group labels
        const uniqueLabels = [...new Set(section.bottom.map(p => p.groupLabel).filter(Boolean))];
        uniqueLabels.forEach(label => {
          if (!label) return;
          
          const portsWithLabel = section.bottom.filter(p => p.groupLabel === label);
          if (portsWithLabel.length === 0) return;
          
          const firstPort = portsWithLabel[0];
          const lastPort = portsWithLabel[portsWithLabel.length - 1];
          const centerX = (firstPort.x + lastPort.x) / 2;
          
          fill(200, 200, 255);
          text(label, centerX, firstPort.y + 25);
        });
        
        // Channel numbers
        section.bottom.forEach(port => {
          if (port.channelNumber) {
            fill(180, 180, 180);
            text(port.channelNumber, port.x, port.y + 15);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error drawing labels and numbers:', error);
  }
}

function isPortConnected(port) {
  if (!port || !connections || !Array.isArray(connections)) {
    return false;
  }
  
  return connections.some(conn => {
    if (!conn) return false;
    
    // Check for both port1/port2 and a/b formats (depending on implementation)
    if (conn.port1 && conn.port2) {
      return conn.port1 === port || conn.port2 === port;
    } else if (conn.a && conn.b) {
      return conn.a === port || conn.b === port;
    }
    
    return false;
  });
}

function mousePressed() {
  try {
    // Check if we're hovering over a connection to delete it
    if (hoverConnection) {
      const index = connections.indexOf(hoverConnection);
      if (index !== -1) connections.splice(index, 1);
      return;
    }

    const p = getPortAt(mouseX, mouseY, safeZoneRadius);
    if (p) {
      if (!activeCable) {
        // Start a new cable from this port if it's not already connected
        if (!isPortConnected(p)) {
          activeCable = p;
        }
      } else {
        // Only connect if the target port is not the same as the source and not already connected
        if (p !== activeCable && !isPortConnected(p)) {
          // Create a new connection with the current color
          connections.push({ 
            a: activeCable, 
            b: p, 
            color: cableColors[currentColorIndex]
          });
          
          // Cycle to the next color for the next cable
          currentColorIndex = (currentColorIndex + 1) % cableColors.length;
        }
        activeCable = null;
        controlOffsetY = 0;
        controlOffsetX = 0;
      }
    }
  } catch (error) {
    console.error('Error in mousePressed function:', error);
    // Reset active cable to prevent issues
    activeCable = null;
    controlOffsetY = 0;
    controlOffsetX = 0;
  }
}

function mouseMoved() {
  cursorX = mouseX;
  cursorY = mouseY;
}

function getPortAt(x, y, radius = portRadius) {
  if (!ports || !Array.isArray(ports) || ports.length === 0) {
    return null;
  }
  
  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
    console.warn('Invalid coordinates passed to getPortAt:', x, y);
    return null;
  }
  
  const checkRadius = radius || portRadius;
  
  for (let i = 0; i < ports.length; i++) {
    const port = ports[i];
    
    // Check if port has valid coordinates
    if (!port || typeof port.x !== 'number' || typeof port.y !== 'number' || 
        isNaN(port.x) || isNaN(port.y)) {
      continue;
    }
    
    if (dist(x, y, port.x, port.y) < checkRadius) {
      return port;
    }
  }
  
  return null;
}

function isMouseNearBezierSegments(a, b, offsetY, offsetX, threshold) {
  const samples = 50;
  const sag = 30 + Math.abs(a.x - b.x) * 0.05;
  let points = [];
  for (let t = 0; t <= 1; t += 1 / samples) {
    const x = bezierPoint(a.x, lerp(a.x, b.x, 0.25) + offsetX, lerp(a.x, b.x, 0.75) + offsetX, b.x, t);
    const y = bezierPoint(a.y, Math.max(a.y, b.y) + sag + offsetY,
                          Math.max(a.y, b.y) + sag + offsetY, b.y, t);
    points.push({ x, y });
  }
  for (let i = 0; i < points.length - 1; i++) {
    if (distToSegment({ x: mouseX, y: mouseY }, points[i], points[i + 1]) < threshold) {
      return true;
    }
  }
  return false;
}

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

function drawCable(a, b, offsetY = 0, offsetX = 0) {
  const sag = 30 + Math.abs(a.x - b.x) * 0.05;

  const cp1X = lerp(a.x, b.x, 0.25) + offsetX;
  const cp2X = lerp(a.x, b.x, 0.75) + offsetX;

  const controlY = Math.max(a.y, b.y) + sag + offsetY;

  bezier(a.x, a.y, cp1X, controlY, cp2X, controlY, b.x, b.y);
}
