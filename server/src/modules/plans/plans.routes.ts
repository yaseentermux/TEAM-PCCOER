import { Router } from 'express';
import { PlansService } from './plans.service';
import { requireAuth, requireRole, validate } from '../../middleware/validate';
import { asyncHandler } from '../../lib/async-handler';
import { createPlanSchema, updatePlanSchema } from './plans.schema';

const router = Router();

router.get(
  '/available',
  asyncHandler(async (_req, res) => {
    const plans = await PlansService.getAvailable();
    res.json({ data: plans });
  })
);

router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const plans = await PlansService.list();
    res.json({ data: plans });
  })
);

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const plan = await PlansService.getById(Number(req.params.id));
    res.json({ data: plan });
  })
);

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate(createPlanSchema, 'body'),
  asyncHandler(async (req, res) => {
    const plan = await PlansService.create(req.body);
    res.status(201).json({ data: plan });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(updatePlanSchema, 'body'),
  asyncHandler(async (req, res) => {
    const plan = await PlansService.update(Number(req.params.id), req.body);
    res.json({ data: plan });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await PlansService.delete(Number(req.params.id));
    res.json(result);
  })
);

export const plansRouter = router;
