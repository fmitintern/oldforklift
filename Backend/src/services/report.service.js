import { executeQuery } from "../config/database.js";
import {
  RIDE_REPORTS_QUERY,
  MAINTENANCE_REPORTS_QUERY
} from "../queries/report.queries.js";

export async function fetchRideReports() {
  const reports = await executeQuery(RIDE_REPORTS_QUERY);
  
  if (!reports.length) {
    throw { 
      statusCode: 404, 
      message: "No completed rides found",
      noDataFound: true
    };
  }
  
  return reports;
}

export async function fetchMaintenanceReports() {
  const reports = await executeQuery(MAINTENANCE_REPORTS_QUERY);
  
  if (!reports.length) {
    throw { 
      statusCode: 404, 
      message: "No maintenance reports found",
      noDataFound: true
    };
  }
  
  return reports;
}