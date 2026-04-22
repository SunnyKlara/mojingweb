'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { io, type Socket } from 'socket.io-client'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, X, User, Mail } from 'lucide-react'
import { SOCKET_EVENTS, type Message } from '@mojing/shared'
import { BACKEND_URL, api } from '@/lib/api'
import { ensureVisitorSession } from '@/lib/chat-session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function ChatWidget() {
  const t = useTranslations('chat')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '' })
  const [infoSubmitted, setInfoSubmitted] = useState(false)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const sessionIdRef = useRef<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    let socket: Socket | undefined

    void (async () => {
      const { sessionId, sessionToken } = await ensureVisitorSession()
      if (cancelled) return
      sessionIdRef.current = sessionId

      socket = io(BACKEND_URL, { auth: { sessionToken } })
      socketRef.current = socket
      socket.on('connect', () => setConnected(true))
      socket.on('disconnect', () => setConnected(false))

      socket.on(SOCKET_EVENTS.MESSAGE, (msg: Message) => {
        setMessages((prev) => [...prev, msg])
      })

      try {
        const history = await api<Message[]>(`/api/chat/history/${sessionId}`, { sessionToken })
        if (!cancelled) setMessages(history)
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
      socket?.disconnect()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open && infoSubmitted) inputRef.current?.focus()
  }, [open, infoSubmitted])

  const sendMessage = () => {
    const trimmed = input.trim()
    if (!trimmed || !sessionIdRef.current || !connected) return
    socketRef.current?.emit(SOCKET_EVENTS.VISITOR_MESSAGE, {
      sessionId: sessionIdRef.current,
      content: trimmed,
      visitorInfo,
    })
    setInput('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-card text-card-foreground flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
            role="dialog"
            aria-label="在线客服"
          >
            {/* Header */}
            <div className="from-primary text-primary-foreground flex items-center justify-between border-b bg-gradient-to-br to-blue-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-none">{t('title')}</p>
                  <p className="text-primary-foreground/75 mt-1 flex items-center gap-1 text-xs">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        connected ? 'bg-emerald-400' : 'bg-amber-400',
                      )}
                    />
                    {connected ? t('connected') : t('connecting')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="text-primary-foreground hover:text-primary-foreground h-8 w-8 hover:bg-white/10"
                aria-label={t('closeLabel')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            {!infoSubmitted ? (
              <form
                className="flex flex-1 flex-col justify-center gap-4 p-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  setInfoSubmitted(true)
                }}
              >
                <p className="text-muted-foreground text-center text-sm">{t('promptInfo')}</p>
                <div className="grid gap-1.5">
                  <Label htmlFor="chat-name">{t('name')}</Label>
                  <div className="relative">
                    <User className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="chat-name"
                      className="pl-9"
                      placeholder={t('namePlaceholder')}
                      value={visitorInfo.name}
                      onChange={(e) => setVisitorInfo((v) => ({ ...v, name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="chat-email">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="chat-email"
                      type="email"
                      className="pl-9"
                      placeholder={t('emailPlaceholder')}
                      value={visitorInfo.email}
                      onChange={(e) => setVisitorInfo((v) => ({ ...v, email: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {t('start')}
                </Button>
              </form>
            ) : (
              <>
                <div className="bg-muted/20 flex-1 space-y-2 overflow-y-auto p-4">
                  {messages.length === 0 && (
                    <p className="text-muted-foreground mt-6 text-center text-xs">
                      {t('greeting')}
                    </p>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex',
                        m.sender === 'visitor' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <span
                        className={cn(
                          'max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                          m.sender === 'visitor'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-foreground border',
                        )}
                      >
                        {m.content}
                      </span>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="bg-background flex items-center gap-2 border-t p-2">
                  <Input
                    ref={inputRef}
                    placeholder={t('inputPlaceholder')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    className="h-9 border-0 shadow-none focus-visible:ring-0"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!input.trim() || !connected}
                    aria-label={t('send')}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.04 }}
        onClick={() => setOpen((o) => !o)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring grid h-14 w-14 place-items-center rounded-full shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label={open ? t('closeLabel') : t('openLabel')}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="msg"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
