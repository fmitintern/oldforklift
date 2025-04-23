import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "./DriverDashboard.css";
import { acceptRide, completeRide, submitMaintenanceRequest } from "../Services/api";

const SOCKET_URL = "http://144.11.1.83:5000";

const DriverDashboard = ({ driver }) => {
  const [ongoingRide, setOngoingRide] = useState(null);
  const [newRideRequests, setNewRideRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rideEndedMessage, setRideEndedMessage] = useState("");
  const [rideAcceptedMessage, setRideAcceptedMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("active");
  const [rideHistory, setRideHistory] = useState([]);
  const [materialPicked, setMaterialPicked] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState("");
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [maintenanceSubmitted, setMaintenanceSubmitted] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const navigate = useNavigate();

  const maintenanceReasons = {
    forklift: ["Engine Issue", "Hydraulic Problem", "Tire Replacement", "Electrical Fault"],
    crane: ["Boom Issue", "Hydraulic Leak", "Cable Problem", "Engine Trouble"],
    other: ["General Maintenance", "Safety Check", "Unknown Issue"]
  };

  const handleMaintenanceSubmit = async () => {
    if (!selectedMaintenanceType || !maintenanceReason) {
      setMaintenanceMessage("Please select both vehicle type and reason");
      return;
    }
    console.log("🧪 driver object:", driver);

    try {
      await submitMaintenanceRequest({
        driver_id: driver.id,
        driver_name: driver.name,
        vehicle_type: selectedMaintenanceType,
        issue: maintenanceReason,
        comment_text: "", // or capture from user
        status: "pending"
      });
      
      
      setMaintenanceMessage("Maintenance request submitted successfully!");
      setMaintenanceSubmitted(true);
  
      // Reset form after 3 seconds
      setTimeout(() => {
        setShowMaintenanceModal(false);
        setMaintenanceSubmitted(false);
        setSelectedMaintenanceType("");
        setMaintenanceReason("");
        setMaintenanceMessage("");
      }, 3000);
    } catch (error) {
      setMaintenanceMessage("Failed to submit maintenance request");
      console.error("Error submitting maintenance request:", error);
    }
  };
      

  const ridesPerPage = 10;

  useEffect(() => {
    const newSocket = io(SOCKET_URL, { 
      autoConnect: true,
      reconnection: true,
      transports: ['websocket']
    });
    setSocket(newSocket);
  
    newSocket.on("connect", () => {
      console.log("✅ Connected to DriverDashboard Socket.IO server");
    });
  
    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from DriverDashboard Socket.IO server");
    });
  
    newSocket.on("newRideRequest", (newRide) => {
      console.log("🆕 New ride received:", newRide);
      // Ensure consistent data structure
      const normalizedRide = {
        ...newRide,
        ID: newRide.ID || newRide.rideId,
        FROM_LOCATION: newRide.FROM_LOCATION || newRide.fromLocation,
        TO_LOCATION: newRide.TO_LOCATION || newRide.toLocation,
        IS_SPECIAL_TASK: newRide.IS_SPECIAL_TASK || newRide.isSpecialTask || false
      };
      setNewRideRequests((prevRides) => [normalizedRide, ...prevRides]);
    });
  
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchNewRideRequests = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/drivers/available-rides`);
      if (!response.ok) throw new Error("Failed to fetch driver data");
      const data = await response.json();
      const normalizedRides = data.rides.rows.map((ride) => ({
        ...ride,
        IS_SPECIAL_TASK: ride.IS_SPECIAL_TASK || ride.SPECIAL_TASK || false,
      }));
      setNewRideRequests(normalizedRides || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("❌ Error fetching driver data:", error);
    }
  };

  const handleAcceptRide = async (rideId) => {
    if (loading) return;
    setLoading(true);

    try {
      const acceptedRide = newRideRequests.find((ride) => ride.ID === rideId);
      if (!acceptedRide) throw new Error("Ride not found");

      await acceptRide(rideId, driver.id);
      setOngoingRide(acceptedRide);
      setNewRideRequests((prev) => prev.filter((ride) => ride.ID !== rideId));
      setRideAcceptedMessage("✅ Ride accepted successfully!");
      setMaterialPicked(false);

      if (socket) {
        socket.emit("rideAccepted", { rideId });
      }
    } catch (error) {
      setRideAcceptedMessage("❌ Failed to accept ride.");
      console.error("❌ Error accepting ride:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialPicked = () => {
    if (!ongoingRide || !socket) return;
    setMaterialPicked(true);
    socket.emit("materialPicked", { rideId: ongoingRide.ID });
  };

  const handleEndRide = async () => {
    if (!ongoingRide || !socket) return;
    
    try {
      const completedRide = {
        ...ongoingRide,
        status: "completed",
        completedAt: new Date().toISOString()
      };
      
      setRideHistory(prev => {
        const newHistory = [completedRide, ...prev];
        localStorage.setItem("driverRideHistory", JSON.stringify(newHistory));
        return newHistory;
      });

      setRideEndedMessage("✅ Ride ended successfully!");
      socket.emit("materialDropped", { rideId: ongoingRide.ID });
      socket.emit("rideEnded", { rideId: ongoingRide.ID });

      setTimeout(() => {
        setOngoingRide(null);
        setProgress(0);
        setRideEndedMessage("");
        setMaterialPicked(false);
        fetchNewRideRequests();
        setRideAcceptedMessage(null);
      }, 2000);
    } catch (error) {
      console.error("❌ Error ending ride:", error);
      setRideEndedMessage("❌ Failed to end ride. Please try again.");
    }
  };

  const handleMaintenanceTypeChange = (e) => {
    setSelectedMaintenanceType(e.target.value);
    setMaintenanceReason("");
  };

 
  useEffect(() => {
    if (ongoingRide) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 100 : prev + 10));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [ongoingRide]);

  useEffect(() => {
    fetchNewRideRequests();
  }, []);

  const top3ClosestRides = newRideRequests.slice(0, 3);
  const otherAvailableRides = newRideRequests.slice(3);

  // Pagination logic
  const indexOfLastRide = currentPage * ridesPerPage;
  const indexOfFirstRide = indexOfLastRide - ridesPerPage;
  const currentRides = otherAvailableRides.slice(
    indexOfFirstRide,
    indexOfLastRide
  );
  const totalPages = Math.ceil(otherAvailableRides.length / ridesPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="driver-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h2>Driver Dashboard</h2>
          {driver && <div className="driver-info">Welcome, {driver.name}</div>}
        </div>
        <button 
          className="maintenance-request-btn"
          onClick={() => setShowMaintenanceModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
            <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
          </svg>
          Request Maintenance
        </button>
      </header>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active Rides
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Ride History
        </button>
      </div>

      {/* Maintenance Request Modal */}
      {showMaintenanceModal && (
        <div className="modal-overlay">
          <div className="maintenance-modal">
            <div className="modal-header">
              <h3>Request Vehicle Maintenance</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowMaintenanceModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-content">
              {!maintenanceSubmitted ? (
                <>
                  <div className="form-group">
                    <label htmlFor="maintenance-type">Vehicle Type:</label>
                    <select
                      id="maintenance-type"
                      value={selectedMaintenanceType}
                      onChange={handleMaintenanceTypeChange}
                      className="form-select"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="forklift">Forklift</option>
                      <option value="crane">Crane</option>
                      <option value="other">Other Vehicle</option>
                    </select>
                  </div>

                  {selectedMaintenanceType && (
                    <div className="form-group">
                      <label htmlFor="maintenance-reason">Reason for Maintenance:</label>
                      <select
                        id="maintenance-reason"
                        value={maintenanceReason}
                        onChange={(e) => setMaintenanceReason(e.target.value)}
                        className="form-select"
                        disabled={!selectedMaintenanceType}
                      >
                        <option value="">Select reason</option>
                        {maintenanceReasons[selectedMaintenanceType]?.map((reason, index) => (
                          <option key={index} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <div className="submission-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <p>Your maintenance request has been submitted.</p>
                  <p>Our team will contact you shortly.</p>
                </div>
              )}

              {maintenanceMessage && (
                <div className={`status-message ${maintenanceMessage.includes("success") ? "success" : "error"}`}>
                  {maintenanceMessage}
                </div>
              )}
            </div>

            {!maintenanceSubmitted && (
              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowMaintenanceModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-accept-btn"
                  onClick={handleMaintenanceSubmit}
                  disabled={!selectedMaintenanceType || !maintenanceReason}
                >
                  Submit Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "active" ? (
        <>
          {ongoingRide ? (
            <div className="ongoing-ride-card">
              <div className="ride-header">
                <h3>Ongoing Ride</h3>
                <span
                  className={`ride-type-badge ${
                    ongoingRide.IS_SPECIAL_TASK ? "special" : "regular"
                  }`}
                >
                  {ongoingRide.IS_SPECIAL_TASK
                    ? "Special Task Ride"
                    : "Regular Ride"}
                </span>
              </div>

              <div className="ride-details">
                <p>
                  <strong>From:</strong> {ongoingRide.FROM_LOCATION}
                </p>
                <p>
                  <strong>To:</strong> {ongoingRide.TO_LOCATION}
                </p>
                <p>
                  <strong>Status:</strong> {materialPicked ? "Material Picked" : "En Route"}
                </p>
              </div>

              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span>Pickup: {ongoingRide.FROM_LOCATION}</span>
                  <span>Destination: {ongoingRide.TO_LOCATION}</span>
                </div>
              </div>

              <div className="ride-actions">
                {!materialPicked ? (
                  <button
                    className="material-picked-btn"
                    onClick={handleMaterialPicked}
                  >
                    Material Picked
                  </button>
                ) : (
                  <button
                    className="end-ride-btn"
                    onClick={handleEndRide}
                  >
                    Material Dropped / End Ride
                  </button>
                )}
              </div>

              {rideEndedMessage && (
                <div className="status-message success">{rideEndedMessage}</div>
              )}
            </div>
          ) : (
            <div className="no-rides-card">
              <p>No ongoing ride at the moment</p>
            </div>
          )}

          {rideAcceptedMessage && (
            <div className="status-message success">{rideAcceptedMessage}</div>
          )}

          {!ongoingRide && (
            <div className="available-rides-section">
              <h3 className="section-title">Top 3 Closest Rides</h3>
              {top3ClosestRides.length > 0 ? (
                <div className="table-container">
                  <table className="rides-table">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Type</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top3ClosestRides.map((ride) => (
                        <tr key={ride.ID}>
                          <td>{ride.FROM_LOCATION}</td>
                          <td>{ride.TO_LOCATION}</td>
                          <td>
                            <span
                              className={`ride-type-badge ${
                                ride.IS_SPECIAL_TASK ? "special" : "regular"
                              }`}
                            >
                              {ride.IS_SPECIAL_TASK
                                ? "Special Task Ride"
                                : "Regular Ride"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="accept-btn"
                              onClick={() => handleAcceptRide(ride.ID)}
                              disabled={loading}
                            >
                              {loading ? "Processing..." : "Accept Ride"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-rides-message">No closest rides available</div>
              )}

              <h3 className="section-title">Other Available Rides</h3>
              {otherAvailableRides.length > 0 ? (
                <>
                  <div className="table-container">
                    <table className="rides-table">
                      <thead>
                        <tr>
                          <th>From</th>
                          <th>To</th>
                          <th>Type</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRides.map((ride) => (
                          <tr key={ride.ID}>
                            <td>{ride.FROM_LOCATION}</td>
                            <td>{ride.TO_LOCATION}</td>
                            <td>
                              <span
                                className={`ride-type-badge ${
                                  ride.IS_SPECIAL_TASK ? "special" : "regular"
                                }`}
                              >
                                {ride.IS_SPECIAL_TASK
                                  ? "Special Task Ride"
                                  : "Regular Ride"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="accept-btn"
                                onClick={() => handleAcceptRide(ride.ID)}
                                disabled={loading}
                              >
                                {loading ? "Processing..." : "Accept Ride"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      &lt;
                    </button>
                    <span className="page-indicator">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      &gt;
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-rides-message">
                  No additional rides available
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="ride-history-section">
          <h3 className="section-title">Completed Rides</h3>
          {rideHistory.length > 0 ? (
            <div className="table-container">
              <table className="rides-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Type</th>
                    <th>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {rideHistory.map((ride, index) => (
                    <tr key={index}>
                      <td>{ride.FROM_LOCATION}</td>
                      <td>{ride.TO_LOCATION}</td>
                      <td>
                        <span
                          className={`ride-type-badge ${
                            ride.IS_SPECIAL_TASK ? "special" : "regular"
                          }`}
                        >
                          {ride.IS_SPECIAL_TASK
                            ? "Special Task Ride"
                            : "Regular Ride"}
                        </span>
                      </td>
                      <td>{formatDate(ride.completedAt || ride.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-rides-message">No ride history available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;