import express from "express";
import { bookRide } from "../controllers/ride.controller.js";

export default (io) => {
  const router = express.Router();
  
  // Update to pass io to the controller
  router.post("/book-ride", async (req, res) => {
    try {
      const { userId, fromLocation, toLocation, vehicleType, isSpecialTask } = req.body;
      
      const result = await executeQuery(
        `INSERT INTO rides (user_id, from_location, to_location, vehicle_type, status, is_special_task, created_at)
         VALUES (:userId, :fromLocation, :toLocation, :vehicleType, 'pending', :isSpecialTask, CURRENT_TIMESTAMP)
         RETURNING id, user_id, from_location, to_location, vehicle_type, status, is_special_task, created_at`,
        { userId, fromLocation, toLocation, vehicleType, isSpecialTask: isSpecialTask || false }
      );
  
      const newRide = result.rows[0];
      res.json({
        success: true,
        rideId: newRide.id,
        userId: newRide.user_id,
        fromLocation: newRide.from_location,
        toLocation: newRide.to_location,
        isSpecialTask: newRide.is_special_task,
        status: newRide.status
      });
    } catch (error) {
      console.error("Error booking ride:", error);
      res.status(500).json({ success: false, error: "Failed to book ride" });
    }
  });
  
  return router;
};