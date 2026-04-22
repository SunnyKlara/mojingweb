'use client'
import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  sender: 'visitor' | 'admin'
  content: string
  createdAt?: string
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '' })
  const [infoSubmitted, setInfoSubmitted] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const sessionId = useRef<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 持久化 sessionId
    let sid = localStorage.getItem('chat_session')
    if (!sid) {
      sid = uuidv4()
      localStorage.setItem('chat_session', sid)
    }
    sessionId.current = sid

    const socket = io(BACKEND)
    socketRef.current = socket
    socket.emit('join', sid)

    socket.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })

    // 加载历史消息
    fetch(`${BACKEND}/api/chat/history/${sid}`)
      .then((r) => r.json())
      .then((data) => setMessages(data))
      .catch(() => {})

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    socketRef.current?.emit('visitor_message', {
      sessionId: sessionId.current,
      content: input,
      visitorInfo,
    })
    setInput('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[460px] w-80 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          {/* 头部 */}
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <span className="font-semibold">在线客服</span>
            <button onClick={() => setOpen(false)} className="text-lg leading-none text-white">
              ×
            </button>
          </div>

          {/* 访客信息收集 */}
          {!infoSubmitted ? (
            <div className="flex flex-1 flex-col justify-center gap-3 p-4">
              <p className="text-sm text-gray-500">请留下您的信息，方便我们回复您</p>
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                placeholder="您的姓名（选填）"
                value={visitorInfo.name}
                onChange={(e) => setVisitorInfo((v) => ({ ...v, name: e.target.value }))}
              />
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                placeholder="您的邮箱（选填）"
                value={visitorInfo.email}
                onChange={(e) => setVisitorInfo((v) => ({ ...v, email: e.target.value }))}
              />
              <button
                onClick={() => setInfoSubmitted(true)}
                className="rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700"
              >
                开始咨询
              </button>
            </div>
          ) : (
            <>
              {/* 消息列表 */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                {messages.length === 0 && (
                  <p className="mt-4 text-center text-xs text-gray-400">您好，有什么可以帮您？</p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender === 'visitor'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {m.content}
                    </span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* 输入框 */}
              <div className="flex items-center gap-2 border-t px-3 py-2">
                <input
                  className="flex-1 text-sm outline-none"
                  placeholder="输入消息..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} className="text-sm font-semibold text-blue-600">
                  发送
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg hover:bg-blue-700"
        aria-label="客服"
      >
        💬
      </button>
    </div>
  )
}
