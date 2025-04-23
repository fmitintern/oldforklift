import express from "express";
import {
  reportMaintenance,
  getAllMaintenanceIssues,
  resolveMaintenance
} from "../controllers/maintenance.controllers.js";

const router = express.Router();

router.post("/report", reportMaintenance);
router.get("/issues", getAllMaintenanceIssues);
router.post("/resolve", resolveMaintenance);

export default router;