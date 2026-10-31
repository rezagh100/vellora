import React, { useMemo, useState } from 'react';
import AuthScreen from './AuthScreen.jsx';
import { tokenStore } from './api.js';
import {
  Search, Plus, MessageCircle, Users, Settings, MoreHorizontal, Paperclip,
  Smile, Send, Phone, Video, Info, ChevronLeft, CheckCheck, Check,
  Image, FileText, Mic, Pin, Bell, ShieldCheck, X, ArrowDown, Sparkles
} from 'lucide-react';

const initialChats = [
  { id: 1, name: 'Design team', type: 'group', members: '8 members', avatar: 'DT', color: 'violet', online: true, time: '10:42', unread: 3, preview: 'Mina: I shared the latest screens', pinned: true,
    messages: [
      { id: 1, sender: 'Mina', text: 'Hey team! I’ve shared the latest dashboard screens.', time: '10:31', mine: false },
      { id: 2, sender: 'You', text: 'Nice work. The spacing feels much better now.', time: '10:34', mine: true, read: true },
      { id: 3, sender: 'Arman', text: 'Agree. I’ll review the mobile layout too.', time: '10:38', mine: false },
      { id: 4, sender: 'Mina', text: 'I shared the latest screens', time: '10:42', mine: false }
    ]
  },
  { id: 2, name: 'Sara Wilson', type: 'private', members: 'Online', avatar: 'SW', color: 'peach', online: true, time: '09:18', unread: 0, preview: 'That sounds good, see you then.',
    messages: [
      { id: 1, sender: 'Sara', text: 'Are we still on for the project review?', time: '09:12', mine: false },
      { id: 2, sender: 'You', text: 'Absolutely. I’ll bring the updated flow.', time: '09:15', mine: true, read: true },
      { id: 3, sender: 'Sara', text: 'That sounds good, see you then.', time: '09:18', mine: false }
    ]
  },
  { id: 3, name: 'Backend study group', type: 'group', members: '12 members', avatar: 'BS', color: 'mint', online: false, time: 'Yesterday', unread: 0, preview: 'Reza: Redis makes more sense now',
    messages: [
      { id: 1, sender: 'Reza', text: 'Redis makes more sense now that we’ve mapped the flow.', time: 'Yesterday', mine: false },
      { id: 2, sender: 'You', text: 'Next up: Celery workers and retries.', time: 'Yesterday', mine: true, read: true }
    ]
  },
  { id: 4, name: 'Alex Morgan', type: 'private', members: 'Last seen recently', avatar: 'AM', color: 'blue', online: false, time: 'Mon', unread: 0, preview: 'Sent you a document',
    messages: [
      { id: 1, sender: 'Alex', text: 'I’ve sent over the API notes.', time: 'Mon', mine: false },
      { id: 2, sender: 'You', text: 'Thanks, I’ll take a look.', time: 'Mon', mine: true, read: true }
    ]
  },
  { id: 5, name: 'Weekend plans', type: 'group', members: '5 members', avatar: 'WP', color: 'gold', online: false, time: 'Sun', unread: 0, preview: 'Nima: Count me in 🙌',
    messages: [{ id: 1, sender: 'Nima', text: 'Count me in 🙌', time: 'Sun', mine: false }]
  }
];

function Avatar({ chat, small = false }) {
  return <div className={`avatar ${chat.color} ${small ? 'small' : ''}`}>
    {chat.avatar}
    {chat.online && <i className="online-dot" />}
  </div>;
}

