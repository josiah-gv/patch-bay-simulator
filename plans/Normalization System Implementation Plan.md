# Patch Bay Normalization System Implementation Plan

## Overview
This document outlines the complete implementation plan for adding normalization functionality to the patch bay simulator. The system will support both full-normal and half-normal port configurations using dedicated CSV files for each room.

## File Structure

### New Directory Structure
```
project-root/
├── normals/
│   ├── 1862 Edit Suite 2-normals.csv
│   ├── 1863 Server Room-normals.csv
│   └── [roomname]-normals.csv
└── existing files...
```

### Normalization CSV Format
Each room's normalization file follows this structure:
```csv
p1862-av-o09,p1862-av-o10,p1862-65
p1862-av-i01,p1862-av-i02,p1862-api-i01
full-normal,half-normal,full-normal
true,true,false
```

**Row Definitions:**
- **Row 1**: Source port IDs that provide the signal
- **Row 2**: Normalized port IDs that receive the normalized signal
- **Row 3**: Normalization type ("full-normal" or "half-normal")
- **Row 4**: Enabled status (true/false) to enable/disable the normalization

**Column Structure:**
Each column represents one complete normalization configuration. The number of columns can vary based on how many normalizations exist for the room.

## Normalization Logic

### Full-Normal Behavior
- Signal flows from source to normalized port when **both ports are unconnected**
- Signal flow is interrupted when **either port** receives a cable connection
- Use case: Complete isolation when any patching occurs

### Half-Normal Behavior
- Signal flows from source to normalized port when **normalized port (destination) is unconnected**
- Signal flow is interrupted **only when normalized port (destination)** receives a cable connection
- Source port connections do **not** interrupt the normalization
- Use case: Allows monitoring/patching source without breaking normalization

**Example Scenario:**
- p1000 (source) half-normaled to p2000 (destination)
- p1000 has a signal
- Cable connected to p1000: p2000 **still receives** p1000's signal ✓
- Cable connected to p2000: p2000 **stops receiving** p1000's signal and receives the cable's signal instead ✓

## Core Components to Implement

### 1. Normalization Model (`js/models/Normalization.js`)

**Purpose:** Handle normalization data structures and logic

**Key Functions:**
- `createNormalization(sourcePort, normalizedPort, type, enabled)` - Create normalization object
- `validateNormalization(normalization, allPorts)` - Validate normalization data
- `findNormalizationBySourcePort(sourcePort, normalizations)` - Find normalization from source
- `findNormalizationByNormalizedPort(normalizedPort, normalizations)` - Find normalization to destination
- `isPortNormalized(port, normalizations)` - Check if port has any normalization
- `getSignalSource(port, connections, normalizations)` - Determine actual signal source for a port
- `isNormalizationActive(normalization, connections)` - Check if normalization is currently providing signal

**Data Structure:**
```javascript
{
  sourcePort: "p1862-av-o09",
  normalizedPort: "p1862-av-i01",
  type: "half-normal", // or "full-normal"
  enabled: true,
  roomId: "1862 Edit Suite 2"
}
```

**Validation Rules:**
- Source and normalized ports must exist in the same room
- No circular normalizations (A→B, B→A)
- No chained normalizations (A→B→C)
- Ports cannot be both source and destination in different normalizations within the same room
- Type must be either "full-normal" or "half-normal"
- Enabled must be boolean

### 2. Normalization CSV Parser (extend `js/utils/csvParser.js`)

**New Functions to Add:**
- `loadNormalizations()` - Load all normalization files from normals/ directory
- `parseNormalizationCSV(csvText, roomName)` - Parse individual normalization file with horizontal row format
- `discoverNormalizationFiles()` - Find available normalization CSV files
- `validateNormalizationData(normalizations, roomPorts)` - Validate loaded normalizations against room ports

**Horizontal CSV Parsing Logic:**
- Row 1: Source port IDs (split by comma)
- Row 2: Normalized port IDs (split by comma)
- Row 3: Normalization types (split by comma)
- Row 4: Enabled status (split by comma)
- Each column index represents one complete normalization configuration
- Validate that all rows have the same number of columns

**Integration Points:**
- Extend existing `loadRooms()` function to also load normalizations after room loading
- Add normalization data to room objects as `room.normalizations` array
- Handle missing normalization files gracefully (not all rooms need normalizations)
- Log warnings for invalid normalization data but continue operation

**File Discovery Logic:**
- Look for files matching pattern `[roomname]-normals.csv` in `normals/` directory
- Match room names exactly (case-sensitive)
- Skip files that don't match any loaded room

### 3. Signal Flow Logic (extend `js/models/Connection.js`)

**New Functions to Add:**
- `getEffectiveSignalSource(port, connections, normalizations)` - Get actual signal source considering normalizations
- `isNormalizationActive(normalization, connections)` - Check if normalization is currently active
- `findActiveNormalizations(normalizations, connections)` - Get all currently active normalizations
- `hasNormalizedSignal(port, connections, normalizations)` - Check if port receives signal via normalization

