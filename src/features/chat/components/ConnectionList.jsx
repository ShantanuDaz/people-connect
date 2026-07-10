import { Plus, Hash, Check, X, Clock, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export default function ConnectionList({ connections, dbState, activeConnectionId, onSelectConnection, onCreateInvite, onJoinInvite, onAccept, onReject }) {
  const [inviteInput, setInviteInput] = useState('')

  const handleJoin = (e) => {
    e.preventDefault()
    if (inviteInput.trim()) {
      onJoinInvite(inviteInput.trim())
      setInviteInput('')
    }
  }

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-900/40 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-zinc-800">
        <button 
          onClick={onCreateInvite}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium py-2 px-4 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          Share Profile
        </button>
      </div>

      <div className="p-4 border-b border-zinc-800 bg-zinc-900/20">
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={inviteInput}
            onChange={e => setInviteInput(e.target.value)}
            placeholder="Paste invite link..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 w-full"
          />
          <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-md text-sm transition-colors shrink-0">
            Join
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        
        {/* Pending Requests */}
        {dbState?.pending?.length > 0 && (
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pending Requests</h3>
            {dbState.pending.map((req) => (
              <div key={req.peerPubKeyHex} className="flex flex-col gap-2 p-3 bg-zinc-800/30 rounded-md border border-emerald-500/20">
                <div className="text-xs text-zinc-300 truncate flex items-center gap-2">
                  {req.peerInfo ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[10px]">
                        {req.peerInfo.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{req.peerInfo.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-emerald-400">Peer:</span> {req.peerPubKeyHex.slice(0, 12)}...
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onAccept(req.peerPubKeyHex)} className="flex-1 flex items-center justify-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-1 rounded text-xs transition-colors">
                    <Check className="w-3 h-3" /> Accept
                  </button>
                  <button onClick={() => onReject(req.peerPubKeyHex)} className="flex-1 flex items-center justify-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 py-1 rounded text-xs transition-colors">
                    <X className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Requested (Outgoing) */}
        {dbState?.requested?.length > 0 && (
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Sent Requests</h3>
            {dbState.requested.map((req) => (
              <div key={req.peerPubKeyHex} className="flex items-center gap-2 px-3 py-2 opacity-60">
                <Clock className="w-3 h-3 text-amber-500" />
                {req.peerInfo ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-[8px]">
                      {req.peerInfo.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs truncate text-zinc-400">{req.peerInfo.name}</span>
                  </>
                ) : (
                  <span className="text-xs truncate text-zinc-400">{req.peerPubKeyHex.slice(0, 12)}...</span>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Rejected */}
        {dbState?.rejected?.length > 0 && (
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Rejected</h3>
            {dbState.rejected.map((req) => (
              <div key={req.peerPubKeyHex} className="flex items-center gap-2 px-3 py-2 opacity-50">
                <AlertCircle className="w-3 h-3 text-rose-500" />
                <span className="text-xs truncate text-zinc-500 line-through">{req.peerPubKeyHex.slice(0, 12)}...</span>
              </div>
            ))}
          </div>
        )}

        {/* Active Connections */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Active Chats</h3>
          {dbState?.connections?.map((c) => {
            if (!c.pairwiseTopic) return null;
            const isSelected = activeConnectionId === c.pairwiseTopic;
            return (
              <button
                key={c.pairwiseTopic}
                onClick={() => onSelectConnection(c.pairwiseTopic)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                  isSelected 
                    ? 'bg-zinc-800 text-emerald-400' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                {connections?.[c.pairwiseTopic]?.peerAvatar ? (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-300'}`}>
                    {connections[c.pairwiseTopic].peerAvatar}
                  </div>
                ) : (
                  <Hash className="h-4 w-4 flex-shrink-0" />
                )}
                <div className="flex-1 truncate text-sm font-medium">
                  {connections?.[c.pairwiseTopic]?.peerName || c.peerPubKeyHex.slice(0, 8)}
                </div>
              </button>
            )
          })}
          {(!dbState?.connections || dbState.connections.length === 0) && (
            <div className="text-center text-zinc-500 text-xs mt-8 px-4">
              No active connections. Create an invite or join one!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
