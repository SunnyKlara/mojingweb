'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { io, type Socket } from 'socket.io-client'
import {
  Globe,
  LogOut,
  Send,
  Inbox,
  MessageSquare,
  Search,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Zap,
} from 'lucide-react'
import {
  SOCKET_EVENTS,
  type Message,
  type Session,
  type TypingBroadcast,
  type ReadReceipt,
} from '@mojing/shared'
import { BACKEND_URL, api, getAccessToken, setAccessToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface SessionUpdatePayload {
  sessionId: string
  status: 'open' | 'closed'
}

const QUICK_REPLIES = [
  '您好，请问具体想了解哪方面的服务？',
  '感谢咨询！我们的顾问会在 1 个工作小时内与您联系。',
  '稍等，让我查一下相关信息并回复您。',
  '方便留一下您的联系邮箱吗？我们发一份详细资料给您。',
]

/** Tiny WebAudio blip, no asset dependency. */
function playBlip() {
  if (typeof window === 'undefined') return
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.05
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
    osc.stop(ctx.currentTime + 0.26)
    setTimeout(() => ctx.close(), 500)
  } catch {
    // ignore
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [visitorTyping, setVisitorTyping] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState('')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [showQuick, setShowQuick] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeSessionRef = useRef<string | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef<number>(0)

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
      // Sound + browser notification for inbound visitor messages in other sessions.
      if (msg.sender === 'visitor' && msg.sessionId !== activeSessionRef.current) {
        if (soundOnRef.current) playBlip()
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted' &&
          document.visibilityState !== 'visible'
        ) {
          new Notification('New visitor message', { body: msg.content.slice(0, 80) })
        }
      }
    })

    socket.on(SOCKET_EVENTS.TYPING, (payload: TypingBroadcast) => {
      if (payload.from !== 'visitor') return
      setVisitorTyping((prev) => ({ ...prev, [payload.sessionId]: payload.isTyping }))
    })

    socket.on(SOCKET_EVENTS.READ_RECEIPT, (receipt: ReadReceipt) => {
      if (receipt.by !== 'visitor') return
      if (receipt.sessionId !== activeSessionRef.current) return
      setMessages((prev) =>
        prev.map((m) => (m.sender === 'admin' && !m.read ? { ...m, read: true } : m)),
      )
    })

    socket.on(SOCKET_EVENTS.SESSION_UPDATED, (payload: SessionUpdatePayload) => {
      setSessions((prev) =>
        prev.map((s) => (s.sessionId === payload.sessionId ? { ...s, status: payload.status } : s)),
      )
    })

    void loadSessions()

    // Ask for browser notification permission once.
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') void Notification.requestPermission()
    }

    return () => {
      socket.disconnect()
    }
  }, [router, loadSessions, logout])

  const soundOnRef = useRef(soundOn)
  useEffect(() => {
    soundOnRef.current = soundOn
  }, [soundOn])

  useEffect(() => {
    activeSessionRef.current = activeSession
  }, [activeSession])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Total unread → browser tab title.
  const totalUnread = useMemo(() => sessions.reduce((sum, s) => sum + s.unreadCount, 0), [sessions])
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.title = totalUnread > 0 ? `(${totalUnread}) 客服后台` : '客服后台'
  }, [totalUnread])

  const visibleSessions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sessions.filter((s) => {
      if (onlyUnread && s.unreadCount === 0) return false
      if (!q) return true
      return (
        s.sessionId.toLowerCase().includes(q) ||
        (s.visitorInfo?.name ?? '').toLowerCase().includes(q) ||
        (s.visitorInfo?.email ?? '').toLowerCase().includes(q) ||
        (s.lastMessage ?? '').toLowerCase().includes(q)
      )
    })
  }, [sessions, query, onlyUnread])

  const openSession = async (sid: string) => {
    setActiveSession(sid)
    try {
      const data = await api<Message[]>(`/api/chat/admin/history/${sid}`, { auth: true })
      setMessages(data)
      // Prefer the socket route so it also triggers the read receipt to visitor.
      socketRef.current?.emit(SOCKET_EVENTS.ADMIN_READ, { sessionId: sid })
      setSessions((prev) => prev.map((s) => (s.sessionId === sid ? { ...s, unreadCount: 0 } : s)))
    } catch {
      await logout()
    }
  }

  const emitTyping = () => {
    if (!activeSession) return
    const now = Date.now()
    if (now - lastTypingSentRef.current > 1500) {
      socketRef.current?.emit(SOCKET_EVENTS.ADMIN_TYPING, {
        sessionId: activeSession,
        isTyping: true,
      })
      lastTypingSentRef.current = now
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit(SOCKET_EVENTS.ADMIN_TYPING, {
        sessionId: activeSession,
        isTyping: false,
      })
      lastTypingSentRef.current = 0
    }, 2000)
  }

  const sendReply = (override?: string) => {
    const content = (override ?? input).trim()
    if (!content || !activeSession) return
    socketRef.current?.emit(SOCKET_EVENTS.ADMIN_MESSAGE, {
      sessionId: activeSession,
      content,
    })
    if (!override) setInput('')
    setShowQuick(false)
  }

  const toggleSessionStatus = () => {
    if (!activeSession || !activeInfo) return
    const event =
      activeInfo.status === 'closed' ? SOCKET_EVENTS.SESSION_REOPEN : SOCKET_EVENTS.SESSION_CLOSE
    socketRef.current?.emit(event, { sessionId: activeSession })
  }

  const activeInfo = sessions.find((s) => s.sessionId === activeSession)

  return (
    <div className="bg-background text-foreground flex h-screen">
      <aside className="bg-muted/20 flex w-80 flex-col border-r">
        <div className="bg-background flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground grid h-8 w-8 place-items-center rounded-lg">
              <Globe className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">客服后台</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {sessions.length} 个会话{totalUnread > 0 && ` · ${totalUnread} 未读`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label="提示音"
              onClick={() => setSoundOn((v) => !v)}
            >
              {soundOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="退出登录">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-background/60 flex items-center gap-2 border-b px-3 py-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              placeholder="搜索会话…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Button
            variant={onlyUnread ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setOnlyUnread((v) => !v)}
          >
            未读
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visibleSessions.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Inbox className="h-8 w-8 opacity-40" />
              <p className="text-xs">暂无会话</p>
            </div>
          ) : (
            <ul className="divide-y">
              {visibleSessions.map((s) => (
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
                      {s.status === 'closed' && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          已关闭
                        </Badge>
                      )}
                      {s.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5">
                          {s.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      {visitorTyping[s.sessionId] ? (
                        <span className="text-primary">正在输入…</span>
                      ) : (
                        s.lastMessage || '（空）'
                      )}
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {activeSession.slice(0, 8)}
                </Badge>
                <Button variant="outline" size="sm" onClick={toggleSessionStatus}>
                  {activeInfo?.status === 'closed' ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      重开
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      关闭
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="bg-muted/10 flex-1 space-y-3 overflow-y-auto px-6 py-4">
              {messages.map((m, i) => {
                const isLastAdminRead =
                  m.sender === 'admin' && i === messages.length - 1 && m.read === true
                return (
                  <div key={i} className="flex flex-col">
                    <div
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
                    {isLastAdminRead && (
                      <span className="text-muted-foreground mt-0.5 self-end text-[10px]">
                        访客已读
                      </span>
                    )}
                  </div>
                )
              })}
              {visitorTyping[activeSession] && (
                <div className="flex justify-start">
                  <span className="bg-card text-muted-foreground inline-flex items-center gap-1 rounded-2xl border px-3 py-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
                      style={{ animationDelay: '0.3s' }}
                    />
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {showQuick && (
              <div className="bg-muted/20 border-t px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendReply(q)}
                      className="bg-background hover:bg-accent rounded-full border px-3 py-1 text-xs"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-background flex items-center gap-2 border-t p-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="快捷回复"
                onClick={() => setShowQuick((v) => !v)}
              >
                <Zap className="h-4 w-4" />
              </Button>
              <Input
                placeholder="输入回复…  (Enter 发送)"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  emitTyping()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendReply()
                  }
                }}
              />
              <Button onClick={() => sendReply()} disabled={!input.trim()}>
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
