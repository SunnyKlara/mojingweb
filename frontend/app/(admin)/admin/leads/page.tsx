'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Mail, Phone, Search } from 'lucide-react'
import { toast } from 'sonner'
import { type Lead, type LeadStatus, LEAD_STATUSES } from '@mojing/shared'
import { api, getAccessToken, setAccessToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<LeadStatus, string> = {
  new: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  contacted: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  qualified: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  won: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  lost: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')

  const logout = useCallback(() => {
    setAccessToken(null)
    router.push('/admin/login')
  }, [router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<Lead[]>('/api/leads', { auth: true })
      setLeads(data)
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

  const updateStatus = async (id: string, status: LeadStatus) => {
    try {
      const updated = await api<Lead>(`/api/leads/${id}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status }),
      })
      setLeads((prev) => prev.map((l) => (l._id === id ? updated : l)))
      toast.success(`状态已更新为 ${status}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (!q) return true
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company ?? '').toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q)
      )
    })
  }, [leads, query, statusFilter])

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              返回客服后台
            </Link>
          </div>
          <h1 className="text-lg font-semibold">线索管理</h1>
          <div className="text-muted-foreground text-xs">{leads.length} 条</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="搜索姓名 / 邮箱 / 公司…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              全部
            </button>
            {LEAD_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  statusFilter === s ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-16 text-center text-sm">
            暂无线索
          </div>
        ) : (
          <ul className="grid gap-3">
            {visible.map((l) => (
              <li
                key={String(l._id)}
                className="bg-card rounded-xl border p-5 shadow-sm transition-shadow hover:shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold">{l.name}</p>
                      <Badge className={cn('font-normal', STATUS_VARIANT[l.status])}>
                        {l.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-1 flex flex-wrap gap-3 text-xs">
                      <a
                        href={`mailto:${l.email}`}
                        className="hover:text-foreground inline-flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        {l.email}
                      </a>
                      {l.phone && (
                        <a
                          href={`tel:${l.phone}`}
                          className="hover:text-foreground inline-flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {l.phone}
                        </a>
                      )}
                      {l.company && <span>{l.company}</span>}
                      {l.createdAt && <span>{new Date(l.createdAt).toLocaleString('zh-CN')}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {LEAD_STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === l.status ? 'default' : 'outline'}
                        className="h-7 px-2 text-[11px]"
                        onClick={() => void updateStatus(String(l._id), s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground mt-3 whitespace-pre-line text-sm leading-relaxed">
                  {l.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
