import {
  reportMaintenanceIssue,
  getMaintenanceIssues,
  resolveMaintenanceRequest
} from "../services/maintenance.service.js";

// 📌 Report Maintenance
export const reportMaintenance = async (req, res) => {
  try {
    const { forkliftId, issue } = req.body;
    const result = await reportMaintenanceIssue(forkliftId, issue);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error, "report maintenance");
  }
};


// 📌 Get All Issues
export const getAllMaintenanceIssues = async (req, res) => {
  try {
    const issues = await getMaintenanceIssues();
    res.status(200).json({ maintenanceIssues: issues });
  } catch (error) {
    handleError(res, error, "fetch maintenance requests");
  }
};

// 📌 Resolve Maintenance
export const resolveMaintenance = async (req, res) => {
  try {
    const { requestId } = req.body;
    const result = await resolveMaintenanceRequest(requestId);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error, "resolve maintenance request");
  }
};

// 🛠️ Reusable Error Handler
function handleError(res, error, action) {
  console.error(`❌ Error trying to ${action}:`, error);
  const status = error.statusCode || 500;
  res.status(status).json({
    error: `Failed to ${action}`,
    details: error.message
  });
}