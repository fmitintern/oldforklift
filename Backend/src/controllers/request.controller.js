import {
  fetchAllRequests,
  addNewRequest,
  changeRequestStatus
} from "../services/request.service.js";
import { notifyNewRequest, notifyStatusChange } from "../sockets/request.socket.js";

export const getAllRequests = async (req, res) => {
  try {
    const requests = await fetchAllRequests();
    res.json(requests);
  } catch (error) {
    handleRequestError(res, error, "fetch requests");
  }
};

export const createRequest = async (req, res) => {
  try {
    const { user_id, vehicle_number, forklifts_allocated, comment } = req.body;
    const newRequest = await addNewRequest({
      user_id, 
      vehicle_number, 
      forklifts_allocated, 
      comment
    });
    
    // WebSocket notification
    notifyNewRequest(req.io, {
      requestId: newRequest.id,
      vehicle_number,
      status: "pending"
    });
    
    res.status(201).json({
      message: "Ride request added!",
      requestId: newRequest.id
    });
  } catch (error) {
    handleRequestError(res, error, "create request");
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await changeRequestStatus(id, status);
    
    // WebSocket notification
    notifyStatusChange(req.io, { requestId: id, status });
    
    res.json({ message: "Request status updated!" });
  } catch (error) {
    handleRequestError(res, error, "update request status");
  }
};

// 🛠️ Reusable Error Handler
function handleRequestError(res, error, action) {
  console.error(`Error in ${action}:`, error);
  const status = error.statusCode || 500;
  res.status(status).json({
    error: `Failed to ${action.replace("-", " ")}`,
    details: error.message,
    ...(error.validationErrors && { errors: error.validationErrors })
  });
}