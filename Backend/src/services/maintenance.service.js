import { executeQuery } from "../config/database.js";

// ✅ Report Maintenance Issue
export async function reportMaintenanceIssue(forkliftId, issue) {
  // Validate input
  if (!forkliftId || !issue) {
    throw { statusCode: 400, message: "Forklift ID and issue are required" };
  }

  // Check forklift exists
  const checkQuery = "SELECT id FROM forklifts WHERE id = :forkliftId";
  const forklift = await executeQuery(checkQuery, { forkliftId });
  
  if (!forklift.length) {
    throw { statusCode: 404, message: `Forklift ${forkliftId} not found` };
  }

  // Update forklift status
  const updateQuery = "UPDATE forklifts SET status = 'maintenance' WHERE id = :forkliftId";
  await executeQuery(updateQuery, { forkliftId });

  // Insert maintenance request
  const insertQuery = `
    INSERT INTO maintenance_requests (forklift_id, issue, status, reported_at)
    VALUES (:forkliftId, :issue, 'pending', SYSTIMESTAMP)
  `;
  await executeQuery(insertQuery, { forkliftId, issue });

  return { 
    message: "Maintenance request submitted!",
    forkliftId,
    status: "maintenance" 
  };
}

// ✅ Get All Maintenance Issues
export async function getMaintenanceIssues() {
  const query = `
    SELECT id, forklift_id, issue, status, 
           TO_CHAR(reported_at, 'YYYY-MM-DD HH24:MI:SS') AS reported_at
    FROM maintenance_requests
    ORDER BY reported_at DESC
  `;
  
  const issues = await executeQuery(query);
  
  if (!issues.length) {
    throw { statusCode: 404, message: "No maintenance issues found" };
  }
  
  return issues;
}

// ✅ Resolve Maintenance Request
export async function resolveMaintenanceRequest(requestId) {
  if (!requestId) {
    throw { statusCode: 400, message: "Request ID is required" };
  }

  // Check request exists
  const checkQuery = "SELECT id FROM maintenance_requests WHERE id = :requestId AND status = 'pending'";
  const request = await executeQuery(checkQuery, { requestId });
  
  if (!request.length) {
    throw { statusCode: 404, message: "Request not found or already resolved" };
  }

  // Update status
  const updateQuery = "UPDATE maintenance_requests SET status = 'resolved' WHERE id = :requestId";
  await executeQuery(updateQuery, { requestId });

  return { 
    message: "Maintenance resolved successfully",
    requestId,
    status: "resolved" 
  };
}