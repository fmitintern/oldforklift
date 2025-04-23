import express from "express";
import {
  markDriverAsHome,
  getAvailableRides,
} from "../controllers/driver.controller.js";

export default (io) => {
  const router = express.Router();

  router.post("/mark-home", (req, res) => markDriverAsHome(req, res, io));
  router.get("/available-rides", (req, res) => getAvailableRides(req, res, io));

  return router;
};