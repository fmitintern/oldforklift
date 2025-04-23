import Joi from "joi";

export const reportMaintenanceSchema = Joi.object({
  forkliftId: Joi.number().required(),
  issue: Joi.string().min(10).max(500).required()
});

export const resolveMaintenanceSchema = Joi.object({
  requestId: Joi.number().required()
});