'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, LogIn, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { LoginResponse } from '@mojing/shared'
import { api, setAccessToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setAccessToken(data.accessToken)
      toast.success(`欢迎回来，${data.user.displayName || data.user.username}`)
      router.push('/admin')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="grid-bg radial-fade absolute inset-0 opacity-60" aria-hidden />
      <Card className="relative w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-2 flex items-center gap-2 text-sm font-semibold">
            <span className="bg-primary text-primary-foreground grid h-8 w-8 place-items-center rounded-lg">
              <Globe className="h-4 w-4" />
            </span>
            GlobalBridge
          </Link>
          <CardTitle>客服后台登录</CardTitle>
          <CardDescription>输入您的管理员账号访问后台</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
              {loading ? '登录中…' : '登录'}
            </Button>
            <Link href="/" className="text-muted-foreground hover:text-foreground text-xs">
              ← 返回官网
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
