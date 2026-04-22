'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client'

interface Message {
  sessionId: string
  sender: 'visitor' | 'admin'
  content: string
  createdAt?: string
}

interface Session {
  _id: string
  lastMessage: string
  visitorInfo?: { name?: string; email?: string }
  unread: number
  updatedAt: string
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

export default function AdminPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeSessionRef = useRef<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    const socket = io(BACKEND)
    socketRef.current = socket
    socket.emit('join_admin', token)

    socket.on('auth_error', () => {
      localStorage.removeItem('admin_token')
      router.push('/admin/login')
    })

    socket.on('new_message', (msg: Message) => {
      setSessions((prev) => {
        const exists = prev.find((s) => s._id === msg.sessionId)
        if (exists) {
          return prev.map((s) =>
            s._id === msg.sessionId
              ? {
                  ...s,
                  lastMessage: msg.content,
                  unread:
                    msg.sender === 'visitor' && activeSessionRef.current !== msg.sessionId
                      ? s.unread + 1
                      : s.unread,
                }
              : s,
          )
        }
        return [
          {
            _id: msg.sessionId,
            lastMessage: msg.content,
            unread: 1,
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ]
      })
      if (msg.sessionId === activeSessionRef.current) {
        setMessages((prev) => [...prev, msg])
      }
    })

    loadSessions(token)
    return () => {
      socket.disconnect()
    }
  }, [router])

  useEffect(() => {
    activeSessionRef.current = activeSession
  }, [activeSession])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getToken = () => localStorage.getItem('admin_token') || ''

  const loadSessions = async (token: string) => {
    const res = await fetch(`${BACKEND}/api/chat/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      router.push('/admin/login')
      return
    }
    const data = await res.json()
    setSessions(data)
  }

  const openSession = async (sid: string) => {
    setActiveSession(sid)
    const token = getToken()
    const res = await fetch(`${BACKEND}/api/chat/history/${sid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setMessages(data)
    await fetch(`${BACKEND}/api/chat/read/${sid}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    setSessions((prev) => prev.map((s) => (s._id === sid ? { ...s, unread: 0 } : s)))
  }

  const sendReply = () => {
    if (!input.trim() || !activeSession) return
    socketRef.current?.emit('admin_message', { sessionId: activeSession, content: input })
    setInput('')
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  return (
    <div className="flex h-screen">
      {/* 会话列表 */}
      <aside className="flex w-72 flex-col border-r">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-gray-700">客服后台</span>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500">
            退出
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="mt-8 text-center text-xs text-gray-400">暂无会话</p>
          )}
          {sessions.map((s) => (
            <button
              key={s._id}
              onClick={() => openSession(s._id)}
              className={`w-full border-b px-4 py-3 text-left hover:bg-gray-50 ${activeSession === s._id ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium">
                  {s.visitorInfo?.name || s._id.slice(0, 8)}
                </span>
                {s.unread > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 text-xs text-white">
                    {s.unread}
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
              {sessions.find((s) => s._id === activeSession)?.visitorInfo?.name ||
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
