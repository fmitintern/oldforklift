import express from "express";
import {
  getAllRequests,
  createRequest,
  updateRequestStatus
} from "../controllers/request.controller.js";

export default (io) => {
  const router = express.Router();

  router.get("/", getAllRequests);
  router.post("/", (req, res) => createRequest(req, res, io));
  router.put("/:id/status", (req, res) => updateRequestStatus(req, res, io));

  return router;
};