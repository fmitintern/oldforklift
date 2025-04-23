import React from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client"; // ✅ Import Socket.IO Client
import "./RequesterDashboard.css";

const socket = io("http://localhost:5000"); // ✅ Connect to Backend WebSocket

const RequesterDashboard = () => {
  const navigate = useNavigate();

  const handleBookRide = (rideType) => {
    navigate(rideType);

    // ✅ Notify drivers about a new ride request
    socket.emit("newRideRequest", { message: "A new ride has been booked!" });
  };

  return (
    <div className="requester-dashboard">
      <div className="dashboard-container">
        <h2 className="dashboard-title">Type of Booking Required</h2>
        <p className="dashboard-subtext">Please select your ride type.</p>

        {/* 🚀 Fixed & Special Task Ride Buttons */}
        <div className="button-wrapper">
          <button className="button fixed-ride" onClick={() => handleBookRide("/available-rides")}>
            Fixed Ride
          </button>

          <button className="button special-task" onClick={() => handleBookRide("/special-task-ride")}>
            Special Task Ride
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequesterDashboard;
