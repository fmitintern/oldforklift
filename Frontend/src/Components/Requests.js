import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./Requests.css";

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentValue, setCommentValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const socket = io("http://144.11.1.83:5000");

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);

    socket.on("maintenanceRequestAdded", fetchRequests);
    socket.on("newRegistrationRequest", fetchRequests);
    socket.on("requestStatusUpdated", fetchRequests);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [maintenanceRes, registrationRes] = await Promise.all([
        axios.get("http://144.11.1.83:5000/api/requests/maintenance"),
        axios.get("http://144.11.1.83:5000/api/requests")
      ]);

      

      const maintenanceRequests = maintenanceRes.data.map((req) => ({
        id: req.ID,
        requestType: "Maintenance",
        vehicleNumber: "N/A",
        name: req.DRIVER_NAME,
        mobileNumber: "N/A",
        role: "Driver",
        status: req.STATUS,
        forklifts: 0,
        comment: req.COMMENT_TEXT,
        vehicleType: req.VEHICLE_TYPE,
        issue: req.ISSUE,
        requestDate: req.REQUEST_DATE
      }));

      const registrationRequests = registrationRes.data.map((req) => ({
        id: req.ID,
        requestType: "Registration",
        vehicleNumber: req.VEHICLE_NUMBER,
        name: req.NAME,
        mobileNumber: req.MOBILE_NUMBER,
        role: req.ROLE,
        status: req.STATUS,
        forklifts: req.FORKLIFTS_ALLOCATED,
        comment: req.REQUEST_COMMENT,
        requestDate: req.CREATED_AT
      }));

      setRequests([...maintenanceRequests, ...registrationRequests]);
    } catch (error) {
      console.error("❌ Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = (request) => {
    setEditingCommentId(request.id);
    setCommentValue(request.comment || "");
  };

  const handleSaveComment = (requestId) => {
    if (!commentValue.trim()) return alert("Comment cannot be empty");
    setRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, comment: commentValue } : req
      )
    );
    setEditingCommentId(null);
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );
      await axios.put(`http://144.11.1.83:5000/api/requests/${requestId}/status`, { status: newStatus });
    } catch (error) {
      console.error("❌ Failed to update status:", error);
      fetchRequests();
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  const filteredRequests = requests.filter(req =>
    req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cancelEdit = () => setEditingCommentId(null);

  return (
    <div className="requests-container">
      <div className="requests-header">
        <h2>Maintenance & Registration Requests</h2>
        <input
          type="text"
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="requests-status-summary">
        <div className="status-card pending">Pending: {requests.filter(r => r.status === "pending").length}</div>
        <div className="status-card accepted">Accepted: {requests.filter(r => r.status === "accepted").length}</div>
        <div className="status-card completed">Completed: {requests.filter(r => r.status === "completed").length}</div>
        <div className="status-card rejected">Rejected: {requests.filter(r => r.status === "rejected").length}</div>
      </div>

      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Vehicle</th>
              <th>Requester</th>
              <th>Date</th>
              <th>Status</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(req => (
              <tr key={req.id}>
                <td>#{req.id}</td>
                <td>{req.requestType}</td>
                <td>{req.vehicleNumber}</td>
                <td>{req.name}</td>
                <td>{formatDate(req.requestDate)}</td>
                <td>{req.status}</td>
                <td>
                  {editingCommentId === req.id ? (
                    <>
                      <textarea
                        rows="2"
                        value={commentValue}
                        onChange={(e) => setCommentValue(e.target.value)}
                      />
                      <button onClick={() => handleSaveComment(req.id)}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {req.comment}
                      <button onClick={() => handleEditComment(req)}>✏️</button>
                    </>
                  )}
                </td>
                <td>
                  {req.status === "pending" && (
                    <>
                      <button onClick={() => handleStatusChange(req.id, "accepted")}>Accept</button>
                      <button onClick={() => handleStatusChange(req.id, "rejected")}>Reject</button>
                    </>
                  )}
                  {req.status === "accepted" && (
                    <button onClick={() => handleStatusChange(req.id, "completed")}>Mark Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Requests;
