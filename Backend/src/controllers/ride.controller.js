// In your Backend/src/controllers/ride.controller.js
export const bookRide = async (req, res, io) => {
  try {
    const { userId, fromLocation, toLocation, vehicleType, rideType } = req.body;

    // Validate input
    if (!userId || !fromLocation || !toLocation) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Insert into database
    const result = await executeQuery(
      `INSERT INTO rides
      (user_id, from_location, to_location, vehicle_type, ride_type, status)
      VALUES (:userId, :fromLocation, :toLocation, :vehicleType, :rideType, 'pending')
      RETURNING id`,
      { userId, fromLocation, toLocation, vehicleType, rideType }
    );

    // Check how the ID is returned in your Oracle database
    // It might be capitalized as ID instead of id
    const rideId = result.rows[0].ID || result.rows[0].id;

    // Emit socket event (using io directly instead of req.io)
    io.emit("rideRequested", { rideId });

    res.status(201).json({
      success: true,
      rideId,
      message: "Ride booked successfully"
    });
  } catch (error) {
    console.error("Error booking ride:", error);
    res.status(500).json({
      success: false,
      message: "Failed to book ride"
    });
  }
};