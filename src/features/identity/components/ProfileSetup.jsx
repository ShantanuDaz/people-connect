import { useState, useEffect } from 'react'
import { KeyRound, User, ArrowRight, Copy, Download, Check } from 'lucide-react'
import { generateMnemonic, mnemonicToSeedHex } from '../utils/crypto'

export default function ProfileSetup({ onComplete, onNavigateImport }) {
  const [name, setName] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [step, setStep] = useState(1) // 1: Name, 2: Seed Phrase
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Generate a new mnemonic on mount
    setMnemonic(generateMnemonic())
  }, [])

  const handleNext = () => {
    if (name.trim()) setStep(2)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([mnemonic], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = "pear-chat-recovery-phrase.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleComplete = async () => {
    const seedHex = await mnemonicToSeedHex(mnemonic)
    const profile = { name: name.trim(), mnemonic, seedHex }
    
    // Save to Electron store
    await window.store.setProfile(profile)
    onComplete(profile)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-zinc-950 font-sans text-zinc-100 antialiased p-6">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
        
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-full">
            {step === 1 ? (
              <User className="w-8 h-8 text-emerald-400" />
            ) : (
              <KeyRound className="w-8 h-8 text-emerald-400" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          {step === 1 ? 'Create Profile' : 'Save Your Recovery Phrase'}
        </h1>
        <p className="text-center text-zinc-400 mb-8 text-sm">
          {step === 1 
            ? 'Set up your unique decentralized identity.' 
            : 'Write down these 24 words. They are the only way to recover your account.'}
        </p>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Satoshi Nakamoto"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                autoFocus
              />
            </div>
            
            <button
              onClick={handleNext}
              disabled={!name.trim()}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
            
            <div className="text-center mt-4">
              <button 
                onClick={onNavigateImport}
                className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                Already have an account? Import Profile
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm leading-loose text-zinc-300 selection:bg-emerald-500/30 selection:text-emerald-200 text-center pb-12">
              {mnemonic}
              
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md text-xs transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md text-xs transition-colors"
                  title="Download as text file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-200/80 text-xs">
              <span>⚠️</span>
              <p>Do not share this phrase with anyone. Keep it secure.</p>
            </div>

            <button
              onClick={handleComplete}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-3 px-4 rounded-md transition-colors"
            >
              I have saved it safely
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
