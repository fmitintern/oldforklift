import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { initializeDB, executeQuery } from "./Backend/src/config/database.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Import Routes
import rideBookingRouter from "./Backend/src/routes/ride.routes.js";
import rideTrackingRouter from "./Backend/src/routes/ride-tracking.routes.js";
import maintenanceRouter from "./Backend/src/routes/maintenance.routes.js";
import driverRoutes from "./Backend/src/routes/driver.routes.js";
import requestRoutes from "./Backend/src/routes/request.routes.js";
import reportsRouter from "./Backend/src/routes/report.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

const corsOption = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
};

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

// Middlewares
app.use(cors(corsOption));
app.use(express.json());
app.use(bodyParser.json());

// Helper Functions
async function getAvailableRides() {
  try {
    const result = await executeQuery(
      `SELECT * FROM rides WHERE status = 'pending' ORDER BY created_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching available rides:", error);
    return [];
  }
}

async function getRideById(rideId) {
  try {
    const result = await executeQuery(
      `SELECT * FROM rides WHERE id = :rideId`,
      { rideId }
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching ride by ID:", error);
    return null;
  }
}

async function getCompletedRides(driverId) {
  try {
    const result = await executeQuery(
      `SELECT r.*, u.name as rider_name, u.phone as rider_phone
       FROM rides r
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'completed' AND r.driver_id = :driverId
       ORDER BY r.completed_at DESC`,
      { driverId }
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching completed rides:", error);
    return [];
  }
}

// Routes
app.use("/api/bookings", rideBookingRouter);
app.use("/api/tracking", rideTrackingRouter(io));
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/drivers", driverRoutes(io));
app.use("/api/requests", requestRoutes(io));
app.use("/api/reports", reportsRouter);

// Test route
app.get("/api/test-complete-ride", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ success: true, message: "Test endpoint working" });
});

app.get("/", (req, res) => {
  res.send("Forklift Booking API is running...");
});

// WebSocket Events
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("getInitialRides", async ({ driverId }, callback) => {
    try {
      const rides = await getAvailableRides();
      callback(rides);
      console.log(`Sent initial rides to driver ${driverId}`);
    } catch (error) {
      console.error("Error in getInitialRides:", error);
      callback([]);
    }
  });

  socket.on("newRideRequest", async (rideData) => {
    try {
      const ride = await getRideById(rideData.rideId);
      if (ride) {
        // Normalize the data structure
        const normalizedRide = {
          ID: ride.id,
          FROM_LOCATION: ride.from_location,
          TO_LOCATION: ride.to_location,
          IS_SPECIAL_TASK: ride.is_special_task || false,
          USER_ID: ride.user_id,
          CREATED_AT: ride.created_at,
          STATUS: ride.status
        };
        io.emit("newRideRequest", normalizedRide);
        console.log(`New ride broadcasted: ${rideData.rideId}`);
      }
    } catch (error) {
      console.error("Error in newRideRequest:", error);
    }
  });

  socket.on("acceptRide", ({ rideId, driverId }) => {
    console.log(`Ride ${rideId} accepted by driver ${driverId}`);
    io.emit("rideAccepted", { rideId, driverId });
  });

  socket.on("rideCompleted", ({ rideId, driverId, endTime }) => {
    console.log(`Ride ${rideId} completed by driver ${driverId}`);
    io.emit("rideCompleted", { rideId, driverId, endTime });
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected (${socket.id}): ${reason}`);
  });

  socket.on("error", (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log("Initializing Database...");
    await initializeDB();

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down...");
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
