import { useState, useEffect } from 'react'
import { KeyRound, User, ArrowRight, Copy, Download, Check, Sun, Moon } from 'lucide-react'
import { generateMnemonic, mnemonicToSeedHex } from '../utils/crypto'

export default function ProfileSetup({ onComplete, onNavigateImport }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [mnemonic, setMnemonic] = useState('')
  const [step, setStep] = useState(1) // 1: Name, 2: Seed Phrase
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  })

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

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

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleComplete = async () => {
    const seedHex = await mnemonicToSeedHex(mnemonic)
    const profile = { name: name.trim(), avatar, mnemonic, seedHex }
    
    // Save to Electron store
    await window.store.setProfile(profile)
    onComplete(profile)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background font-sans text-text antialiased p-6 relative">
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary/20 text-text transition-colors"
        title="Toggle Theme"
      >
        {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md bg-secondary/10 border border-secondary/30 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
        
        <div className="flex justify-center mb-6">
          <div 
            className={`relative rounded-full flex items-center justify-center ${step === 1 ? 'cursor-pointer group' : ''} ${!avatar || step !== 1 ? 'p-3 bg-primary/10' : ''}`}
            onClick={() => step === 1 && document.getElementById('avatar-upload')?.click()}
          >
            {step === 1 ? (
              avatar ? (
                <img src={avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary/50" />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )
            ) : (
              <KeyRound className="w-8 h-8 text-primary" />
            )}
            
            {step === 1 && (
               <div className={`absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${avatar ? 'w-20 h-20' : ''}`}>
                 <span className="text-xs text-white font-medium">Upload</span>
               </div>
            )}
            
            {step === 1 && (
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload} 
              />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          {step === 1 ? 'Create Profile' : 'Save Your Recovery Phrase'}
        </h1>
        <p className="text-center text-secondary mb-8 text-sm">
          {step === 1 
            ? 'Set up your unique decentralized identity.' 
            : 'Write down these 24 words. They are the only way to recover your account.'}
        </p>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text/80 mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Satoshi Nakamoto"
                className="w-full rounded-md border border-secondary/30 bg-background px-4 py-3 text-text placeholder:text-secondary focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                autoFocus
              />
            </div>
            
            <button
              onClick={handleNext}
              disabled={!name.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-background font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
            
            <div className="text-center mt-4">
              <button 
                onClick={onNavigateImport}
                className="text-sm text-secondary hover:text-primary transition-colors"
              >
                Already have an account? Import Profile
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="relative bg-background border border-secondary/30 rounded-lg p-4 font-mono text-sm leading-loose text-text selection:bg-primary/30 selection:text-text/90 text-center pb-12">
              {mnemonic}
              
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1 bg-secondary/20 hover:bg-secondary/40 text-text px-3 py-1.5 rounded-md text-xs transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-1 bg-secondary/20 hover:bg-secondary/40 text-text px-3 py-1.5 rounded-md text-xs transition-colors"
                  title="Download as text file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-accent/10 border border-accent/20 rounded-md text-accent text-xs">
              <span>⚠️</span>
              <p>Do not share this phrase with anyone. Keep it secure.</p>
            </div>

            <button
              onClick={handleComplete}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-background font-semibold py-3 px-4 rounded-md transition-colors"
            >
              I have saved it safely
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
