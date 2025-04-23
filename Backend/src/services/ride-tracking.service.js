import { executeQuery } from "../config/database.js";

// ✅ Accept Ride
export async function acceptRideService(driverId, rideId) {
  if (!driverId || !rideId) {
    throw { 
      statusCode: 400, 
      message: "Missing required fields",
      validationErrors: {
        driverId: !driverId ? "Required" : undefined,
        rideId: !rideId ? "Required" : undefined
      }
    };
  }

  const query = `
    UPDATE rides 
    SET status = 'accepted', driver_id = :driverId
    WHERE id = :rideId AND status = 'pending'
  `;

  const result = await executeQuery(query, { driverId, rideId });

  if (result.rowsAffected === 0) {
    throw { statusCode: 404, message: "Ride not found or already taken" };
  }

  return { rideId, driverId };
}

// ✅ Mark Pick Time
export async function markPickTimeService(rideId) {
  if (!rideId) {
    throw { statusCode: 400, message: "Ride ID is required" };
  }

  const query = `
    UPDATE rides SET material_pick_time = SYSTIMESTAMP 
    WHERE id = :rideId AND status = 'in-progress'
  `;

  const result = await executeQuery(query, { rideId });

  if (result.rowsAffected === 0) {
    throw { statusCode: 404, message: "Ride not found or not in progress" };
  }
}

// ✅ Complete Ride
export async function completeRideService(rideId) {
  if (!rideId) {
    throw { statusCode: 400, message: "Ride ID is required" };
  }

  // Verify ride exists and is in-progress
  const verifyQuery = `
    SELECT id, driver_id, status 
    FROM rides 
    WHERE id = :rideId
  `;
  const verification = await executeQuery(verifyQuery, { rideId });

  if (verification.rows.length === 0) {
    throw { statusCode: 404, message: "Ride not found" };
  }

  if (verification.rows[0].STATUS !== 'in-progress') {
    throw { 
      statusCode: 400, 
      message: `Ride is not in progress (current status: ${verification.rows[0].STATUS})`
    };
  }

  // Update ride status
  const updateQuery = `
    UPDATE rides 
    SET status = 'completed', 
        end_time = SYSTIMESTAMP 
    WHERE id = :rideId
    RETURNING id, user_id, driver_id, from_location, to_location, 
              ride_type, status, created_at, end_time
  `;

  const result = await executeQuery(updateQuery, { rideId });

  if (result.rowsAffected === 0) {
    throw { statusCode: 500, message: "Failed to update ride status" };
  }

  const completedRide = result.rows[0];
  return {
    id: completedRide.ID,
    driverId: completedRide.DRIVER_ID,
    fromLocation: completedRide.FROM_LOCATION,
    toLocation: completedRide.TO_LOCATION,
    rideType: completedRide.RIDE_TYPE,
    endTime: completedRide.END_TIME,
    status: completedRide.STATUS
  };
}

// ✅ Get Ride Status
export async function getRideStatusService(rideId) {
  const query = `
    SELECT id, status, 
           TO_CHAR(start_time, 'YYYY-MM-DD HH24:MI:SS') AS start_time,
           TO_CHAR(material_pick_time, 'YYYY-MM-DD HH24:MI:SS') AS material_pick_time,
           TO_CHAR(end_time, 'YYYY-MM-DD HH24:MI:SS') AS end_time 
    FROM rides WHERE id = :rideId
  `;

  const result = await executeQuery(query, { rideId });

  if (result.length === 0) {
    throw { statusCode: 404, message: "Ride not found" };
  }

  return result[0];
}