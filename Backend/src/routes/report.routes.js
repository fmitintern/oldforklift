import express from "express";
import {
  getRideReports,
  getMaintenanceReports
} from "../controllers/report.controller.js";

const router = express.Router();

router.get("/rides", getRideReports);
router.get("/maintenance", getMaintenanceReports);

export default router;