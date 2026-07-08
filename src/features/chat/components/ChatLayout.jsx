import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Users, Send, LogOut } from 'lucide-react'

export default function ChatLayout({ profile, onLogout }) {
  const [messages, setMessages] = useState([])
  const [peers, setPeers] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const logRef = useRef(null)

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.type === 'peers') {
        setPeers(event.count)
      } else if (event.type === 'message') {
        setMessages(prev => [...prev, { from: event.from, text: event.text, type: 'peer' }])
      } else if (event.type === 'ready') {
        setMessages(prev => [...prev, { from: 'system', text: 'connected to swarm', type: 'system' }])
      }
    }

    const unsubscribe = window.chat.onMessage(handleMessage)
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Display locally with your own name
    setMessages(prev => [...prev, { from: profile.name, text: inputValue, type: 'you' }])
    
    // Send via IPC. The worker will stringify with our name automatically based on args, 
    // or we could stringify it here, but we already set the worker to inject the name.
    // Wait, earlier I updated the worker:
    // `const payload = JSON.stringify({ name, text }); for(conn) conn.write(payload)`
    // So we just need to send `inputValue` as text to the worker.
    window.chat.send(inputValue)
    setInputValue('')
  }

  const getMessageStyle = (type) => {
    switch (type) {
      case 'system': return 'text-zinc-500 italic'
      case 'you': return 'text-emerald-400 font-medium'
      default: return 'text-sky-400 font-medium'
    }
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 font-sans text-zinc-100 antialiased">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-400" />
          <h1 className="text-sm font-semibold">Pear Chat</h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-2 text-zinc-300 bg-zinc-800 px-2 py-1 rounded-md">
            <span className="size-2 rounded-full bg-emerald-500"></span>
            {profile.name}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="font-medium text-zinc-100">{peers}</span>
          </span>
          {onLogout && (
            <button onClick={onLogout} className="p-1 hover:text-zinc-200 transition-colors" title="Switch Profile">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <main ref={logRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4 text-sm">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 items-baseline">
            <span className={getMessageStyle(msg.type)}>{msg.from}:</span>
            <span className="text-zinc-300">{msg.text}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-zinc-500">
            Connecting to peers...
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            autoFocus
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 pl-4 pr-12 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            type="submit"
            className="absolute right-2 p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </footer>
    </div>
  )
}
