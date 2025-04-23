import {
  acceptRideService,
  markPickTimeService,
  completeRideService,
  getRideStatusService
} from "../services/ride-tracking.service.js";
import {
  notifyRideAccepted,
  notifyRideCompleted
} from "../sockets/ride-tracking.socket.js";

export const acceptRide = async (req, res) => {
  try {
    const { driverId, rideId } = req.body;
    const result = await acceptRideService(driverId, rideId);
    
    notifyRideAccepted(req.io, { rideId, driverId });
    
    res.status(200).json({ 
      message: "Ride accepted successfully!",
      ...result
    });
  } catch (error) {
    handleTrackingError(res, error, "accept ride");
  }
};

export const markPickTime = async (req, res) => {
  try {
    const { rideId } = req.body;
    await markPickTimeService(rideId);
    res.status(200).json({ message: "Pick time marked successfully!" });
  } catch (error) {
    handleTrackingError(res, error, "mark pick time");
  }
};

export const completeRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const completedRide = await completeRideService(rideId);
    
    notifyRideCompleted(req.io, { 
      rideId,
      driverId: completedRide.driverId,
      endTime: completedRide.endTime 
    });
    
    res.status(200).json({
      success: true,
      message: "Ride completed successfully",
      ride: completedRide
    });
  } catch (error) {
    handleTrackingError(res, error, "complete ride");
  }
};

export const getRideStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const status = await getRideStatusService(rideId);
    res.status(200).json(status);
  } catch (error) {
    handleTrackingError(res, error, "fetch ride status");
  }
};

// 🛠️ Reusable Error Handler
function handleTrackingError(res, error, action) {
  console.error(`Error in ${action}:`, error);
  const status = error.statusCode || 500;
  res.status(status).json({
    success: false,
    error: `Failed to ${action.replace("-", " ")}`,
    details: error.message,
    ...(error.validationErrors && { errors: error.validationErrors })
  });
}