import {
  fetchRideReports,
  fetchMaintenanceReports
} from "../services/report.service.js";

export const getRideReports = async (req, res) => {
  try {
    const reports = await fetchRideReports();
    res.status(200).json({ rideReports: reports });
  } catch (error) {
    handleReportError(res, error, "fetch ride reports");
  }
};

export const getMaintenanceReports = async (req, res) => {
  try {
    const reports = await fetchMaintenanceReports();
    res.status(200).json({ maintenanceReports: reports });
  } catch (error) {
    handleReportError(res, error, "fetch maintenance reports");
  }
};

// 🛠️ Reusable Error Handler
function handleReportError(res, error, action) {
  console.error(`❌ Error in ${action}:`, error);
  const status = error.statusCode || 500;
  res.status(status).json({
    error: `Failed to ${action}`,
    details: error.message,
    ...(error.noDataFound && { data: [] })
  });
}