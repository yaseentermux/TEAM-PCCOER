import { Router } from 'express';
import { DiscountsService } from './discounts.service';
import { requireAuth, requireRole, validate } from '../../middleware/validate';
import { asyncHandler } from '../../lib/async-handler';
import {
  createDiscountSchema,
  updateDiscountSchema,
  discountQuerySchema,
} from './discounts.schema';

const router = Router();

router.get(
  '/',
  requireAuth,
  validate(discountQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const discounts = await DiscountsService.list(req.query as any);
    res.json({ data: discounts });
  })
);

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const discount = await DiscountsService.getById(Number(req.params.id));
    res.json({ data: discount });
  })
);

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate(createDiscountSchema, 'body'),
  asyncHandler(async (req, res) => {
    const discount = await DiscountsService.create(req.body);
    res.status(201).json({ data: discount });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(updateDiscountSchema, 'body'),
  asyncHandler(async (req, res) => {
    const discount = await DiscountsService.update(Number(req.params.id), req.body);
    res.json({ data: discount });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await DiscountsService.delete(Number(req.params.id));
    res.json(result);
  })
);

export const discountsRouter = router;
