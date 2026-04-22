'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { io, type Socket } from 'socket.io-client'
import { Globe, LogOut, Send, Inbox, MessageSquare } from 'lucide-react'
import { SOCKET_EVENTS, type Message, type Session } from '@mojing/shared'
import { BACKEND_URL, api, getAccessToken, setAccessToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

export default function AdminPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeSessionRef = useRef<string | null>(null)

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setAccessToken(null)
    router.push('/admin/login')
  }, [router])

  const loadSessions = useCallback(async () => {
    try {
      const data = await api<Session[]>('/api/chat/admin/sessions', { auth: true })
      setSessions(data)
    } catch {
      await logout()
    }
  }, [logout])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      router.push('/admin/login')
      return
    }

    const socket = io(BACKEND_URL, { auth: { adminToken: token } })
    socketRef.current = socket

    socket.on('connect_error', (err) => {
      if (err.message.includes('token')) void logout()
    })

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg: Message) => {
      setSessions((prev) => {
        const exists = prev.find((s) => s.sessionId === msg.sessionId)
        if (exists) {
          return prev.map((s) =>
            s.sessionId === msg.sessionId
              ? {
                  ...s,
                  lastMessage: msg.content,
                  unreadCount:
                    msg.sender === 'visitor' && activeSessionRef.current !== msg.sessionId
                      ? s.unreadCount + 1
                      : s.unreadCount,
                }
              : s,
          )
        }
        return [
          {
            sessionId: msg.sessionId,
            status: 'open' as const,
            lastMessage: msg.content,
            unreadCount: 1,
            tags: [],
          },
          ...prev,
        ]
      })
      if (msg.sessionId === activeSessionRef.current) {
        setMessages((prev) => [...prev, msg])
      }
    })

    void loadSessions()
    return () => {
      socket.disconnect()
    }
  }, [router, loadSessions, logout])

  useEffect(() => {
    activeSessionRef.current = activeSession
  }, [activeSession])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openSession = async (sid: string) => {
    setActiveSession(sid)
    try {
      const data = await api<Message[]>(`/api/chat/admin/history/${sid}`, { auth: true })
      setMessages(data)
      await api(`/api/chat/admin/read/${sid}`, { method: 'PATCH', auth: true })
      setSessions((prev) => prev.map((s) => (s.sessionId === sid ? { ...s, unreadCount: 0 } : s)))
    } catch {
      await logout()
    }
  }

  const sendReply = () => {
    const trimmed = input.trim()
    if (!trimmed || !activeSession) return
    socketRef.current?.emit(SOCKET_EVENTS.ADMIN_MESSAGE, {
      sessionId: activeSession,
      content: trimmed,
    })
    setInput('')
  }

  const activeInfo = sessions.find((s) => s.sessionId === activeSession)

  return (
    <div className="bg-background text-foreground flex h-screen">
      {/* Sidebar */}
      <aside className="bg-muted/20 flex w-80 flex-col border-r">
        <div className="bg-background flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground grid h-8 w-8 place-items-center rounded-lg">
              <Globe className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">客服后台</p>
              <p className="text-muted-foreground mt-1 text-xs">{sessions.length} 个会话</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="退出登录">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Inbox className="h-8 w-8 opacity-40" />
              <p className="text-xs">暂无会话</p>
            </div>
          ) : (
            <ul className="divide-y">
              {sessions.map((s) => (
                <li key={s.sessionId}>
                  <button
                    onClick={() => void openSession(s.sessionId)}
                    className={cn(
                      'hover:bg-accent w-full px-4 py-3 text-left transition-colors',
                      activeSession === s.sessionId && 'bg-accent',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex-1 truncate text-sm font-medium">
                        {s.visitorInfo?.name || `访客 ${s.sessionId.slice(0, 6)}`}
                      </span>
                      {s.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5">
                          {s.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      {s.lastMessage || '（空）'}
                    </p>
                    {s.visitorInfo?.email && (
                      <p className="text-primary mt-0.5 truncate text-xs">{s.visitorInfo.email}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat pane */}
      <main className="flex flex-1 flex-col">
        {activeSession ? (
          <>
            <div className="flex items-center justify-between border-b px-6 py-3">
              <div>
                <p className="text-sm font-semibold">
                  {activeInfo?.visitorInfo?.name || `访客 ${activeSession.slice(0, 8)}`}
                </p>
                {activeInfo?.visitorInfo?.email && (
                  <p className="text-muted-foreground text-xs">{activeInfo.visitorInfo.email}</p>
                )}
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {activeSession.slice(0, 8)}
              </Badge>
            </div>
            <Separator />
            <div className="bg-muted/10 flex-1 space-y-3 overflow-y-auto px-6 py-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn('flex', m.sender === 'admin' ? 'justify-end' : 'justify-start')}
                >
                  <span
                    className={cn(
                      'max-w-[60%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm',
                      m.sender === 'admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-card-foreground border',
                    )}
                  >
                    {m.content}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="bg-background flex items-center gap-2 border-t p-3">
              <Input
                placeholder="输入回复…  (Enter 发送)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendReply()
                  }
                }}
              />
              <Button onClick={sendReply} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
                发送
              </Button>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3">
            <MessageSquare className="h-10 w-10 opacity-30" />
            <p className="text-sm">选择一个会话开始回复</p>
          </div>
        )}
      </main>
    </div>
  )
}
