// ReportsPage.js
import React, { useState, useEffect } from "react";
import "./ReportsPage.css";

const ReportsPage = () => {
  const [reports, setReports] = useState([]);

  // Updated dummy data with Vehicle Type
  const dummyReports = [
    {
      forkliftId: "FL-001",
      vehicleType: "Forklift",
      startTime: "2023-05-15 09:00",
      materialPickTime: "2023-05-15 09:15",
      endRideTime: "2023-05-15 09:45",
      gapPickDrop: 30,
      gapPickStart: 15,
      lastMaintenanceDate: "2023-05-10",
      maintenanceStatus: "completed"
    },
    {
      forkliftId: "FL-002",
      vehicleType: "Forklift",
      startTime: "2023-05-15 10:00",
      materialPickTime: "2023-05-15 10:20",
      endRideTime: "2023-05-15 10:50",
      gapPickDrop: 30,
      gapPickStart: 20,
      lastMaintenanceDate: "2023-05-12",
      maintenanceStatus: "pending"
    },
    {
      forkliftId: "CR-001",
      vehicleType: "Crane",
      startTime: "2023-05-15 11:00",
      materialPickTime: "2023-05-15 11:10",
      endRideTime: "2023-05-15 11:40",
      gapPickDrop: 30,
      gapPickStart: 10,
      lastMaintenanceDate: "2023-05-14",
      maintenanceStatus: "accepted"
    },
    {
      forkliftId: "CP-001",
      vehicleType: "Cherry Picker",
      startTime: "2023-05-15 13:00",
      materialPickTime: "2023-05-15 13:15",
      endRideTime: "2023-05-15 14:00",
      gapPickDrop: 45,
      gapPickStart: 15,
      lastMaintenanceDate: "2023-05-13",
      maintenanceStatus: "completed"
    }
  ];

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch("http://your-backend-api/reports");
        // const data = await response.json();
        // setReports(data);
        
        // Using dummy data for now
        setReports(dummyReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchReports();
  }, []);

  const getMaintenanceStatusBadge = (status) => {
    switch(status) {
      case "pending":
        return <span className="status-badge pending">Pending</span>;
      case "accepted":
        return <span className="status-badge accepted">Accepted</span>;
      case "completed":
        return <span className="status-badge completed">Completed</span>;
      case "rejected":
        return <span className="status-badge rejected">Rejected</span>;
      default:
        return <span className="status-badge">N/A</span>;
    }
  };

  const getVehicleTypeBadge = (type) => {
    switch(type.toLowerCase()) {
      case "forklift":
        return <span className="vehicle-badge forklift">Forklift</span>;
      case "crane":
        return <span className="vehicle-badge crane">Crane</span>;
      case "cherry picker":
        return <span className="vehicle-badge cherry-picker">Cherry Picker</span>;
      default:
        return <span className="vehicle-badge">N/A</span>;
    }
  };

  return (
    <div className="reports-container">
      <h2>Reports</h2>

      <table className="reports-table">
        <thead>
          <tr>
            <th>Vehicle ID</th>
            <th>Vehicle Type</th>
            <th>Start Time</th>
            <th>Material Pick Time</th>
            <th>End Ride Time</th>
            <th>Gap (Pick & Drop)</th>
            <th>Gap (Pick & Start)</th>
            <th>Last Maintenance Date</th>
            <th>Maintenance Status</th>
          </tr>
        </thead>

        <tbody>
          {reports.length > 0 ? (
            reports.map((report, index) => (
              <tr key={index}>
                <td>{report.forkliftId}</td>
                <td>{getVehicleTypeBadge(report.vehicleType)}</td>
                <td>{report.startTime}</td>
                <td>{report.materialPickTime}</td>
                <td>{report.endRideTime}</td>
                <td>{report.gapPickDrop} mins</td>
                <td>{report.gapPickStart} mins</td>
                <td>{report.lastMaintenanceDate}</td>
                <td>{getMaintenanceStatusBadge(report.maintenanceStatus)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9">No reports available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsPage;