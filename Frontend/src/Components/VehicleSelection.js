import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VehicleSelection.css";

import forkliftImg from "../Assets/ForkliftImage.png";
import craneImg from "../Assets/Crane.png";
import amrImg from "../Assets/AMR.png";
import cherryPickerImg from "../Assets/CherryPicker.png";

const VehicleSelection = () => {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const handleVehicleSelection = (vehicleType) => {
    setSelectedVehicle(vehicleType);
  };

  const handleNext = () => {
    if (selectedVehicle) {
      navigate("/requester");
    }
  };

  return (
    <div className="vehicle-selection-container">
      <h2>Select your vehicle</h2>

      <div className="vehicle-list">
        <div
          className={`vehicle-item ${selectedVehicle === "Forklift" ? "selected" : ""}`}
          onClick={() => handleVehicleSelection("Forklift")}
        >
          <img src={forkliftImg} alt="Forklift" />
          <p>Forklift</p>
        </div>

        <div
          className={`vehicle-item ${selectedVehicle === "Crane" ? "selected" : ""}`}
          onClick={() => handleVehicleSelection("Crane")}
        >
          <img src={craneImg} alt="Crane" />
          <p>Crane</p>
        </div>

        <div
          className={`vehicle-item ${selectedVehicle === "AMR" ? "selected" : ""}`}
          onClick={() => handleVehicleSelection("AMR")}
        >
          <img src={amrImg} alt="AMR" />
          <p>AMR</p>
        </div>

        <div
          className={`vehicle-item ${selectedVehicle === "Cherry Picker" ? "selected" : ""}`}
          onClick={() => handleVehicleSelection("Cherry Picker")}
        >
          <img src={cherryPickerImg} alt="Cherry Picker" />
          <p>Cherry Picker</p>
        </div>
      </div>

      {/* Next Button - Disabled if no vehicle is selected */}
      <button className="next-button" onClick={handleNext} disabled={!selectedVehicle}>
        Next
      </button>
    </div>
  );
};

export default VehicleSelection;
