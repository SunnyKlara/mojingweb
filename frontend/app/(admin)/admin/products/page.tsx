'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Package,
  Plus,
  Save,
  X,
  Pencil,
  Archive,
  RotateCcw,
} from 'lucide-react'
import { type Product, type ProductStatus, PRODUCT_STATUSES } from '@mojing/shared'
import { api, getAccessToken, setAccessToken } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_COLORS: Record<ProductStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  draft: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  archived: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
}

interface VariantForm {
  sku: string
  nameZh: string
  nameEn: string
  stock: number
  image: string
}

interface ProductForm {
  nameZh: string
  nameEn: string
  slug: string
  descZh: string
  descEn: string
  price: number
  status: ProductStatus
  weight: number
  length: number
  width: number
  height: number
  variants: VariantForm[]
}

const emptyVariant: VariantForm = { sku: '', nameZh: '', nameEn: '', stock: 0, image: '' }

const emptyForm: ProductForm = {
  nameZh: '',
  nameEn: '',
  slug: '',
  descZh: '',
  descEn: '',
  price: 0,
  status: 'active',
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  variants: [{ ...emptyVariant }],
}

function productToForm(p: Product): ProductForm {
  return {
    nameZh: p.name.zh,
    nameEn: p.name.en,
    slug: p.slug,
    descZh: p.description.zh,
    descEn: p.description.en,
    price: p.price,
    status: p.status ?? 'draft',
    weight: p.weight,
    length: p.dimensions.length,
    width: p.dimensions.width,
    height: p.dimensions.height,
    variants: p.variants.map((v) => ({
      sku: v.sku,
      nameZh: v.name.zh,
      nameEn: v.name.en,
      stock: v.stock,
      image: v.image,
    })),
  }
}

function formToBody(f: ProductForm) {
  return {
    name: { zh: f.nameZh, en: f.nameEn },
    slug: f.slug,
    description: { zh: f.descZh, en: f.descEn },
    price: f.price,
    currency: 'USD' as const,
    status: f.status,
    weight: f.weight,
    dimensions: { length: f.length, width: f.width, height: f.height },
    variants: f.variants.map((v) => ({
      sku: v.sku,
      name: { zh: v.nameZh, en: v.nameEn },
      stock: v.stock,
      image: v.image,
    })),
    images: [] as string[],
    featured: true,
  }
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>({ ...emptyForm })

  const logout = useCallback(() => {
    setAccessToken(null)
    router.push('/admin/login')
  }, [router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<Product[]>('/api/admin/products', { auth: true })
      setProducts(data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    if (!getAccessToken()) {
      router.push('/admin/login')
      return
    }
    void load()
  }, [router, load])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, variants: [{ ...emptyVariant }] })
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(String(p._id))
    setForm(productToForm(p))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const updateField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const updateVariant = (idx: number, key: keyof VariantForm, value: string | number) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === idx ? { ...v, [key]: value } : v)),
    }))

  const addVariant = () =>
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { ...emptyVariant }] }))

  const removeVariant = (idx: number) =>
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))

  const handleSave = async () => {
    if (!form.nameZh || !form.nameEn || !form.slug || form.variants.length === 0) {
      toast.error('请填写必填字段')
      return
    }
    setSaving(true)
    try {
      const body = formToBody(form)
      if (editingId) {
        await api(`/api/admin/products/${editingId}`, {
          auth: true,
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        toast.success('商品已更新')
      } else {
        await api('/api/admin/products', {
          auth: true,
          method: 'POST',
          body: JSON.stringify(body),
        })
        toast.success('商品已创建')
      }
      closeForm()
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await api(`/api/admin/products/${id}`, { auth: true, method: 'DELETE' })
      toast.success('商品已归档')
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await api(`/api/admin/products/${id}`, {
        auth: true,
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
      })
      toast.success('商品已恢复')
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> 返回后台
          </Link>
          <h1 className="text-lg font-semibold">商品管理</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> 新建商品
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <div className="text-muted-foreground flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-16 text-center text-sm">
            <Package className="mx-auto mb-2 h-8 w-8 opacity-40" /> 暂无商品
          </div>
        ) : (
          <ul className="grid gap-3">
            {products.map((p) => (
              <li key={String(p._id)} className="bg-card rounded-xl border p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.name.zh}</p>
                      <p className="text-muted-foreground text-sm">{p.name.en}</p>
                      <Badge className={cn('font-normal', STATUS_COLORS[p.status ?? 'draft'])}>
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      slug: {p.slug} · ${(p.price / 100).toFixed(2)} ·
                      {p.variants.map((v) => ` ${v.sku}(库存${v.stock})`).join(',')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="mr-1 h-3 w-3" /> 编辑
                    </Button>
                    {p.status === 'archived' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(String(p._id))}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" /> 恢复
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(String(p._id))}
                      >
                        <Archive className="mr-1 h-3 w-3" /> 归档
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16">
          <div className="bg-card w-full max-w-2xl rounded-xl border p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? '编辑商品' : '新建商品'}</h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>中文名称 *</Label>
                  <Input
                    value={form.nameZh}
                    onChange={(e) => updateField('nameZh', e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>英文名称 *</Label>
                  <Input
                    value={form.nameEn}
                    onChange={(e) => updateField('nameEn', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Slug *</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    placeholder="wind-chaser-64"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>价格（美分）*</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => updateField('price', Number(e.target.value))}
                  />
                  <p className="text-muted-foreground text-xs">${(form.price / 100).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>中文描述</Label>
                  <Input
                    value={form.descZh}
                    onChange={(e) => updateField('descZh', e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>英文描述</Label>
                  <Input
                    value={form.descEn}
                    onChange={(e) => updateField('descEn', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="grid gap-1.5">
                  <Label>重量 (g)</Label>
                  <Input
                    type="number"
                    value={form.weight}
                    onChange={(e) => updateField('weight', Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>长 (mm)</Label>
                  <Input
                    type="number"
                    value={form.length}
                    onChange={(e) => updateField('length', Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>宽 (mm)</Label>
                  <Input
                    type="number"
                    value={form.width}
                    onChange={(e) => updateField('width', Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>高 (mm)</Label>
                  <Input
                    type="number"
                    value={form.height}
                    onChange={(e) => updateField('height', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>状态</Label>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value as ProductStatus)}
                  className="bg-background border-input flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                  {PRODUCT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variants */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>变体</Label>
                  <Button variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="mr-1 h-3 w-3" /> 添加变体
                  </Button>
                </div>
                {form.variants.map((v, i) => (
                  <div key={i} className="mb-2 grid gap-2 rounded-lg border p-3 sm:grid-cols-5">
                    <Input
                      placeholder="SKU"
                      value={v.sku}
                      onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                    />
                    <Input
                      placeholder="中文名"
                      value={v.nameZh}
                      onChange={(e) => updateVariant(i, 'nameZh', e.target.value)}
                    />
                    <Input
                      placeholder="英文名"
                      value={v.nameEn}
                      onChange={(e) => updateVariant(i, 'nameEn', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="库存"
                      value={v.stock}
                      onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))}
                    />
                    <div className="flex gap-1">
                      <Input
                        placeholder="图片路径"
                        value={v.image}
                        onChange={(e) => updateVariant(i, 'image', e.target.value)}
                      />
                      {form.variants.length > 1 && (
                        <button
                          onClick={() => removeVariant(i)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={closeForm}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                {editingId ? '保存修改' : '创建商品'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
