// MaintenanceDashboard.js
import React, { useState, useEffect } from "react";
import "./MaintenanceDashboard.css";
import { 
  fetchMaintenanceRequests, 
  resolveMaintenance,
  updateMaintenanceStatus 
} from "../Services/api";

const MaintenanceDashboard = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentValue, setCommentValue] = useState("");

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setMaintenanceRequests(await fetchMaintenanceRequests());
      } catch (error) {
        console.error("Error loading maintenance requests:", error);
      }
    };

    loadRequests();
  }, []);

  const handleStatusChange = async (requestId, newStatus) => {
    setLoading(true);
    try {
      await updateMaintenanceStatus(requestId, newStatus);
      setMaintenanceRequests(await fetchMaintenanceRequests());
    } catch (error) {
      console.error("Error updating maintenance request:", error);
    }
    setLoading(false);
  };

  const handleSaveComment = async (requestId) => {
    try {
      await updateMaintenanceStatus(requestId, null, commentValue);
      setMaintenanceRequests(await fetchMaintenanceRequests());
      setEditingCommentId(null);
    } catch (error) {
      console.error("Error saving comment:", error);
    }
  };

  return (
    <div className="maintenance-dashboard">
      <h2>Maintenance Dashboard</h2>
      <table>
        <thead>
          <tr>
            <th>Forklift ID</th>
            <th>Driver</th>
            <th>Issue</th>
            <th>Status</th>
            <th>Comment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {maintenanceRequests.length === 0 ? (
            <tr>
              <td colSpan="6">No maintenance requests.</td>
            </tr>
          ) : (
            maintenanceRequests.map((request) => (
              <tr key={request.id}>
                <td>{request.forkliftId}</td>
                <td>{request.driverName}</td>
                <td>{request.issue}</td>
                <td>{request.status}</td>
                <td>
                  {editingCommentId === request.id ? (
                    <>
                      <input
                        type="text"
                        value={commentValue}
                        onChange={(e) => setCommentValue(e.target.value)}
                      />
                      <button onClick={() => handleSaveComment(request.id)}>Save</button>
                    </>
                  ) : (
                    <>
                      {request.comment || "N/A"}
                      <button onClick={() => {
                        setEditingCommentId(request.id);
                        setCommentValue(request.comment || "");
                      }}>Edit</button>
                    </>
                  )}
                </td>
                <td>
                  {request.status === "pending" && (
                    <>
                      <button 
                        onClick={() => handleStatusChange(request.id, "accepted")}
                        disabled={loading}
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleStatusChange(request.id, "rejected")}
                        disabled={loading}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {request.status === "accepted" && (
                    <button 
                      onClick={() => handleStatusChange(request.id, "completed")}
                      disabled={loading}
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MaintenanceDashboard;