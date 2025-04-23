import axios from "axios";
import { io } from "socket.io-client";

const BASE_URL = "http://144.11.1.83:5000/api";
const SOCKET_URL = "http://144.11.1.83:5000";


// ✅ Initialize WebSocket Connection
const socket = io(SOCKET_URL, {
  reconnectionAttempts: 5, // Auto-reconnect up to 5 times
  timeout: 5000, // 5 seconds timeout
});

// ✅ Helper Function for API Requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
    });
    return response.data;
  } catch (error) {
    console.error(
      `❌ API Error [${method.toUpperCase()} ${endpoint}]:`,
      error.response?.data || error
    );
    return { error: error.response?.data || "Request failed" };
  }
};

// ✅ Fetch Active Ride
export const fetchActiveRide = (userId) =>
  apiRequest("get", `/tracking/ride-status/${userId}`);

// ✅ Fetch Available Rides for Driver
// export const fetchAdvanceRides = (driverId) => apiRequest("get", `/bookings/available-rides/${driverId}`);

// Add/update this function in api.js
export const submitMaintenanceRequest = (requestData) =>
  apiRequest("post", "/requests/maintenance", requestData);


// ✅ Update Maintenance Status
export const updateMaintenanceStatus = (requestId, status, comment = null) =>
  apiRequest("put", `/maintenance/update-status/${requestId}`, { status, comment });

// ✅ Book a Ride & Notify Drivers
export const bookRide = async (
  userId,
  fromLocation,
  toLocation,
  vehicleType,
  rideType = "Regular"
) => {
  if (!userId || isNaN(userId)) return { error: "Invalid User ID" };

  const response = await apiRequest("post", "/bookings/book-ride", {
    userId,
    fromLocation,
    toLocation,
    vehicleType,
    rideType,
    isSpecialTask: rideType === "Special Task"
  });

  if (response?.rideId) {
    socket.emit("newRideRequest", {
      ...response,
      FROM_LOCATION: fromLocation,
      TO_LOCATION: toLocation,
      IS_SPECIAL_TASK: rideType === "Special Task"
    });
  }
  return response;
};

// ✅ Accept a Ride & Notify Requester
export const acceptRide = async (driverId, rideId) => {
  if (!driverId || !rideId) return { error: "Invalid parameters" };

  const response = await apiRequest("post", "/bookings/accept-ride", {
    driverId,
    rideId,
  });
  if (response.success) socket.emit("acceptRide", { driverId, rideId });
  return response;
};

// ✅ Start a Ride
export const startRide = (rideId) =>
  apiRequest("post", "/tracking/start-ride", { rideId });

// ✅ Mark Material Pick Time
export const markPickTime = (rideId) =>
  apiRequest("post", "/tracking/mark-pick-time", { rideId });

// ✅ Complete a Ride
export const completeRide = (rideId) =>
  apiRequest("post", "/tracking/complete-ride", { rideId });

// ✅ Fetch Maintenance Requests
export const fetchMaintenanceRequests = () =>
  apiRequest("get", "/maintenance/issues");

// ✅ Report Maintenance Issue
export const reportMaintenance = (forkliftId, issue) =>
  apiRequest("post", "/maintenance/report-maintenance", { forkliftId, issue });

// ✅ Resolve Maintenance Issue
export const resolveMaintenance = (requestId) =>
  apiRequest("post", "/maintenance/resolve-maintenance", { requestId });

// ✅ Fetch Ride Reports
export const fetchRideReports = () => apiRequest("get", "/reports/rides");




// ✅ Mark Driver as HOME
export const markHome = (driverId) =>
  apiRequest("post", "/drivers/mark-home", { driverId });

// ✅ WebSocket Event Listeners
socket.on("newRideRequest", (rideData) =>
  console.log("📌 New ride request:", rideData)
);
socket.on("rideAccepted", ({ rideId, driverId }) =>
  console.log(`✅ Ride ${rideId} accepted by Driver ${driverId}`)
);
socket.on("driverStatusUpdated", ({ driverId, status }) =>
  console.log(`🔄 Driver ${driverId} is now ${status}`)
);