import { executeQuery } from "../config/database.js";
import oracledb from "oracledb";
import { validateRideBooking } from "../validation/ride.validation.js"; 

export async function createRideBooking(rideDetails) {
  // Validate input
  const { isValid, validationErrors } = validateRideBooking(rideDetails);
  if (!isValid) {
    throw { 
      statusCode: 400, 
      message: "Invalid ride details",
      validationErrors 
    };
  }

  // Prepare parameters
  const params = {
    userId: Number(rideDetails.userId),
    fromLocation: rideDetails.fromLocation,
    toLocation: rideDetails.toLocation,
    vehicleType: rideDetails.vehicleType,
    rideType: rideDetails.rideType,
    rideId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
  };

  // Execute query
  const query = `
    INSERT INTO rides (user_id, from_location, to_location, vehicle_type, ride_type, status, created_at)
    VALUES (:userId, :fromLocation, :toLocation, :vehicleType, :rideType, 'pending', SYSTIMESTAMP)
    RETURNING id INTO :rideId
  `;

  const result = await executeQuery(query, params, {
    bindDefs: {
      rideId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  });
  
  if (!result?.outBinds?.rideId?.[0]) {
    throw { 
      statusCode: 500, 
      message: "Ride ID not returned by database" 
    };
  }

  return { 
    rideId: result.outBinds.rideId[0] 
  };
}