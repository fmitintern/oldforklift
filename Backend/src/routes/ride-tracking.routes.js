import express from "express";
import {
  acceptRide,
  markPickTime,
  completeRide,
  getRideStatus
} from "../controllers/ride-tracking.controller.js";

export default (io) => {
  const router = express.Router();

  router.post("/accept", (req, res) => acceptRide(req, res, io));
  router.post("/mark-pick-time", (req, res) => markPickTime(req, res, io));
  router.post("/complete", (req, res) => completeRide(req, res, io));
  router.get("/status/:rideId", getRideStatus);

  return router;
};