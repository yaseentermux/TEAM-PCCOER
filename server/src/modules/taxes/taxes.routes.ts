import { Router } from 'express';
import { TaxesService } from './taxes.service';
import { requireAuth, requireRole, validate } from '../../middleware/validate';
import { asyncHandler } from '../../lib/async-handler';
import { createTaxSchema, updateTaxSchema } from './taxes.schema';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const taxes = await TaxesService.list();
    res.json({ data: taxes });
  })
);

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const tax = await TaxesService.getById(Number(req.params.id));
    res.json({ data: tax });
  })
);

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate(createTaxSchema, 'body'),
  asyncHandler(async (req, res) => {
    const tax = await TaxesService.create(req.body);
    res.status(201).json({ data: tax });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(updateTaxSchema, 'body'),
  asyncHandler(async (req, res) => {
    const tax = await TaxesService.update(Number(req.params.id), req.body);
    res.json({ data: tax });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await TaxesService.delete(Number(req.params.id));
    res.json(result);
  })
);

export const taxesRouter = router;
