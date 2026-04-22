'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { io, type Socket } from 'socket.io-client'
import { SOCKET_EVENTS, type Message, type Session } from '@mojing/shared'
import { BACKEND_URL, api, getAccessToken, setAccessToken } from '@/lib/api'

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

  return (
    <div className="flex h-screen">
      {/* 会话列表 */}
      <aside className="flex w-72 flex-col border-r">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-gray-700">客服后台</span>
          <button
            onClick={() => void logout()}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            退出
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="mt-8 text-center text-xs text-gray-400">暂无会话</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.sessionId}
              onClick={() => void openSession(s.sessionId)}
              className={`w-full border-b px-4 py-3 text-left hover:bg-gray-50 ${activeSession === s.sessionId ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium">
                  {s.visitorInfo?.name || s.sessionId.slice(0, 8)}
                </span>
                {s.unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 text-xs text-white">
                    {s.unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-400">{s.lastMessage}</p>
              {s.visitorInfo?.email && (
                <p className="truncate text-xs text-blue-400">{s.visitorInfo.email}</p>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* 聊天区域 */}
      <main className="flex flex-1 flex-col">
        {activeSession ? (
          <>
            <div className="border-b px-4 py-3 text-sm text-gray-500">
              会话:{' '}
              {sessions.find((s) => s.sessionId === activeSession)?.visitorInfo?.name ||
                activeSession.slice(0, 8)}
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <span
                    className={`max-w-[60%] rounded-2xl px-3 py-2 text-sm ${
                      m.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {m.content}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="flex items-center gap-3 border-t px-4 py-3">
              <input
                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="回复消息..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
              />
              <button
                onClick={sendReply}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                发送
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            选择一个会话开始回复
          </div>
        )}
      </main>
    </div>
  )
}
