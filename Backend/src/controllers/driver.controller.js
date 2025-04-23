  import { executeQuery } from "../config/database.js";
  import { notifyDrivers } from "../sockets/driver.socket.js";

  // ✅ Mark Driver as HOME
  export const markDriverAsHome = async (req, res) => {
    try {
      const { driverId } = req.body;

      if (!driverId) {
        return res.status(400).json({ error: "Driver ID is required" });
      }

      const result = await executeQuery(
        "UPDATE drivers SET status = 'HOME' WHERE driver_id = :driverId",
        { driverId }
      );

      if (result.rowsAffected === 0) {
        return res.status(404).json({ error: "Driver not found or already HOME." });
      }

      // 🔹 Notify frontend via WebSocket
      notifyDrivers(req.io, { driverId, status: "HOME" });

      res.status(200).json({ message: "Driver marked as HOME." });
    } catch (error) {
      console.error("❌ Error marking driver as HOME:", error);
      res.status(500).json({ error: "Failed to update driver status." });
    }
  };

  // ✅ Get Available Rides
  export const getAvailableRides = async (req, res) => {
    try {
      const query = `
        SELECT id, from_location, to_location, vehicle_type, ride_type, status
        FROM rides
        WHERE status = 'pending'
        ORDER BY created_at DESC
      `;

      const rides = await executeQuery(query);
      res.status(200).json({ rides });
    } catch (error) {
      console.error("❌ Error fetching available rides:", error);
      res.status(500).json({ error: "Failed to fetch rides" });
    }
  };