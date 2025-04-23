import { executeQuery } from "../config/database.js";
import oracledb from "oracledb";

// ✅ Get All Requests
export async function fetchAllRequests() {
  const query = `
    SELECT r.id, r.vehicle_number, u.name, u.phone_number AS mobile_number, 
          u.role, r.status, r.forklifts_allocated, r.comment 
    FROM requests r
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `;
  return await executeQuery(query);
}

// ✅ Create New Request
export async function addNewRequest({ user_id, vehicle_number, forklifts_allocated, comment }) {
  // Validation
  if (!user_id || !vehicle_number) {
    throw { 
      statusCode: 400, 
      message: "Missing required fields",
      validationErrors: {
        user_id: !user_id ? "Required" : undefined,
        vehicle_number: !vehicle_number ? "Required" : undefined
      }
    };
  }

  const query = `
    INSERT INTO ride_requests (user_id, vehicle_number, forklifts_allocated, comment, status, created_at)
    VALUES (:user_id, :vehicle_number, :forklifts_allocated, :comment, 'pending', SYSTIMESTAMP)
    RETURNING id INTO :id
  `;
  
  const params = { 
    user_id, 
    vehicle_number, 
    forklifts_allocated: forklifts_allocated || null, 
    comment: comment || null,
    id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } 
  };

  const result = await executeQuery(query, params);
  return { id: result.outBinds.id[0] };
}

// ✅ Update Request Status
export async function changeRequestStatus(id, status) {
  const validStatuses = ["pending", "in-progress", "completed"];
  
  if (!validStatuses.includes(status)) {
    throw { 
      statusCode: 400, 
      message: "Invalid status",
      validationErrors: {
        status: `Must be one of: ${validStatuses.join(", ")}`
      }
    };
  }

  const query = `UPDATE ride_requests SET status = :status WHERE id = :id`;
  await executeQuery(query, { status, id });
}