import { Router } from "express";
import {
  createQuotationTemplateController,
  getQuotationTemplatesController,
  getQuotationTemplateByIdController,
  updateQuotationTemplateController,
  deleteQuotationTemplateController,
} from "./quotation-templates.controller";

export const quotationTemplatesRouter = Router();

quotationTemplatesRouter.post("/", createQuotationTemplateController);
quotationTemplatesRouter.get("/", getQuotationTemplatesController);
quotationTemplatesRouter.get("/:id", getQuotationTemplateByIdController);
quotationTemplatesRouter.patch("/:id", updateQuotationTemplateController);
quotationTemplatesRouter.delete("/:id", deleteQuotationTemplateController);
