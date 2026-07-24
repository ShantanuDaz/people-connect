import { useState, useEffect, useRef } from 'react';
import './App.css';

interface Profile {
  name: string;
  publicKey: string;
  mnemonic?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}

const MOCK_MESSAGES_BY_ROOM: Record<string, ChatMessage[]> = {
  'global-room': [
    {
      id: '1',
      sender: 'Alice',
      text: 'Hey everyone! Welcome to the new People Connect chat dashboard.',
      timestamp: Date.now() - 3600000 * 2,
      isSelf: false,
    },
    {
      id: '2',
      sender: 'Bob',
      text: 'This looks amazing! The design is super clean and modern.',
      timestamp: Date.now() - 3600000 * 1.8,
      isSelf: false,
    },
    {
      id: '3',
      sender: 'Charlie',
      text: 'Can we build custom design themes with CSS variables now?',
      timestamp: Date.now() - 3600000 * 1.5,
      isSelf: false,
    },
    {
      id: '4',
      sender: 'Alice',
      text: 'Absolutely, it uses a full custom token system mapped to index.css.',
      timestamp: Date.now() - 3600000 * 1.4,
      isSelf: false,
    },
  ],
  'hyper-dev': [
    {
      id: 'h1',
      sender: 'Bob',
      text: 'Hyperswarm connection metrics are looking solid today.',
      timestamp: Date.now() - 3600000 * 3,
      isSelf: false,
    },
    {
      id: 'h2',
      sender: 'Charlie',
      text: 'Nice. Are we planning to sign appends directly via the Ed25519 keys?',
      timestamp: Date.now() - 3600000 * 2.8,
      isSelf: false,
    },
    {
      id: 'h3',
      sender: 'Alice',
      text: 'Yes! Electron derives them on boot, worker uses them for signing.',
      timestamp: Date.now() - 3600000 * 2.5,
      isSelf: false,
    },
  ],
  'off-topic': [
    {
      id: 'o1',
      sender: 'Charlie',
      text: 'Anyone tried the new space-themed mechanical switches?',
      timestamp: Date.now() - 3600000 * 4,
      isSelf: false,
    },
    {
      id: 'o2',
      sender: 'Bob',
      text: 'Yeah, they sound amazing. Extremely silent but nice tactile feedback.',
      timestamp: Date.now() - 3600000 * 3.5,
      isSelf: false,
    },
  ]
};

