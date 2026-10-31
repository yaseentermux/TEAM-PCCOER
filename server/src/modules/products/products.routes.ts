import { Router } from 'express';
import { ProductsService } from './products.service';
import { requireAuth, requireRole, validate } from '../../middleware/validate';
import { asyncHandler } from '../../lib/async-handler';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  createVariantSchema,
  updateVariantSchema,
} from './products.schema';

const router = Router();

router.get(
  '/',
  requireAuth,
  validate(productQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await ProductsService.list(req.query as any);
    res.json(result);
  })
);

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const product = await ProductsService.getById(Number(req.params.id));
    res.json({ data: product });
  })
);

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate(createProductSchema, 'body'),
  asyncHandler(async (req, res) => {
    const product = await ProductsService.create(req.body);
    res.status(201).json({ data: product });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(updateProductSchema, 'body'),
  asyncHandler(async (req, res) => {
    const product = await ProductsService.update(Number(req.params.id), req.body);
    res.json({ data: product });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await ProductsService.delete(Number(req.params.id));
    res.json(result);
  })
);

router.post(
  '/:id/variants',
  requireAuth,
  requireRole('ADMIN'),
  validate(createVariantSchema, 'body'),
  asyncHandler(async (req, res) => {
    const variant = await ProductsService.addVariant(Number(req.params.id), req.body);
    res.status(201).json({ data: variant });
  })
);

router.patch(
  '/:id/variants/:variantId',
  requireAuth,
  requireRole('ADMIN'),
  validate(updateVariantSchema, 'body'),
  asyncHandler(async (req, res) => {
    const variant = await ProductsService.updateVariant(
      Number(req.params.id),
      Number(req.params.variantId),
      req.body
    );
    res.json({ data: variant });
  })
);

router.delete(
  '/:id/variants/:variantId',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await ProductsService.deleteVariant(
      Number(req.params.id),
      Number(req.params.variantId)
    );
    res.json(result);
  })
);

export const productsRouter = router;
