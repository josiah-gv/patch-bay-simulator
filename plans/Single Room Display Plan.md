# Single Room Display Implementation Plan

This document outlines the plan to modify the application to display only one room at a time, with all rooms sharing the same origin point on the canvas. When one room is clicked, other rooms will automatically turn off. This plan incorporates the user's requirements for preserving connections for inactive rooms and dynamically resizing the canvas to optimally fit the active room.

## I. Core Requirements & Objectives

1. **Single Room Display:** Only one room should be visible on the canvas at any given time.
2. **Shared Origin:** All rooms, when active, should be displayed at the same origin point (0,0) on the canvas.
3. **Exclusive Activation:** Clicking a room's toggle button should activate that room and automatically deactivate any currently active room.
4. **Connection Preservation:** Connections made within a room should be preserved even when the room is inactive (hidden).
5. **Dynamic Canvas Resizing:** The canvas should automatically resize to optimally fit the dimensions of the currently active room.

## II. Proposed Changes and Implementation Steps

### A. `js/main.js` Modifications

This file will undergo significant changes to manage the active room state, room positioning, and canvas resizing.

1. **`appState` Updates:**
   - Introduce a new property `appState.activeRoomId` to store the ID of the currently active room. Initialize to `null` or the ID of a default active room.
   - Modify `appState.roomStates` to store connections on a per-room basis. Instead of a global `appState.connections`, each `roomState` object will have its own `connections` array.

2. **Room Positioning Logic (`loadRooms`, `showRoom`):**
   - **Remove Y-offset calculations:** The concept of `roomSpacing` and accumulating Y-offsets for room display will be removed. All rooms will be drawn at `(0,0)` relative to the canvas origin when active.
   - **`loadRooms`:** When loading rooms, ensure that only one room is initially visible (if any). Set `appState.activeRoomId` accordingly.
   - **`showRoom`:**
     - This function will be updated to first `hideRoom` the `appState.activeRoomId` (if one exists).
     - Set `appState.activeRoomId` to the ID of the room being shown.
     - Load the connections associated with the newly active room from its `roomState.connections` array into `appState.connections`.
     - Call `resizeCanvasToActiveRoom()` after showing the room.

3. **Room Toggling (`generateRoomToggleButtons`):**
   - Modify the event listener for room toggle buttons to dispatch a `showRoom` event for the clicked room. The `hideRoom` event will be implicitly handled by `showRoom`.

4. **Canvas Resizing (`resizeCanvasToActiveRoom` - New Function):**
   - Create a new function `resizeCanvasToActiveRoom()`.
   - This function will get the dimensions (width and height) of the `appState.activeRoom`.
   - Use `resizeCanvas(activeRoom.width, activeRoom.height)` to adjust the canvas dimensions.

5. **Port Generation and Drawing (`draw`, `updateCombinedPortsAndConnections`):**
   - **`draw` function:** Ensure `draw` only processes and renders ports and connections for the `appState.activeRoom`.
   - **`updateCombinedPortsAndConnections`:** This function will be simplified to only consider the ports and connections of the `appState.activeRoom`.

6. **Connection Management (`saveConnectionsForRoom`, `loadConnectionsForRoom` - New Functions):**
   - Create `saveConnectionsForRoom(roomId)`: This function will take the current `appState.connections` and save them to the `connections` array of the specified `roomState` object in `appState.roomStates`.
   - Create `loadConnectionsForRoom(roomId)`: This function will clear `appState.connections` and populate it with the connections from the specified `roomState` object.

### B. `js/models/Room.js` Modifications

This file will need minor adjustments to how room dimensions are calculated or accessed.

1. **`generatePortsFromRoom`:**
   - Ensure this function correctly calculates the `roomHeight` and `roomWidth` based on the room's internal layout, as these will be used for canvas resizing.
   - The `yOffset` parameter will no longer be relevant for positioning, but the internal `y` calculation for ports within a room should remain relative to the room's own origin.

### C. `js/ui/layerManager.js` Modifications

This file will need to be updated to handle the new per-room connection storage.

1. **`markDirty` and `clearDirty`:**
   - These functions will need to be aware of the `appState.activeRoomId` and ensure that when connections are modified, they are saved to the correct room's `connections` array in `appState.roomStates` before switching rooms.
   - Specifically, when a connection is added, removed, or modified, the `saveConnectionsForRoom(appState.activeRoomId)` function should be called.

## III. Step-by-Step Implementation Plan

1. **Refactor `appState`:**
   - Add `appState.activeRoomId = null;`.
   - Modify `appState.roomStates` to include a `connections: []` array for each room state.
   - Initialize `appState.connections = [];` as a temporary array for the active room's connections.

2. **Implement Connection Saving/Loading:**
   - Create `saveConnectionsForRoom(roomId)` in `main.js`.
   - Create `loadConnectionsForRoom(roomId)` in `main.js`.

3. **Update `generateRoomToggleButtons`:**
   - Change button event listeners to call `showRoom(room.id)`.

4. **Modify `showRoom` and `hideRoom`:**
   - In `showRoom`:
     - If `appState.activeRoomId` exists, call `saveConnectionsForRoom(appState.activeRoomId)`.
     - Call `hideRoom(appState.activeRoomId)`.
     - Set `appState.activeRoomId = roomId`.
     - Call `loadConnectionsForRoom(roomId)`.
     - Update `roomState.isVisible = true` for the new active room.
     - Call `resizeCanvasToActiveRoom()`.
   - In `hideRoom`:
     - Set `roomState.isVisible = false`.
     - Clear `appState.connections` (as they will be loaded from the next active room).

5. **Implement `resizeCanvasToActiveRoom`:**
   - Create this new function in `main.js`.
   - Get `appState.activeRoom` dimensions and call `resizeCanvas()`.

6. **Adjust `draw` and `updateCombinedPortsAndConnections`:**
   - Simplify `updateCombinedPortsAndConnections` to only consider `appState.activeRoom`'s ports.
   - Ensure `draw` only renders elements related to the `appState.activeRoom`.

7. **Review `Room.js`:**
   - Verify `generatePortsFromRoom` correctly provides room dimensions.

8. **Update `layerManager.js`:**
   - Modify functions that alter connections (e.g., `addConnection`, `removeConnection`) to call `saveConnectionsForRoom(appState.activeRoomId)` after modifying `appState.connections`.