function App() {
  const [currentView, setCurrentView] = useState<'welcome' | 'create_account' | 'show_mnemonic' | 'dashboard'>('welcome');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create account form state
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string>('');
  
  // Dashboard state
  const [currentRoom, setCurrentRoom] = useState<string>('global-room');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and load default state
  useEffect(() => {
    // Determine system / stored theme
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme as 'light' | 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Auto-login active profile if it exists
    const initSession = async () => {
      try {
        const res = await window.electronAPI.request('GET_ACTIVE_PROFILE');
        if (res.success && res.profile) {
          setActiveProfile(res.profile);
          setCurrentView('dashboard');
        } else {
          await loadProfiles();
        }
      } catch (err: any) {
        console.error('Failed to initialize session:', err);
        setError('Failed to connect to Electron Main process');
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  // Sync scroll to bottom of chat
  useEffect(() => {
    if (currentView === 'dashboard') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView]);

  // Load message history when switching rooms or logging in
  useEffect(() => {
    if (activeProfile && currentView === 'dashboard') {
      const mockHistory = MOCK_MESSAGES_BY_ROOM[currentRoom] || [];
      // Combine with any user sent messages in session storage or state if desired
      setMessages(mockHistory);
    }
  }, [currentRoom, activeProfile, currentView]);

  const loadProfiles = async () => {
    try {
      const res = await window.electronAPI.request('GET_PROFILES');
      if (res.success) {
        setProfiles(res.profiles || []);
      } else {
        setError(res.error || 'Failed to fetch profiles');
      }
    } catch (err) {
      setError('Error communicating with main process');
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await window.electronAPI.request('CREATE_PROFILE', { name: newProfileName });
      if (res.success && res.profile) {
        setGeneratedMnemonic(res.profile.mnemonic || '');
        setActiveProfile(res.profile);
        setCurrentView('show_mnemonic');
      } else {
        setError(res.error || 'Failed to create profile');
      }
    } catch (err) {
      setError('Communication failed during profile creation');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (name: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await window.electronAPI.request('LOGIN_PROFILE', { name });
      if (res.success && res.profile) {
        setActiveProfile(res.profile);
        setCurrentView('dashboard');
      } else {
        setError(res.error || 'Failed to login to profile');
      }
    } catch (err) {
      setError('Communication failed during login');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card login trigger
    if (!confirm(`Are you sure you want to delete the profile "${name}"? This action is permanent.`)) return;

    try {
      const res = await window.electronAPI.request('DELETE_PROFILE', { name });
      if (res.success) {
        await loadProfiles();
      } else {
        setError(res.error || 'Failed to delete profile');
      }
    } catch (err) {
      setError('Communication error during delete');
    }
  };

  const handleLogout = async () => {
    try {
      await window.electronAPI.request('LOGOUT');
      setActiveProfile(null);
      setNewProfileName('');
      setGeneratedMnemonic('');
      await loadProfiles();
      setCurrentView('welcome');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeProfile) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: activeProfile.name,
      text: messageText.trim(),
      timestamp: Date.now(),
      isSelf: true,
    };

    // Dynamically append message to mock list for instant visual feedback
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && currentView === 'welcome') {
    return (
      <div className="app-loading-container">
        <div className="spinner"></div>
        <p>Loading profiles and initializing secure keychain...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header / Title Bar */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-dot"></span>
          <h1 className="brand-title">People Connect</h1>
          <span className="badge">v1.0.0-beta</span>
        </div>
        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme" id="theme-toggle">
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
          </button>
          {activeProfile && (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{error}</span>
          <button className="close-error-btn" onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Main App Content Views */}
      <main className="app-main-content">
        
        {/* VIEW 1: Welcome & Profile List */}
        {currentView === 'welcome' && (
          <section className="view-card auth-view" id="welcome-view">
            <div className="welcome-hero">
              <h2 className="gradient-text">Decentralized P2P Space</h2>
              <p className="subtitle">Secure communication directly with your peers. Zero servers, maximum privacy.</p>
            </div>

            <div className="profiles-section">
              <h3>Select a Profile</h3>
              
              {profiles.length === 0 ? (
                <div className="empty-profiles-box">
                  <p>No profiles found on this system.</p>
                  <p className="dimmed">Create an account to derive your secure cryptokeys and start connecting.</p>
                </div>
              ) : (
                <div className="profiles-grid">
                  {profiles.map(p => (
                    <div className="profile-auth-card" key={p.name} onClick={() => handleLogin(p.name)}>
                      <div className="profile-avatar">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="profile-info">
                        <span className="profile-name">{p.name}</span>
                        <span className="profile-key-dimmed">
                          ID: {p.publicKey.slice(0, 8)}...{p.publicKey.slice(-8)}
                        </span>
                      </div>
                      <div className="card-actions">
                        <button 
                          className="delete-card-btn" 
                          onClick={(e) => handleDeleteProfile(p.name, e)}
                          title="Delete profile"
                          aria-label="Delete profile"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="primary-btn create-acc-btn" onClick={() => setCurrentView('create_account')}>
                Create New Profile
              </button>
            </div>
          </section>
        )}

        {/* VIEW 2: Create Account Form */}
        {currentView === 'create_account' && (
          <section className="view-card auth-view" id="create-view">
            <h2>Generate Profile</h2>
            <p className="subtitle">Choose an account name. This name is local to this profile and will identify you in chat rooms.</p>

            <form onSubmit={handleCreateProfile} className="auth-form">
              <div className="form-group">
                <label htmlFor="profileName">Profile Username</label>
                <input 
                  type="text" 
                  id="profileName" 
                  value={newProfileName} 
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Satoshi"
                  maxLength={25}
                  required
                  autoFocus
                />
              </div>
              
              <div className="auth-actions">
                <button type="button" className="secondary-btn" onClick={() => setCurrentView('welcome')}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Generate Cryptokeys
                </button>
              </div>
            </form>
          </section>
        )}

        {/* VIEW 3: Show Derived Mnemonic Seed Phrase */}
        {currentView === 'show_mnemonic' && (
          <section className="view-card auth-view security-view" id="mnemonic-view">
            <div className="security-header">
              <div className="warning-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <h2>Backup Seed Phrase</h2>
            </div>
            
            <div className="warning-box">
              <p><strong>CRITICAL: Save this phrase immediately!</strong></p>
              <p>This 24-word phrase is the master seed of your identity. Electron uses it to derive your Ed25519 signing keys. If you lose this phrase or delete this profile file, your keys and decentralized data cannot be recovered.</p>
            </div>

            <div className="mnemonic-grid">
              {generatedMnemonic.split(' ').map((word, i) => (
                <div className="mnemonic-word-card" key={i}>
                  <span className="word-index">{i + 1}</span>
                  <span className="word-text">{word}</span>
                </div>
              ))}
            </div>

            <div className="security-actions">
              <button 
                className="secondary-btn copy-btn" 
                onClick={() => copyToClipboard(generatedMnemonic, 'mnemonic')}
              >
                {copiedText === 'mnemonic' ? 'Copied Phrase!' : 'Copy to Clipboard'}
              </button>
              <button className="primary-btn" onClick={() => setCurrentView('dashboard')}>
                I Have Backed It Up
              </button>
            </div>
          </section>
        )}

        {/* VIEW 4: Active Chat Dashboard */}
        {currentView === 'dashboard' && activeProfile && (
          <section className="dashboard-layout" id="dashboard-view">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
              <div className="sidebar-header">
                <h3>Rooms</h3>
              </div>

              <nav className="rooms-nav">
                <button 
                  className={`room-link ${currentRoom === 'global-room' ? 'active' : ''}`}
                  onClick={() => setCurrentRoom('global-room')}
                >
                  <span className="room-hash">#</span> global-room
                </button>
                <button 
                  className={`room-link ${currentRoom === 'hyper-dev' ? 'active' : ''}`}
                  onClick={() => setCurrentRoom('hyper-dev')}
                >
                  <span className="room-hash">#</span> hyper-dev
                </button>
                <button 
                  className={`room-link ${currentRoom === 'off-topic' ? 'active' : ''}`}
                  onClick={() => setCurrentRoom('off-topic')}
                >
                  <span className="room-hash">#</span> off-topic
                </button>
              </nav>

              <div className="sidebar-footer">
                <div className="sidebar-profile-box">
                  <div className="profile-footer-avatar">
                    {activeProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-footer-details">
                    <span className="profile-footer-name">{activeProfile.name}</span>
                    <button 
                      className="profile-footer-id-btn" 
                      onClick={() => copyToClipboard(activeProfile.publicKey, 'pubkey')}
                      title="Click to copy public key"
                    >
                      {copiedText === 'pubkey' ? 'Copied ID!' : `${activeProfile.publicKey.slice(0, 6)}...${activeProfile.publicKey.slice(-6)}`}
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Chat Area */}
            <div className="chat-window">
              <div className="chat-header">
                <div className="chat-room-info">
                  <h2>#{currentRoom}</h2>
                  <span className="chat-meta">Decentralized Channel</span>
                </div>
                <div className="chat-status">
                  <span className="status-indicator"></span>
                  <span className="status-text">Holeswarm Sync Active</span>
                </div>
              </div>

              <div className="chat-messages-container">
                {messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <p className="dimmed">No messages yet in #{currentRoom}.</p>
                    <p className="dimmed-small">Type a message below to start the conversation.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div className={`message-bubble-wrapper ${msg.isSelf ? 'msg-self' : 'msg-peer'}`} key={msg.id}>
                      {!msg.isSelf && (
                        <div className="message-avatar">
                          {msg.sender.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="message-bubble-content">
                        {!msg.isSelf && <span className="message-sender">{msg.sender}</span>}
                        <div className="message-text-bubble">
                          <p>{msg.text}</p>
                        </div>
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input 
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Send a message to #${currentRoom}...`}
                  maxLength={500}
                  required
                />
                <button type="submit" className="send-message-btn" aria-label="Send message">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

export default App;
