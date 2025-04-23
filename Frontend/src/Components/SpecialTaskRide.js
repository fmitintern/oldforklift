import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSpring, animated } from "@react-spring/web";
import Confetti from "react-confetti";
import { bookRide } from "../Services/api";
import { io } from "socket.io-client";
import "./SpecialTaskRide.css";

const SOCKET_URL = "http://144.11.1.83:5000";

const hours = Array.from({ length: 2 }, (_, i) => i); // 0 to 1 hour
const minutes = Array.from({ length: 60 }, (_, i) => i); // 0 to 59 minutes

const SpecialTaskRide = ({ user }) => {
  const navigate = useNavigate();
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [rideStatus, setRideStatus] = useState("");
  const [rideId, setRideId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [timeError, setTimeError] = useState("");
  const [rideProgress, setRideProgress] = useState(0);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [rideHistory, setRideHistory] = useState([]);
  const minuteScrollRef = useRef(null);
  const hourScrollRef = useRef(null);

  const confirmationSpring = useSpring({
    opacity: showConfirmation ? 1 : 0,
    transform: showConfirmation ? "translateY(0px)" : "translateY(20px)",
    config: { tension: 300, friction: 20 }
  });

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
      console.log("Received rideAccepted event with rideId:", acceptedRideId);

      if (acceptedRideId === rideId) {
        setRideStatus("accepted");
        setRideProgress(1);
        setShowConfetti(true);
        setBookingSuccess(true);
        addToRideHistory({
          rideId,
          fromLocation,
          toLocation,
          status: "ongoing",
          estimatedTime,
          duration: `${selectedHour}h ${selectedMinute}m`,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on("materialPicked", (data) => {
      if (data.rideId === rideId) {
        setRideProgress(2);
      }
    });

    socket.on("materialDropped", (data) => {
      if (data.rideId === rideId) {
        setRideProgress(3); // Delivered
        addToRideHistory({
          rideId,
          fromLocation,
          toLocation,
          status: "completed",
          estimatedTime,
          duration: `${selectedHour}h ${selectedMinute}m`,
          timestamp: new Date().toISOString()
        }, true);
        
        setTimeout(() => {
          setRideProgress(4); // Ride Ended
          setTimeout(() => {
            navigate("/requester");
          }, 3000);
        }, 2000);
      }
    });

    return () => {
      socket.disconnect();
      console.log("❌ Disconnected from Socket.IO server");
    };
  }, [rideId]);

  useEffect(() => {
    const handleScroll = (ref, setter, items) => {
      const index = Math.round(ref.current.scrollTop / 40);
      if (index >= 0 && index < items.length) {
        setter(items[index]);
      }
    };

    const minuteScroll = minuteScrollRef.current;
    const hourScroll = hourScrollRef.current;

    const handleMinuteScroll = () => handleScroll(minuteScrollRef, setSelectedMinute, minutes);
    const handleHourScroll = () => handleScroll(hourScrollRef, setSelectedHour, hours);

    if (minuteScroll) minuteScroll.addEventListener("scroll", handleMinuteScroll);
    if (hourScroll) hourScroll.addEventListener("scroll", handleHourScroll);

    return () => {
      if (minuteScroll) minuteScroll.removeEventListener("scroll", handleMinuteScroll);
      if (hourScroll) hourScroll.removeEventListener("scroll", handleHourScroll);
    };
  }, []);

  useEffect(() => {
    // Load ride history from localStorage
    const storedHistory = localStorage.getItem("specialTaskRideHistory");
    if (storedHistory) {
      setRideHistory(JSON.parse(storedHistory));
    }
  }, []);

  const addToRideHistory = (ride, isUpdate = false) => {
    setRideHistory(prevHistory => {
      let newHistory;
      if (isUpdate) {
        newHistory = prevHistory.map(item => 
          item.rideId === ride.rideId ? ride : item
        );
      } else {
        newHistory = [ride, ...prevHistory];
      }
      localStorage.setItem("specialTaskRideHistory", JSON.stringify(newHistory));
      return newHistory;
    });
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

  const handleTimeClick = (value, type) => {
    if (type === 'hour') {
      setSelectedHour(value);
      if (hourScrollRef.current) {
        hourScrollRef.current.scrollTo({
          top: value * 40,
          behavior: 'smooth'
        });
      }
    } else {
      setSelectedMinute(value);
      if (minuteScrollRef.current) {
        minuteScrollRef.current.scrollTo({
          top: value * 40,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleConfirm = () => {
    if (!fromLocation || !toLocation) {
      alert("❌ Please select 'From' and 'To' locations.");
      return;
    }

    if (selectedHour === 0 && selectedMinute === 0) {
      setTimeError("Please select a time greater than 00h 00m");
      return;
    }

    setTimeError("");
    setShowConfirmation(true);
  };

  const handleYes = async () => {
    let userId = user && user.id ? Number(user.id) : NaN;

    if (isNaN(userId)) {
      console.warn("⚠️ User ID is invalid, using a temporary ID.");
      userId = Math.floor(Math.random() * 9000) + 1000;
    }

    setShowConfirmation(false);
    setRideStatus("requested");
    setRideProgress(0);

    try {
      const response = await bookRide(
        userId,
        fromLocation,
        toLocation,
        "Forklift",
        "Special Task"
      );

      if (response.rideId) {
        console.log("✅ Special Task Ride booked successfully! Ride ID:", response.rideId);
        setRideId(response.rideId);
        socket.emit("rideRequested", { rideId: response.rideId });
        addToRideHistory({
          rideId: response.rideId,
          fromLocation,
          toLocation,
          status: "requested",
          estimatedTime,
          duration: `${selectedHour}h ${selectedMinute}m`,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error("❌ Failed to book special task ride.");
        alert("❌ Failed to book ride.");
        setRideStatus("");
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      alert("❌ Error booking ride.");
      setRideStatus("");
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

  return (
    <div className="special-task-container">
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
        <h2>Schedule Special Task Ride</h2>
        <p className="subtitle">Book a ride for your material transport needs</p>
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
          {showHistory ? 'Hide History' : 'Task History'}
        </button>
      </div>

      {showHistory && (
        <div className="ride-history-container">
          <h3>Your Special Task History</h3>
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
                    <span className="history-time">{ride.duration}</span>
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
              <p>No special task history found</p>
            </div>
          )}
        </div>
      )}

      <div className="booking-form">
        {showConfirmation && (
          <animated.div className="confirmation-overlay" style={confirmationSpring}>
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
              <h3>Confirm Special Task Ride</h3>
              <p>
                You're requesting transport from <strong>{fromLocation}</strong> to{" "}
                <strong>{toLocation}</strong> for <strong>{selectedHour}h {selectedMinute}m</strong>.
              </p>
              {timeError && <div className="error-message">{timeError}</div>}
              <div className="confirmation-buttons">
                <button className="yes-button" onClick={handleYes}>
                  Confirm Request
                </button>
                <button className="no-button" onClick={handleNo}>
                  Cancel
                </button>
              </div>
            </div>
          </animated.div>
        )}

        {!showHistory && (
          <>
            {rideProgress > 0 && (
              <div className="ride-progress-tracker">
                <h3>Task Status</h3>
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
                  <ProgressConnector active={rideProgress > 3} />
                  <ProgressStep
                    number={5}
                    title="Task Ended"
                    active={rideProgress === 4}
                    completed={rideProgress > 4}
                  />
                </div>
              </div>
            )}

            {rideProgress === 0 && (
              <>
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
                    />
                    {fromLocation && (
                      <button
                        className="clear-location-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFromLocation("");
                          setSearchFrom("");
                        }}
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
                      disabled={!fromLocation}
                    />
                    {toLocation && (
                      <button
                        className="clear-location-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setToLocation("");
                          setSearchTo("");
                        }}
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
                      <div className="time-label">Estimated travel time</div>
                      <div className="time-value">{estimatedTime} minutes</div>
                    </div>
                  </div>
                )}

                <div className="time-selection-container">
                  <h3 className="time-selection-title">Select Duration</h3>
                  
                  <div className="time-selection">
                    <div className="time-column">
                      <h4>Hours</h4>
                      <div ref={hourScrollRef} className="time-scroll">
                        {hours.map((hour) => (
                          <div
                            key={hour}
                            className={`time-item ${hour === selectedHour ? "selected" : ""}`}
                            onClick={() => handleTimeClick(hour, 'hour')}
                          >
                            {hour.toString().padStart(2, "0")}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="time-separator">:</div>

                    <div className="time-column">
                      <h4>Minutes</h4>
                      <div ref={minuteScrollRef} className="time-scroll">
                        {minutes.map((minute) => (
                          <div
                            key={minute}
                            className={`time-item ${minute === selectedMinute ? "selected" : ""}`}
                            onClick={() => handleTimeClick(minute, 'minute')}
                          >
                            {minute.toString().padStart(2, "0")}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="selected-time-display">
                    <span className="time-value">{selectedHour.toString().padStart(2, "0")}</span>
                    <span className="time-label">h</span>
                    <span className="time-value">{selectedMinute.toString().padStart(2, "0")}</span>
                    <span className="time-label">m</span>
                  </div>
                </div>

                {timeError && (
                  <div className="error-message">
                    {timeError}
                  </div>
                )}

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
                  Schedule Special Task
                </button>
              </>
            )}

            {rideStatus === "requested" && rideProgress === 0 && (
              <div className="ride-status">
                <div className="loading-spinner"></div>
                <p>Waiting for driver to accept your special task request...</p>
                <p className="status-note">We'll notify you when a driver is assigned</p>
              </div>
            )}

            {rideProgress > 0 && (
              <div className={`ride-status ${rideProgress === 4 ? "success" : "info"}`}>
                {rideProgress === 1 && (
                  <>
                    <div className="status-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h3>Driver Assigned!</h3>
                    <p>Your driver is on the way to {fromLocation}.</p>
                    <p className="status-note">Estimated arrival: {estimatedTime} minutes</p>
                  </>
                )}
                {rideProgress === 2 && (
                  <>
                    <div className="status-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
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
                    <h3>Material Picked Up</h3>
                    <p>Your materials have been loaded and are on the way to {toLocation}.</p>
                  </>
                )}
                {rideProgress === 3 && (
                  <>
                    <div className="status-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h3>Delivery Complete!</h3>
                    <p>Your materials have been successfully delivered to {toLocation}.</p>
                  </>
                )}
                {rideProgress === 4 && (
                  <>
                    <div className="status-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h3>Task Ended Successfully!</h3>
                    <p>The special task has been completed.</p>
                    <p className="redirect-notice">You'll be redirected shortly...</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SpecialTaskRide;