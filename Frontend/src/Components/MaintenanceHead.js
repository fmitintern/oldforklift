import React from "react";
import { useNavigate } from "react-router-dom";
import "./MaintenanceHead.css";

const MaintenanceHead = () => {
  const navigate = useNavigate();

  return (
    <div className="maintenance-head-container">
      <h2 className="welcome-text">
        Welcome to the Forklift Booking and Tracking Application
      </h2>

      <div className="button-container">
        {/* ✅ Navigates to Reports Page */}
        <button className="button reports-button" onClick={() => navigate("/reports")}>
          📊 Reports
        </button>

        {/* ✅ Navigates to Requests Page */}
        <button className="button requests-button" onClick={() => navigate("/requests")}>
          📋 Requests
        </button>
      </div>
    </div>
  );
};

export default MaintenanceHead;
