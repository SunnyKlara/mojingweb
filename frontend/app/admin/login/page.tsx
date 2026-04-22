'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('admin_token', data.token)
      router.push('/admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="flex w-80 flex-col gap-4 rounded-2xl bg-white p-8 shadow-md"
      >
        <h1 className="text-center text-xl font-bold">客服后台登录</h1>
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <input
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="用户名"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          required
        />
        <input
          type="password"
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="密码"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}
