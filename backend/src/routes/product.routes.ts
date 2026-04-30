import { Router } from 'express'
import {
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
  ObjectIdSchema,
  PRODUCT_STATUSES,
} from '@mojing/shared'
import { ProductModel } from '../models/Product.model'
import { validateBody, validateParams } from '../middleware/validate.middleware'
import { requireAdmin } from '../middleware/auth.middleware'
import { audit } from '../services/audit.service'
import { z } from 'zod'

export const productRouter = Router()

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/** List active products. */
productRouter.get('/', async (_req, res, next) => {
  try {
    const products = await ProductModel.find({ status: 'active' })
      .sort({ featured: -1, createdAt: -1 })
      .lean()
    res.json(products)
  } catch (err) {
    next(err)
  }
})

const SlugParams = z.object({ slug: z.string().min(1) })

/** Get single product by slug. */
productRouter.get('/:slug', validateParams(SlugParams), async (req, res, next) => {
  try {
    const product = await ProductModel.findOne({
      slug: req.params.slug,
      status: 'active',
    }).lean()
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    res.json(product)
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminProductRouter = Router()

const IdParams = z.object({ id: ObjectIdSchema })

/** Admin — list ALL products (including draft/archived). */
adminProductRouter.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query as { status?: string }
    const filter: Record<string, unknown> = {}
    if (
      status &&
      typeof status === 'string' &&
      (PRODUCT_STATUSES as readonly string[]).includes(status)
    ) {
      filter.status = status
    }
    const products = await ProductModel.find(filter).sort({ createdAt: -1 }).lean()
    res.json(products)
  } catch (err) {
    next(err)
  }
})

/** Admin — create product. */
adminProductRouter.post(
  '/',
  requireAdmin,
  validateBody(CreateProductRequestSchema),
  async (req, res, next) => {
    try {
      const product = await ProductModel.create(req.body)
      audit({
        action: 'product.create',
        actor: { type: 'admin', id: req.admin!.sub, username: req.admin!.username },
        target: String(product._id),
        req,
      })
      res.status(201).json(product)
    } catch (err) {
      // Duplicate slug
      if (err instanceof Error && 'code' in err && (err as { code: number }).code === 11000) {
        res.status(409).json({ error: 'Product slug already exists' })
        return
      }
      next(err)
    }
  },
)

/** Admin — update product. */
adminProductRouter.patch(
  '/:id',
  requireAdmin,
  validateParams(IdParams),
  validateBody(UpdateProductRequestSchema),
  async (req, res, next) => {
    try {
      const updated = await ProductModel.findByIdAndUpdate(
        req.params.id,
        req.body as Record<string, unknown>,
        { new: true, runValidators: true },
      )
      if (!updated) {
        res.status(404).json({ error: 'Product not found' })
        return
      }
      audit({
        action: 'product.update',
        actor: { type: 'admin', id: req.admin!.sub, username: req.admin!.username },
        target: String(updated._id),
        req,
      })
      res.json(updated)
    } catch (err) {
      next(err)
    }
  },
)

/** Admin — archive (soft-delete) product. */
adminProductRouter.delete(
  '/:id',
  requireAdmin,
  validateParams(IdParams),
  async (req, res, next) => {
    try {
      const archived = await ProductModel.findByIdAndUpdate(
        req.params.id,
        { status: 'archived' },
        { new: true },
      )
      if (!archived) {
        res.status(404).json({ error: 'Product not found' })
        return
      }
      audit({
        action: 'product.archive',
        actor: { type: 'admin', id: req.admin!.sub, username: req.admin!.username },
        target: String(archived._id),
        req,
      })
      res.json(archived)
    } catch (err) {
      next(err)
    }
  },
)
