import { useState, useRef, useEffect } from 'react'
import { Send, Users, LogOut, Copy, Check, File } from 'lucide-react'

export default function WorkspaceArea({ profile, activeConnectionId, connection, onSendPayload, onLogout, isChatLoading }) {
  const [inputValue, setInputValue] = useState('')
  const [copied, setCopied] = useState(false)
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [connection?.history])

  const handleSendText = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    onSendPayload(inputValue, 'text')
    setInputValue('')
  }

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`chat-invite:${activeConnectionId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Generic payload renderer!
  const renderPayload = (msg) => {
    switch (msg.payload.type) {
      case 'text':
        return (
          <span className={`text-sm ${msg.payload.type === 'system' ? 'text-zinc-500 italic bg-zinc-900 px-3 py-1 rounded-full text-xs' : 'text-zinc-300 break-words flex-1'}`}>
            {msg.payload.content}
          </span>
        )
      case 'image':
        // Placeholder for future image sharing
        return (
          <div className="bg-zinc-900 rounded p-2 flex items-center gap-2">
            <File className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-zinc-400">Image Payload Received</span>
          </div>
        )
      default:
        return (
          <span className="text-sm text-zinc-500 italic">Unsupported payload type</span>
        )
    }
  }

  if (!connection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 h-full">
        <Users className="h-12 w-12 mb-4 opacity-20" />
        <p>Select a connection to view workspace</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 h-full min-w-0">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          {connection.peerAvatar ? (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-lg">
              {connection.peerAvatar}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <Users className="w-5 h-5" />
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-zinc-100 font-medium text-lg leading-tight">{connection.peerName || 'Unknown Peer'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-500">ID:</span>
              <button 
                onClick={handleCopyInvite}
                className="flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/10 px-1.5 py-0.5 rounded"
              >
                {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-2 text-zinc-300 bg-zinc-800 px-3 py-1.5 rounded-full">
            <span className="size-2 rounded-full bg-emerald-500"></span>
            {profile?.name || 'Loading'}
          </span>
          {onLogout && (
            <button onClick={onLogout} className="p-2 hover:bg-zinc-800 hover:text-zinc-200 rounded-full transition-colors" title="Switch Profile">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <main ref={logRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isChatLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-sm">Loading workspace history...</p>
          </div>
        ) : connection.history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
            <p>This is the beginning of your connection.</p>
            <p className="text-xs text-zinc-600">Share your ID to establish a P2P link!</p>
          </div>
        ) : (
          connection.history.map((msg, i) => (
            <div key={i} className={`flex gap-3 items-baseline ${msg.payload.type === 'system' ? 'justify-center my-4' : ''}`}>
              {msg.payload.type !== 'system' && (
                <span className={`text-sm flex-shrink-0 ${msg.isOwn ? 'text-emerald-400' : 'text-sky-400'} font-medium`}>
                  {msg.from}:
                </span>
              )}
              {renderPayload(msg)}
            </div>
          ))
        )}
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-900/60 p-4 shrink-0">
        <form onSubmit={handleSendText} className="relative flex items-center">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send text payload..."
            autoFocus
            className="w-full rounded-full border border-zinc-800 bg-zinc-950 pl-6 pr-12 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
          <button
            type="submit"
            className="absolute right-2 p-2.5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </footer>
    </div>
  )
}