**Signal Source Determination Logic:**
```javascript
function getEffectiveSignalSource(port, connections, normalizations) {
  // 1. Check for direct cable connection (highest priority)
  const directConnection = findConnectionWithPort(port, connections);
  if (directConnection) {
    return { type: 'direct', source: directConnection };
  }
  
  // 2. Check for active normalization to this port
  const normalization = findNormalizationByNormalizedPort(port, normalizations);
  if (normalization && normalization.enabled) {
    if (normalization.type === 'full-normal') {
      // Full-normal: both ports must be unconnected
      const sourceConnection = findConnectionWithPort(normalization.sourcePort, connections);
      if (!sourceConnection) {
        return { type: 'normalization', source: normalization };
      }
    } else if (normalization.type === 'half-normal') {
      // Half-normal: only destination port must be unconnected
      return { type: 'normalization', source: normalization };
    }
  }
  
  return { type: 'none', source: null };
}
```

**Full-Normal Implementation:**
- Check if both source and destination ports are unconnected
- Signal flows only when both conditions are met
- Any connection to either port breaks the normalization

**Half-Normal Implementation:**
- Check only if destination port is unconnected
- Source port connection status is irrelevant
- Only destination port connection breaks the normalization

### 4. Visual Indicators (extend `js/ui/renderer.js`)

**Modifications Needed:**
- Extend port rendering to show signal rings for normalized signals
- Use existing signal ring visualization system from cross-room implementation
- Add normalization state checking to port rendering logic
- Ensure normalized signals use appropriate visual treatment

**Visual Rules:**
- Normalized ports show signal rings when receiving normalized signal
- Use same visual treatment as regular signal flow (thin colored ring)
- Signal ring color should indicate the source signal type
- No special normalization-specific visual elements needed
- Reuse existing signal ring rendering code

**Integration with Existing Signal System:**
- Leverage existing cross-room signal visualization
- Extend signal source determination to include normalizations
- Ensure normalized signals are treated like any other signal for rendering

## Implementation Steps

### Phase 1: Core Data Structures
1. **Create Normalization Model**
   - Create `js/models/Normalization.js` with basic data structures
   - Implement normalization object creation and validation
   - Add utility functions for normalization lookup
   - Test with sample normalization data

2. **Extend CSV Parser**
   - Add normalization file discovery to `csvParser.js`
   - Implement normalization CSV parsing
   - Add validation against room port data
   - Test normalization loading with sample files

3. **Data Integration**
   - Modify room objects to include normalization data
   - Update room loading process to include normalizations
   - Ensure proper error handling for missing/invalid files
   - Test complete data loading pipeline

### Phase 2: Signal Flow Integration
1. **Implement Signal Logic**
   - Add signal source determination functions to Connection model
   - Implement full-normal and half-normal logic
   - Add normalization state tracking
   - Test signal flow logic with various connection scenarios

2. **Update Connection System**
   - Modify existing connection checking to consider normalizations
   - Update port connection status functions
   - Ensure normalization state updates on connection changes
   - Test connection/disconnection events

### Phase 3: Visual Integration
1. **Extend Port Rendering**
   - Modify port rendering to check for normalized signals
   - Integrate with existing signal ring system
   - Apply signal ring visualization to normalized ports
   - Test visual feedback with different normalization states

2. **Signal Ring Integration**
   - Ensure normalized signals use existing ring rendering
   - Handle signal ring colors appropriately
   - Test visual performance with multiple normalized signals
   - Verify visual consistency across different scenarios


### Phase 4: System Integration
1. **Application Integration**
   - Integrate normalization loading into main application startup
   - Add normalization data to room switching logic
   - Ensure normalizations work with existing room management
   - Test complete system functionality

2. **Cross-Room Compatibility**
   - Ensure normalizations work with existing cross-room features
   - Test normalization with room switching
   - Verify normalization state preservation
   - Test interaction with cross-room signals

3. **Final Testing**
   - Comprehensive testing of all normalization features
   - Performance testing with realistic data sets
   - Edge case testing and error handling validation
   - User acceptance testing scenarios

## Data Flow

### Application Startup
1. Load room CSV files (existing functionality)
2. Load normalization CSV files for each room
3. Validate normalization data against room ports
4. Store normalizations in room objects (`room.normalizations`)
5. Initialize signal flow system with normalization awareness

### Signal Flow Determination Process
1. **Port Signal Check Request**
   - User interaction or rendering system requests port signal status
   - System calls `getEffectiveSignalSource(port, connections, normalizations)`

2. **Direct Connection Check**
   - Check if port has direct cable connection
   - If yes, return direct connection as signal source
   - If no, proceed to normalization check

3. **Normalization Check**
   - Find any normalization where this port is the destination
   - If found and enabled, apply normalization type logic:
     - **Full-normal**: Check if source port is also unconnected
     - **Half-normal**: Signal flows regardless of source port status
   - Return normalization as signal source if active

4. **Signal Source Return**
   - Return effective signal source (direct, normalization, or none)
   - Rendering system uses this to display appropriate visual indicators

