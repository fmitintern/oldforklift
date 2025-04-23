import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import RequesterDashboard from "./Components/RequesterDashboard";
import DriverDashboard from "./Components/DriverDashboard";
import MaintenanceDashboard from "./Components/MaintenanceDashboard";
import OTPLogin from "./Components/OTPLogin";
import VehicleSelection from "./Components/VehicleSelection";
import AvailableRides from "./Components/AvailableRides";
import SpecialTaskRide from "./Components/SpecialTaskRide";
import MaintenanceHead from "./Components/MaintenanceHead";
import Requests from "./Components/Requests";
import ReportsPage from "./Components/ReportsPage";

const App = () => {
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      console.log("helooo");
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
    fetchDriverData(); // Fetch driver data
  }, []);

  // Function to fetch driver data from backend
  const fetchDriverData = async () => {
    try {
      const response = await fetch(
        `http://144.11.1.83:5000/api/drivers/available-rides`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch driver data");
      }
      const data = await response.json();
      console.log("data = ", data);
      setDriver(data);
    } catch (error) {
      console.error("❌ Error fetching driver data:", error);
    }
  };

  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Navigate to="/otp" replace />} />
        <Route path="/otp" element={<OTPLogin setUser={setUser} />} /> */}
        <Route path="/vehicle-selection" element={<VehicleSelection />} />
        <Route
          path="/available-rides"
          element={<AvailableRides user={user} />}
        />
        <Route
          path="/special-task-ride"
          element={<SpecialTaskRide user={user} />}
        />
        <Route path="/requester" element={<RequesterDashboard />} />

        {/* Pass driver data to DriverDashboard */}
        <Route
          path="/driver"
          element={
            driver ? (
              <DriverDashboard driver={driver} />
            ) : (
              <p>Loading driver data...</p>
            )
          }
        />

        <Route path="/maintenance" element={<MaintenanceDashboard />} />
        <Route path="/maintenance-head" element={<MaintenanceHead />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/reports" element={<ReportsPage />} />

        <Route
          path="*"
          element={
            <h2
              style={{ textAlign: "center", color: "red", marginTop: "20px" }}
            >
              404 - Page Not Found
            </h2>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
