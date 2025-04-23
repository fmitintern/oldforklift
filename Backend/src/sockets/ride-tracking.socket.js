// ✅ Notify when ride is accepted
export function notifyRideAccepted(io, { rideId, driverId }) {
  io.emit("rideAccepted", { rideId, driverId });
  io.emit("rideUpdated", { 
    rideId, 
    status: "accepted", 
    driverId 
  });
}

// ✅ Notify when ride is completed
export function notifyRideCompleted(io, { rideId, driverId, endTime }) {
  io.emit("rideCompleted", { 
    rideId,
    driverId,
    endTime 
  });
}

// ✅ Setup WebSocket listeners
export function setupRideTrackingSocket(io) {
  io.on("connection", (socket) => {
    console.log(`New ride tracking connection: ${socket.id}`);
    // Add any ride-specific socket listeners here
  });
}