### Connection Events
1. **Cable Connection**
   - User connects cable between two ports
   - System updates connection data
   - Recalculates signal flow for affected ports and their normalizations
   - Updates visual indicators for all affected ports

2. **Cable Disconnection**
   - User removes cable
   - System removes connection data
   - Recalculates signal flow (normalizations may become active)
   - Updates visual indicators for all affected ports

### Room Switching
1. **Room Deactivation**
   - Save current room's connection state
   - Preserve normalization configurations
   - Clear visual elements

2. **Room Activation**
   - Load room's connection state
   - Load room's normalization configurations
   - Recalculate all signal flows
   - Update visual indicators

## Error Handling

### File Loading Errors
- **Missing normalization files**: Log info message, continue without normalizations for that room
- **Invalid CSV format**: Log warning, skip invalid rows, continue with valid data
- **File read errors**: Log error, continue without normalizations for that room
- **Network errors**: Retry with exponential backoff, fallback to no normalizations

### Data Validation Errors
- **Invalid port IDs**: Log warning, disable affected normalizations
- **Circular dependencies**: Log error, disable all normalizations in the cycle
- **Conflicting normalizations**: Log warning, disable conflicting normalizations
- **Invalid normalization types**: Log warning, disable affected normalizations

### Runtime Errors
- **Missing port references**: Handle gracefully, treat as no signal
- **Invalid normalization data**: Skip invalid normalizations, continue with valid ones
- **Signal calculation errors**: Log error, fallback to direct connection checking only
- **Rendering errors**: Log error, continue without normalization visual indicators

### Recovery Strategies
- **Graceful degradation**: System continues to function without normalizations if errors occur
- **Partial functionality**: Valid normalizations continue to work even if some are invalid
- **Error reporting**: Clear error messages in console for debugging
- **State consistency**: Ensure system state remains consistent even with errors

## Testing Scenarios

### Basic Functionality Tests
1. **Full-Normal Tests**
   - Both ports unconnected → signal flows
   - Source port connected → no signal flow
   - Destination port connected → no signal flow
   - Both ports connected → no signal flow

2. **Half-Normal Tests**
   - Both ports unconnected → signal flows
   - Source port connected → signal flows
   - Destination port connected → no signal flow
   - Both ports connected → no signal flow

3. **Mixed Scenarios**
   - Multiple normalizations in same room
   - Normalizations with different types
   - Enabled/disabled normalizations
   - Complex connection patterns


## Integration Points

### Existing Systems to Modify
1. **CSV Parser (`js/utils/csvParser.js`)**
   - Add normalization file discovery
   - Add normalization CSV parsing
   - Integrate with existing room loading
   - Add validation functions

2. **Connection Model (`js/models/Connection.js`)**
   - Add normalization-aware signal flow functions
   - Extend connection checking logic
   - Add normalization state tracking
   - Update signal source determination

3. **Port Model (`js/models/Port.js`)**
   - Add normalization state checking functions
   - Extend port connection status logic
   - Add normalization lookup utilities
   - Update port signal status functions

4. **Renderer (`js/ui/renderer.js`)**
   - Extend signal ring rendering for normalizations
   - Add normalization state to port rendering
   - Integrate with existing signal visualization
   - Update rendering pipeline

5. **Room Model (`js/models/Room.js`)**
   - Add normalization data storage
   - Extend room loading/unloading
   - Add normalization management functions
   - Update room state handling

### Systems That Remain Unchanged
- **User interface elements**: No new UI components needed
- **Interaction handling**: Existing mouse/touch interactions sufficient
- **Layer management**: No changes to rendering layers
- **Cross-room registry**: Existing cross-room functionality compatible
- **Main application structure**: Core application flow unchanged
- **Configuration system**: No new configuration options needed

### Compatibility Considerations
- **Backward compatibility**: System works without normalization files
- **Cross-room signals**: Normalizations work with existing cross-room features
- **Connection system**: Normalizations integrate with existing connection logic
- **Visual system**: Normalizations use existing signal ring rendering
- **Room management**: Normalizations work with existing room switching

## Success Criteria

### Functional Requirements
- [ ] Full-normal ports behave correctly (signal interrupted by any connection)
- [ ] Half-normal ports behave correctly (signal interrupted only by destination connection)
- [ ] Normalization CSV files load and parse correctly
- [ ] Invalid normalization data is handled gracefully
- [ ] Visual indicators show normalized signals using existing signal rings
- [ ] System performance remains acceptable with normalizations enabled

### Technical Requirements
- [ ] Code follows existing project patterns and conventions
- [ ] Error handling is comprehensive and user-friendly
- [ ] Memory usage is efficient and stable
- [ ] Integration with existing systems is seamless
- [ ] No breaking changes to existing functionality
- [ ] Documentation is complete and accurate

### Quality Requirements
- [ ] All edge cases are handled appropriately
- [ ] System degrades gracefully when errors occur
- [ ] Performance impact is minimal
- [ ] Code is maintainable and extensible
- [ ] Testing coverage is comprehensive
- [ ] User experience is intuitive and consistent