function ChatApp({ onLogout }) {
  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState(1);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const activeChat = chats.find(c => c.id === activeId) || chats[0];

  const visibleChats = useMemo(() => chats.filter(c => {
    const matchesText = `${c.name} ${c.preview}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Unread' && c.unread > 0) || (filter === 'Groups' && c.type === 'group');
    return matchesText && matchesFilter;
  }), [chats, query, filter]);

  function openChat(id) {
    setActiveId(id);
    setMobileChat(true);
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  }

  function sendMessage(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChats(prev => prev.map(c => c.id === activeId ? {
      ...c,
      time: now,
      preview: `You: ${text}`,
      messages: [...c.messages, { id: Date.now(), sender: 'You', text, time: now, mine: true, read: false }]
    } : c));
    setDraft('');
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileChat ? 'hide-mobile' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><MessageCircle size={20} strokeWidth={2.5}/></div>
          <span className="brand-name">vellora<span>.</span></span>
          <button className="icon-button sidebar-menu" aria-label="More"><MoreHorizontal size={20}/></button>
        </div>

        <div className="profile-card">
          <div className="avatar profile-avatar">RG<i className="online-dot"/></div>
          <div className="profile-copy"><strong>Reza G.</strong><span><i className="status-dot"/> Available</span></div>
          <button className="icon-button" aria-label="Sign out" title="Sign out" onClick={onLogout}><X size={18}/></button>
        </div>

        <div className="search-wrap">
          <Search size={17}/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations..." />
          <kbd>⌘ K</kbd>
        </div>

        <div className="section-heading">
          <span>MESSAGES</span>
          <button className="new-chat" onClick={() => setShowNewChat(true)} aria-label="New conversation"><Plus size={17}/></button>
        </div>
        <div className="filter-row">
          {['All', 'Unread', 'Groups'].map(f => <button key={f} onClick={() => setFilter(f)} className={`filter-chip ${filter === f ? 'selected' : ''}`}>{f}</button>)}
        </div>

        <div className="chat-list">
          {visibleChats.map(chat => (
            <button key={chat.id} className={`chat-item ${activeId === chat.id ? 'active' : ''}`} onClick={() => openChat(chat.id)}>
              <Avatar chat={chat}/>
              <span className="chat-meta">
                <span className="chat-top"><strong>{chat.name}</strong><time>{chat.time}</time></span>
                <span className="chat-bottom"><span className="preview">{chat.preview}</span>{chat.unread > 0 && <b className="unread-count">{chat.unread}</b>}</span>
              </span>
            </button>
          ))}
          {visibleChats.length === 0 && <div className="empty-search">No conversations found.</div>}
        </div>
        <div className="sidebar-footer"><ShieldCheck size={15}/><span>Your conversations are private</span></div>
      </aside>

      <section className={`chat-panel ${!mobileChat ? 'hide-mobile' : ''}`}>
        <header className="chat-header">
          <button className="back-button icon-button" onClick={() => setMobileChat(false)} aria-label="Back to chats"><ChevronLeft size={21}/></button>
          <Avatar chat={activeChat} small/>
          <div className="header-person">
            <strong>{activeChat.name}</strong>
            <span>{activeChat.type === 'group' ? activeChat.members : activeChat.online ? 'Online now' : 'Last seen recently'}</span>
          </div>
          <div className="header-actions">
            <button className="icon-button" aria-label="Voice call"><Phone size={18}/></button>
            <button className="icon-button" aria-label="Video call"><Video size={19}/></button>
            <span className="action-divider"/>
            <button className={`icon-button ${showDetails ? 'pressed' : ''}`} onClick={() => setShowDetails(!showDetails)} aria-label="Conversation details"><Info size={19}/></button>
          </div>
        </header>

        <div className="api-preview-note"><span className="api-note-dot"/> Signed in with Vellora API · Chat endpoints are not available in this backend version yet, so conversations below are demo data.</div>
        <div className="conversation-bg">
          <div className="date-pill">Today</div>
          <div className="message-stack">
            {activeChat.messages.map((m, i) => (
              <div key={m.id} className={`message-row ${m.mine ? 'mine' : ''}`}>
                {!m.mine && <div className="message-avatar">{m.sender.slice(0,1)}</div>}
                <div className={`message-bubble ${m.mine ? 'outgoing' : 'incoming'}`}>
                  {!m.mine && activeChat.type === 'group' && <strong className="sender-name">{m.sender}</strong>}
                  <p>{m.text}</p>
                  <div className="message-foot"><time>{m.time}</time>{m.mine && (m.read ? <CheckCheck size={14}/> : <Check size={14}/>)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="typing-indicator"><span/><span/><span/> <em>{activeChat.type === 'group' ? 'Mina is typing' : 'Typing'}...</em></div>
          <button className="scroll-bottom" aria-label="Scroll to latest"><ArrowDown size={17}/></button>
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <button type="button" className="icon-button attach-button" aria-label="Attach file"><Paperclip size={19}/></button>
          <div className="composer-input">
            <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={`Message ${activeChat.type === 'group' ? 'the group' : activeChat.name}...`} />
            <button type="button" className="icon-button emoji-button" aria-label="Emoji"><Smile size={19}/></button>
          </div>
          <button type="button" className="icon-button mic-button" aria-label="Voice message"><Mic size={19}/></button>
          <button type="submit" className="send-button" aria-label="Send message"><Send size={17}/></button>
        </form>
        <div className="composer-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for a new line</div>
      </section>

      {showDetails && <aside className="details-panel">
        <div className="details-header"><strong>Conversation info</strong><button className="icon-button" onClick={() => setShowDetails(false)}><X size={18}/></button></div>
        <div className="details-profile"><Avatar chat={activeChat}/><h3>{activeChat.name}</h3><p>{activeChat.type === 'group' ? activeChat.members : 'Private conversation'}</p></div>
        <div className="details-actions"><button><Bell size={17}/> Notifications</button><button><Pin size={17}/> Pinned messages</button></div>
        <div className="details-section"><span>SHARED MEDIA</span><div className="media-placeholders"><div><Image size={20}/></div><div><FileText size={20}/></div><div><Paperclip size={20}/></div></div></div>
        {activeChat.type === 'group' && <div className="details-section"><span>MEMBERS · 8</span><div className="member-line"><Avatar chat={{avatar:'MN',color:'peach'}} small/><b>Mina Noor</b><small>Admin</small></div><div className="member-line"><Avatar chat={{avatar:'AR',color:'mint'}} small/><b>Arman R.</b><small>Member</small></div></div>}
      </aside>}

      {showNewChat && <div className="modal-backdrop" onClick={() => setShowNewChat(false)}>
        <div className="new-chat-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-title"><div><Sparkles size={18}/><strong>Start a conversation</strong></div><button className="icon-button" onClick={() => setShowNewChat(false)}><X size={18}/></button></div>
          <p>Choose how you want to connect on Vellora.</p>
          <button className="new-chat-option" onClick={() => setShowNewChat(false)}><div className="option-icon"><MessageCircle size={19}/></div><span><b>Private message</b><small>Have a one-to-one conversation</small></span><Plus size={17}/></button>
          <button className="new-chat-option" onClick={() => setShowNewChat(false)}><div className="option-icon group"><Users size={19}/></div><span><b>Create a group</b><small>Bring people together</small></span><Plus size={17}/></button>
        </div>
      </div>}
    </main>
  );
}



export function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(tokenStore.getAccess()));
  function handleAuthenticated() { setAuthenticated(true); }
  function handleLogout() { tokenStore.clear(); setAuthenticated(false); }
  if (!authenticated) return <AuthScreen onAuthenticated={handleAuthenticated} />;
  return <ChatApp onLogout={handleLogout} />;
}

export default App;
