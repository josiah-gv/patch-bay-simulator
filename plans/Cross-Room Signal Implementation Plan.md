## Overview
This plan implements a system where ports can have duplicate IDs across different rooms, but connections are scoped to specific rooms. When a cable is connected to a port, all ports with the same ID in other rooms will display a visual indicator (thin colored ring) showing the cable color.

## Phase 1: Data Structure Modifications

### Step 1.1: Update Connection Data Structure
- Modify the connection object format to include room context
- Change from simple port ID references to compound identifiers
- Ensure backward compatibility during transition
- Update connection creation, storage, and retrieval logic

### Step 1.2: Create Cross-Room Port Registry
- Build a mapping system that tracks which port IDs exist in which rooms
- Create a lookup table for finding all instances of a port ID across rooms
- Implement functions to register/unregister ports when rooms are loaded/unloaded
- Add validation to ensure port registry stays synchronized with room data

### Step 1.3: Enhance Room State Management
- Update room state objects to include port ID mappings
- Modify room loading/unloading functions to update the cross-room registry
- Ensure proper cleanup when rooms are hidden or removed
- Add room-specific connection isolation

## Phase 2: Connection System Refactoring

### Step 2.1: Update Connection Creation Logic
- Modify the mouse interaction system to create room-scoped connections
- Update the connection validation to check within room context
- Ensure new connections include both room ID and port ID information
- Update connection saving/loading to handle the new format

### Step 2.2: Refactor Connection Management Functions
- Update `saveConnectionsForRoom` to handle compound identifiers
- Modify `loadConnectionsForRoom` to properly restore room-scoped connections
- Update connection finding and filtering functions
- Ensure connection deletion works with the new format

### Step 2.3: Update Port Connection Status Checking
- Modify `isPortConnected` function to work with room-scoped connections
- Update connection lookup logic throughout the application
- Ensure hover effects and visual states work correctly
- Update cable deletion functionality

## Phase 3: Cross-Room Signal Tracking

### Step 3.1: Create Signal State Management
- Implement a system to track which port IDs have active signals
- Create data structures to store signal information (port ID, cable color, source room)
- Add functions to register/unregister signals when connections are made/broken
- Implement signal propagation logic across rooms

### Step 3.2: Signal Event System
- Create event handlers for connection creation and deletion
- Implement signal registration when cables are connected
- Add signal cleanup when cables are disconnected
- Ensure signals are properly managed during room switching

### Step 3.3: Cross-Room Signal Lookup
- Implement functions to find all ports with the same ID across different rooms
- Create efficient lookup mechanisms for signal propagation
- Add validation to ensure signal consistency
- Handle edge cases like missing rooms or invalid port references

## Phase 4: Visual Indicator System

### Step 4.1: Design Visual Indicator Rendering
- Plan the visual design for the thin colored ring indicator
- Determine ring thickness, positioning, and color application
- Ensure indicators don't interfere with existing port visuals
- Plan for multiple signal indicators on the same port (if needed)

### Step 4.2: Implement Indicator Drawing Logic
- Add rendering functions for the signal indicator rings
- Integrate indicator drawing into the existing port rendering system
- Ensure indicators are drawn at the correct layer depth
- Implement color management for indicator rings

### Step 4.3: Update Port Rendering System
- Modify the port drawing functions to include signal indicators
- Add logic to determine which ports should show indicators
- Ensure indicators are only shown for ports in non-active rooms
- Update the rendering pipeline to handle the new visual elements

## Phase 5: Integration and State Management

### Step 5.1: Update Application State
- Modify the global application state to include signal tracking
- Add signal state to room state objects
- Ensure proper state synchronization across room switches
- Update state initialization and cleanup procedures

### Step 5.2: Integrate with Existing Layer System
- Update the layer management system to handle signal indicators
- Ensure proper layer invalidation when signals change
- Add signal indicators to the appropriate rendering layers
- Update layer dirty marking for signal state changes

### Step 5.3: Update Room Switching Logic
- Modify room showing/hiding functions to handle signal state
- Ensure signal indicators are properly updated during room transitions
- Add signal state preservation during room switches
- Update the room activation/deactivation workflow

## Phase 6: Testing and Validation

### Step 6.1: Connection System Testing
- Test connection creation and deletion with room-scoped identifiers
- Verify connection isolation between rooms
- Test connection persistence across room switches
- Validate backward compatibility with existing data

### Step 6.2: Signal Indicator Testing
- Test signal indicator appearance and disappearance
- Verify correct color propagation across rooms
- Test multiple signals on the same port ID
- Validate indicator positioning and visual quality

### Step 6.3: Cross-Room Functionality Testing
- Test signal propagation across multiple rooms
- Verify signal cleanup when connections are removed
- Test edge cases like room loading/unloading during active signals
- Validate performance with multiple active signals

## Phase 7: Performance and Optimization

### Step 7.1: Optimize Signal Lookup Performance
- Implement efficient data structures for cross-room port lookup
- Add caching mechanisms for frequently accessed signal data
- Optimize rendering performance for multiple indicators
- Profile and optimize critical path operations

### Step 7.2: Memory Management
- Ensure proper cleanup of signal state when rooms are unloaded
- Implement garbage collection for orphaned signal references
- Optimize memory usage for large numbers of signals
- Add monitoring for memory leaks in signal tracking

### Step 7.3: Rendering Optimization
- Optimize indicator rendering for smooth performance
- Implement efficient dirty checking for signal state changes
- Add batching for multiple indicator updates
- Ensure smooth animation and visual transitions

## Implementation Notes

### Key Considerations
- Maintain backward compatibility with existing room data
- Ensure robust error handling for missing or invalid references
- Plan for future extensibility (multiple signal types, complex routing)
- Consider performance implications of cross-room lookups

### Success Criteria
- Connections work correctly within individual rooms
- Signal indicators appear on matching ports in other rooms
- Visual indicators display the correct cable colors
- System performance remains smooth with multiple active signals
- Room switching preserves all signal states correctly

### Risk Mitigation
- Implement comprehensive error handling for edge cases
- Add validation for data consistency across room switches
- Plan rollback procedures if issues arise during implementation
- Test thoroughly with various room configurations and connection patterns