import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { bookRide } from "../Services/api";
import { io } from "socket.io-client";
import "./AvailableRides.css";

const SOCKET_URL = "http://144.11.1.83:5000";

const AvailableRides = ({ user }) => {
  const navigate = useNavigate();
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentUser, setCurrentUser] = useState(user || null);
  const [rideStatus, setRideStatus] = useState("");
  const [rideId, setRideId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [rideProgress, setRideProgress] = useState(0);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [rideHistory, setRideHistory] = useState([]);

  const masterData = [
    { from: "SSD", to: "Boiler", time: 4 },
    { from: "SSD", to: "RMS", time: 10 },
    { from: "SSD", to: "Front gate", time: 5 },
    { from: "SSD", to: "Back gate", time: 8 },
    { from: "SSD", to: "Utility", time: 5 },
    { from: "RMS", to: "Front gate", time: 7 },
    { from: "RMS", to: "Back gate", time: 4 },
    { from: "RMS", to: "Boiler", time: 5 },
    { from: "RMS", to: "Utility", time: 4 },
    { from: "Boiler", to: "SSD", time: 4 },
    { from: "Boiler", to: "RMS", time: 5 },
    { from: "Boiler", to: "Front gate", time: 6 },
    { from: "Boiler", to: "Back gate", time: 7 },
    { from: "Boiler", to: "Utility", time: 5 },
    { from: "Front gate", to: "SSD", time: 5 },
    { from: "Front gate", to: "RMS", time: 7 },
    { from: "Front gate", to: "Boiler", time: 6 },
    { from: "Front gate", to: "Back gate", time: 8 },
    { from: "Front gate", to: "Utility", time: 6 },
    { from: "Back gate", to: "SSD", time: 8 },
    { from: "Back gate", to: "RMS", time: 4 },
    { from: "Back gate", to: "Boiler", time: 7 },
    { from: "Back gate", to: "Front gate", time: 8 },
    { from: "Back gate", to: "Utility", time: 5 },
    { from: "Utility", to: "SSD", time: 5 },
    { from: "Utility", to: "RMS", time: 4 },
    { from: "Utility", to: "Boiler", time: 5 },
    { from: "Utility", to: "Front gate", time: 6 },
    { from: "Utility", to: "Back gate", time: 5 },
    { from: "Warehouse A", to: "SSD", time: 7 },
    { from: "Warehouse A", to: "RMS", time: 8 },
    { from: "Warehouse A", to: "Loading Dock", time: 3 },
    { from: "Warehouse B", to: "SSD", time: 9 },
    { from: "Warehouse B", to: "RMS", time: 6 },
    { from: "Warehouse B", to: "Loading Dock", time: 4 },
    { from: "Loading Dock", to: "Warehouse A", time: 3 },
    { from: "Loading Dock", to: "Warehouse B", time: 4 },
    { from: "Loading Dock", to: "Front gate", time: 5 },
    { from: "Main Office", to: "SSD", time: 6 },
    { from: "Main Office", to: "RMS", time: 8 },
    { from: "Main Office", to: "Front gate", time: 2 },
    { from: "Maintenance", to: "Boiler", time: 3 },
    { from: "Maintenance", to: "Utility", time: 2 },
    { from: "Maintenance", to: "Warehouse A", time: 5 },
    { from: "Parking Lot", to: "Front gate", time: 1 },
    { from: "Parking Lot", to: "Main Office", time: 3 },
    { from: "Cafeteria", to: "Main Office", time: 4 },
    { from: "Cafeteria", to: "SSD", time: 7 },
    { from: "Security Office", to: "Front gate", time: 2 },
    { from: "Security Office", to: "Back gate", time: 3 },
    { from: "Lab", to: "SSD", time: 5 },
    { from: "Lab", to: "RMS", time: 6 },
    { from: "Storage Yard", to: "Warehouse A", time: 4 },
    { from: "Storage Yard", to: "Warehouse B", time: 3 },
    { from: "Storage Yard", to: "Loading Dock", time: 2 },
  ];

  // Get all unique locations
  const allLocations = [
    ...new Set([
      ...masterData.map((data) => data.from),
      ...masterData.map((data) => data.to),
    ]),
  ].sort();

  // Filter locations based on search
  const filteredFromLocations = allLocations.filter(loc =>
    loc.toLowerCase().includes(searchFrom.toLowerCase())
  );

  const filteredToLocations = allLocations
    .filter(loc => loc !== fromLocation)
    .filter(loc => loc.toLowerCase().includes(searchTo.toLowerCase()));

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let confettiTimer;
    if (showConfetti) {
      confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    }
    return () => {
      if (confettiTimer) clearTimeout(confettiTimer);
    };
  }, [showConfetti]);

  useEffect(() => {
    let storedUser = localStorage.getItem("user");
    if (storedUser) {
      storedUser = JSON.parse(storedUser);
      setCurrentUser(storedUser);
    } else {
      console.warn("⚠️ No user found, using guest mode.");
      setCurrentUser({ id: Math.floor(Math.random() * 9000) + 1000 });
    }

    // Load ride history from localStorage
    const storedHistory = localStorage.getItem("rideHistory");
    if (storedHistory) {
      setRideHistory(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    if (fromLocation && toLocation) {
      const route = masterData.find(
        (route) => route.from === fromLocation && route.to === toLocation
      );
      if (route) {
        setEstimatedTime(route.time);
      } else {
        setEstimatedTime(null);
      }
    } else {
      setEstimatedTime(null);
    }
  }, [fromLocation, toLocation]);

  useEffect(() => {
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket'] // Force WebSocket transport
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
});

socket.on('connect_error', (err) => {
  console.log('❌ Connection Error:', err);
});
    socket.on("rideAccepted", (data) => {
      const { rideId: acceptedRideId } = data;
      if (acceptedRideId === rideId) {
        setRideStatus("accepted");
        setRideProgress(1);
        setShowConfetti(true);
        setIsRequesting(false);
        
        // Update ride history
        const updatedHistory = [...rideHistory];
        const rideIndex = updatedHistory.findIndex(ride => ride.rideId === rideId);
        if (rideIndex !== -1) {
          updatedHistory[rideIndex].status = "ongoing";
          setRideHistory(updatedHistory);
          localStorage.setItem("rideHistory", JSON.stringify(updatedHistory));
        }
      }
    });

    socket.on("materialPicked", (data) => {
      if (data.rideId === rideId) {
        setRideProgress(2);
      }
    });

    socket.on("materialDropped", (data) => {
      if (data.rideId === rideId) {
        setRideProgress(3);
        
        // Update ride history
        const updatedHistory = [...rideHistory];
        const rideIndex = updatedHistory.findIndex(ride => ride.rideId === rideId);
        if (rideIndex !== -1) {
          updatedHistory[rideIndex].status = "completed";
          setRideHistory(updatedHistory);
          localStorage.setItem("rideHistory", JSON.stringify(updatedHistory));
        }
        
        setTimeout(() => {
          setRideProgress(0);
          setRideStatus("");
          setFromLocation("");
          setToLocation("");
          setRideId(null);
        }, 5000);
      }
    });

    return () => {
      socket.disconnect();
      console.log(" Disconnected from Socket.IO server");
    };
  }, [rideId, rideHistory]);

  const handleConfirm = () => {
    if (!fromLocation || !toLocation) {
      alert("Please select both From and To locations.");
      return;
    }
    if (fromLocation === toLocation) {
      alert("From and To locations cannot be the same.");
      return;
    }
    setShowConfirmation(true);
  };

  const handleYes = async () => {
    if (!currentUser || !currentUser.id) {
      alert("User not found. Using a temporary ID.");
      setCurrentUser({ id: 9999 });
    }

    const userId = Number(currentUser.id);
    if (isNaN(userId)) {
      console.error("Invalid User ID:", currentUser.id);
      alert("User ID is invalid. Please log in again.");
      return;
    }

    setShowConfirmation(false);
    setRideStatus("requested");
    setIsRequesting(true);

    try {
      const response = await bookRide(
        userId,
        fromLocation,
        toLocation,
        "Forklift",
        "Regular",
      );
  
      if (response.rideId) {
        setRideId(response.rideId);
        if (socket) {
          socket.emit("rideRequested", { rideId: response.rideId });
        }
        
        // Add to ride history
        const newRide = {
          rideId: response.rideId,
          fromLocation,
          toLocation,
          status: "requested",
          estimatedTime,
          timestamp: new Date().toISOString()
        };
        const updatedHistory = [newRide, ...rideHistory];
        setRideHistory(updatedHistory);
        localStorage.setItem("rideHistory", JSON.stringify(updatedHistory));
      } else {
        alert("Failed to book ride.");
        setRideStatus("");
        setIsRequesting(false);
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("Error booking ride.");
      setRideStatus("");
      setIsRequesting(false);
    }
  };

  const handleNo = () => {
    setShowConfirmation(false);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'ongoing':
        return '#3b82f6';
      case 'requested':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const ProgressStep = ({ number, title, active, completed }) => {
    return (
      <div className="progress-step">
        <div
          className={`progress-circle ${active ? "active" : ""} ${
            completed ? "completed" : ""
          }`}
        >
          {completed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            number
          )}
        </div>
        <div className={`progress-title ${active ? "active" : ""}`}>{title}</div>
      </div>
    );
  };

  const ProgressConnector = ({ active }) => {
    return (
      <div className={`progress-connector ${active ? "active" : ""}`}></div>
    );
  };

  return (
    <div className="available-rides-container">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={400}
          gravity={0.2}
          recycle={false}
        />
      )}
      
      <div className="header-container">
        <h2>Book Material Transport</h2>
        <p className="subtitle">Select pickup and drop locations for your materials</p>
        <div className="header-decoration"></div>
      </div>

      <div className="action-buttons">
        <button 
          className={`history-button ${showHistory ? 'active' : ''}`}
          onClick={toggleHistory}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="M18 17V9"></path>
            <path d="M13 17V5"></path>
            <path d="M8 17v-3"></path>
          </svg>
          {showHistory ? 'Hide History' : 'Ride History'}
        </button>
      </div>

      {showHistory && (
        <div className="ride-history-container">
          <h3>Your Ride History</h3>
          {rideHistory.length > 0 ? (
            <div className="history-list">
              {rideHistory.map((ride, index) => (
                <div key={index} className="history-item">
                  <div className="history-route">
                    <span className="from-location">{ride.fromLocation}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="M12 5l7 7-7 7"></path>
                    </svg>
                    <span className="to-location">{ride.toLocation}</span>
                  </div>
                  <div className="history-details">
                    <span className="history-time">{ride.estimatedTime} min</span>
                    <span 
                      className="history-status"
                      style={{ backgroundColor: getStatusColor(ride.status) }}
                    >
                      {ride.status}
                    </span>
                    <span className="history-date">{formatDate(ride.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-history">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>No ride history found</p>
            </div>
          )}
        </div>
      )}

      {rideProgress > 0 && (
        <div className="ride-progress-tracker">
          <h3>Ride Status</h3>
          <div className="progress-steps">
            <ProgressStep
              number={1}
              title="Requested"
              active={rideProgress === 0}
              completed={rideProgress > 0}
            />
            <ProgressConnector active={rideProgress > 0} />
            <ProgressStep
              number={2}
              title="Driver Assigned"
              active={rideProgress === 1}
              completed={rideProgress > 1}
            />
            <ProgressConnector active={rideProgress > 1} />
            <ProgressStep
              number={3}
              title="Material Picked"
              active={rideProgress === 2}
              completed={rideProgress > 2}
            />
            <ProgressConnector active={rideProgress > 2} />
            <ProgressStep
              number={4}
              title="Delivered"
              active={rideProgress === 3}
              completed={rideProgress > 3}
            />
          </div>
        </div>
      )}

      {!showHistory && rideProgress === 0 && (
        <div className="booking-form">
          <div className="form-group">
            <label>Pickup Location</label>
            <div className="location-input-container">
              <div className="location-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="10" r="3" />
                  <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Where to pick up materials?"
                className="location-search-input"
                value={fromLocation || searchFrom}
                onChange={(e) => {
                  setFromLocation("");
                  setSearchFrom(e.target.value);
                }}
                onFocus={() => setShowFromDropdown(true)}
                onBlur={() => setTimeout(() => setShowFromDropdown(false), 200)}
                disabled={isRequesting}
              />
              {fromLocation && (
                <button
                  className="clear-location-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFromLocation("");
                    setSearchFrom("");
                  }}
                  disabled={isRequesting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
            {showFromDropdown && filteredFromLocations.length > 0 && (
              <div className="location-dropdown">
                {filteredFromLocations.map((loc, index) => (
                  <div
                    key={`from-${index}`}
                    className="location-dropdown-item"
                    onClick={() => {
                      setFromLocation(loc);
                      setSearchFrom("");
                      setShowFromDropdown(false);
                    }}
                  >
                    <div className="location-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="10" r="3" />
                        <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z" />
                      </svg>
                    </div>
                    <div className="location-text">{loc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Drop Location</label>
            <div className="location-input-container">
              <div className="location-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Where to deliver materials?"
                className="location-search-input"
                value={toLocation || searchTo}
                onChange={(e) => {
                  setToLocation("");
                  setSearchTo(e.target.value);
                }}
                onFocus={() => setShowToDropdown(true)}
                onBlur={() => setTimeout(() => setShowToDropdown(false), 200)}
                disabled={!fromLocation || isRequesting}
              />
              {toLocation && (
                <button
                  className="clear-location-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setToLocation("");
                    setSearchTo("");
                  }}
                  disabled={isRequesting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
            {showToDropdown && filteredToLocations.length > 0 && (
              <div className="location-dropdown">
                {filteredToLocations.map((loc, index) => (
                  <div
                    key={`to-${index}`}
                    className="location-dropdown-item"
                    onClick={() => {
                      setToLocation(loc);
                      setSearchTo("");
                      setShowToDropdown(false);
                    }}
                  >
                    <div className="location-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div className="location-text">{loc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {estimatedTime && (
            <div className="estimated-time-card">
              <div className="time-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="time-details">
                <div className="time-label">Estimated delivery time</div>
                <div className="time-value">{estimatedTime} minutes</div>
              </div>
            </div>
          )}

          {isRequesting ? (
            <div className="request-loading">
              <div className="loading-spinner"></div>
              <p>Requesting transport...</p>
            </div>
          ) : (
            <button 
              className={`confirm-button ${(!fromLocation || !toLocation) ? 'disabled' : ''}`} 
              onClick={handleConfirm}
              disabled={!fromLocation || !toLocation}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
              Request Transport
            </button>
          )}
        </div>
      )}

      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-box">
            <div className="confirmation-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3498db"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <h3>Confirm Transport Request</h3>
            <p>
              You're requesting transport from <strong>{fromLocation}</strong> to{" "}
              <strong>{toLocation}</strong>.
            </p>
            <p>Estimated time: <strong>{estimatedTime} minutes</strong></p>
            <div className="confirmation-buttons">
              <button className="yes-button" onClick={handleYes}>
                Confirm Request
              </button>
              <button className="no-button" onClick={handleNo}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableRides;