import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import {
  createQuotationTemplate,
  getQuotationTemplates,
  getQuotationTemplateById,
  updateQuotationTemplate,
  deleteQuotationTemplate,
} from "./quotation-templates.service";
import {
  createQuotationTemplateSchema,
  updateQuotationTemplateSchema,
  quotationTemplateIdParamSchema,
} from "./quotation-templates.schema";

/**
 * POST /api/quotation-templates
 * Creates a new quotation template with associated lines.
 */
export const createQuotationTemplateController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = createQuotationTemplateSchema.parse(req.body);
    const template = await createQuotationTemplate(validatedData);
    res.status(201).json({ data: template });
  }
);

/**
 * GET /api/quotation-templates
 * Retrieves all quotation templates.
 */
export const getQuotationTemplatesController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const templates = await getQuotationTemplates();
    res.status(200).json({ data: templates });
  }
);

/**
 * GET /api/quotation-templates/:id
 * Retrieves a single quotation template by ID.
 */
export const getQuotationTemplateByIdController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = quotationTemplateIdParamSchema.parse(req.params);
    const template = await getQuotationTemplateById(id);
    res.status(200).json({ data: template });
  }
);

/**
 * PATCH /api/quotation-templates/:id
 * Updates an existing quotation template and safely replaces its lines.
 */
export const updateQuotationTemplateController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = quotationTemplateIdParamSchema.parse(req.params);
    const validatedData = updateQuotationTemplateSchema.parse(req.body);
    const updated = await updateQuotationTemplate(id, validatedData);
    res.status(200).json({ data: updated });
  }
);

/**
 * DELETE /api/quotation-templates/:id
 * Deletes a quotation template by ID.
 */
export const deleteQuotationTemplateController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = quotationTemplateIdParamSchema.parse(req.params);
    await deleteQuotationTemplate(id);
    res.status(200).json({
      data: {
        message: "Quotation template deleted successfully",
      },
    });
  }
);
