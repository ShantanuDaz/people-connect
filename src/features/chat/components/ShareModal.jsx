import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

export default function ShareModal({ isOpen, onClose, publicKeyHex }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const inviteLink = publicKeyHex ? `peer:${publicKeyHex}` : 'Loading...'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-zinc-100">Share Profile</h2>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-1 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-zinc-400">
            Share this personal link with someone so they can connect with you directly. This link is permanent and unique to your profile.
          </p>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Your Personal Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-300 font-mono truncate overflow-hidden">
                {inviteLink}
              </div>
              <button 
                onClick={handleCopy}
                className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2.5 rounded-md transition-colors shrink-0"
                title="Copy to clipboard"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium rounded-md transition-colors text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
