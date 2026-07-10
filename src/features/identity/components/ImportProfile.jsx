import { useState, useRef, useEffect } from 'react'
import { Download, ArrowLeft, Upload, Sun, Moon } from 'lucide-react'
import { validateMnemonic, mnemonicToSeedHex } from '../utils/crypto'

export default function ImportProfile({ onComplete, onNavigateSetup }) {
  const [name, setName] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      if (content) {
        setMnemonic(content.trim())
      }
    }
    reader.readAsText(file)
    // reset input so the same file can be uploaded again if needed
    e.target.value = null
  }

  const handleImport = async () => {
    setError('')
    
    if (!name.trim()) {
      setError('Please enter a display name')
      return
    }

    if (!validateMnemonic(mnemonic)) {
      setError('Invalid recovery phrase. Please check for typos and ensure you have all 24 words.')
      return
    }

    setIsLoading(true)
    try {
      const seedHex = await mnemonicToSeedHex(mnemonic)
      const profile = { name: name.trim(), mnemonic: mnemonic.trim(), seedHex }
      
      await window.store.setProfile(profile)
      onComplete(profile)
    } catch (err) {
      setError('Failed to import profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

      <div className="w-full max-w-md bg-secondary/10 border border-secondary/30 rounded-xl p-8 shadow-2xl backdrop-blur-sm relative">
        
        <button 
          onClick={onNavigateSetup}
          className="absolute top-6 left-6 p-2 text-secondary hover:text-text transition-colors rounded-full hover:bg-secondary/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6 mt-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <Download className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Import Profile</h1>
        <p className="text-center text-secondary mb-8 text-sm">
          Enter your 24-word recovery phrase to restore your identity.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text/80 mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Satoshi Nakamoto"
              className="w-full rounded-md border border-secondary/30 bg-background px-4 py-3 text-text placeholder:text-secondary focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text/80">Recovery Phrase</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                type="button"
              >
                <Upload className="w-3 h-3" />
                Upload File
              </button>
              <input 
                type="file" 
                accept=".txt" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
            </div>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="Enter your 24 words separated by spaces..."
              rows={4}
              className="w-full rounded-md border border-secondary/30 bg-background px-4 py-3 text-text placeholder:text-secondary focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none font-mono text-sm"
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-md border border-red-500/20">
              {error}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!name.trim() || !mnemonic.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-background font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importing...' : 'Restore Account'}
          </button>
        </div>

      </div>
    </div>
  )
}
