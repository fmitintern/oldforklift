// ✅ Notify about new requests
export function notifyNewRequest(io, data) {
  io.emit("newRideRequest", {
    requestId: data.requestId,
    vehicle_number: data.vehicle_number,
    status: data.status
  });
}

// ✅ Notify about status changes
export function notifyStatusChange(io, data) {
  io.emit("rideRequestUpdated", {
    requestId: data.requestId,
    status: data.status
  });
}

// ✅ Setup WebSocket listeners
export function setupRequestSocket(io) {
  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);
    // Add any request-specific socket listeners here
  });
}