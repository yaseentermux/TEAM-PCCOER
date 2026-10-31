import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createQuotationTemplateController,
  getQuotationTemplatesController,
  getQuotationTemplateByIdController,
  updateQuotationTemplateController,
  deleteQuotationTemplateController,
} from "./quotation-templates.controller";

export const quotationTemplatesRouter = Router();

quotationTemplatesRouter.post(
  "/",
  requireAuth,
  requireRole(Role.ADMIN, Role.INTERNAL),
  createQuotationTemplateController
);

quotationTemplatesRouter.get(
  "/",
  requireAuth,
  requireRole(Role.ADMIN, Role.INTERNAL),
  getQuotationTemplatesController
);

quotationTemplatesRouter.get(
  "/:id",
  requireAuth,
  requireRole(Role.ADMIN, Role.INTERNAL),
  getQuotationTemplateByIdController
);

quotationTemplatesRouter.patch(
  "/:id",
  requireAuth,
  requireRole(Role.ADMIN, Role.INTERNAL),
  updateQuotationTemplateController
);

quotationTemplatesRouter.delete(
  "/:id",
  requireAuth,
  requireRole(Role.ADMIN, Role.INTERNAL),
  deleteQuotationTemplateController
);
