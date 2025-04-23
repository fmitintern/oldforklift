// ✅ Handle WebSocket events for drivers
export function setupDriverSocket(io) {
  io.on("connection", (socket) => {
    socket.on("newRideRequest", (rideData) => {
      io.to("drivers").emit("newRideRequest", rideData);
    });
  });
}

// ✅ Notify drivers of status changes
export function notifyDrivers(io, data) {
  io.emit("driverStatusUpdated", data);
}