// frontend/src/components/ChatRoom.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import OnlineUsers, { Avatar, getColor } from './OnlineUsers';

const QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🔥'];
const EMOJI_LIST = ['😀','😂','😍','🥰','😎','🤔','😴','🥳','👍','👎','❤️','🔥','💯','🎉','😢','😮','🚀','⭐','💡','🙏','👏','🤝','💪','🤣','😅','🤦','🤷','👀','✅','❌','⚡','💬'];
const MAX_CHARS = 500;

function formatTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function formatDate(ts) {
  const d = new Date(ts), today = new Date(), yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
}
function groupByDate(messages) {
  const groups = []; let cur = null;
  for (const msg of messages) {
    const label = formatDate(msg.timestamp);
    if (label !== cur) { cur = label; groups.push({ type: 'date', label, key: `d-${msg.timestamp}` }); }
    groups.push({ type: 'message', ...msg, key: msg._id || Math.random() });
  }
  return groups;
}

const CSS = `
.cr-root{display:flex;flex-direction:column;height:100vh;flex:1;background:#0c0c14;}
.cr-header{display:flex;align-items:center;justify-content:space-between;padding:13px 20px;background:#13131f;border-bottom:1px solid #252538;gap:14px;flex-shrink:0;}
.cr-room-info{display:flex;align-items:center;gap:10px;}
.cr-room-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.cr-room-name{font-size:16px;font-weight:700;color:#f1f5f9;letter-spacing:-0.3px;}
.cr-room-sub{font-size:12px;color:#64748b;margin-top:1px;}
.cr-header-right{display:flex;align-items:center;gap:10px;}
.cr-search{padding:7px 12px 7px 30px;background:#0c0c14;border:1px solid #252538;border-radius:8px;font-size:13px;font-family:'Outfit',sans-serif;color:#e2e8f0;outline:none;width:200px;transition:border-color 0.2s;}
.cr-search:focus{border-color:#f97316;}.cr-search::placeholder{color:#3a3a5c;}
.conn-badge{display:flex;align-items:center;gap:5px;font-size:12px;color:#64748b;}
.conn-dot{width:7px;height:7px;border-radius:50%;}
.cr-body{display:flex;flex:1;overflow:hidden;}
.cr-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.search-banner{padding:5px 20px;font-size:12px;color:#64748b;background:rgba(249,115,22,0.06);border-bottom:1px solid rgba(249,115,22,0.1);flex-shrink:0;}
.messages-area{flex:1;overflow-y:auto;padding:20px 18px 8px;display:flex;flex-direction:column;gap:2px;position:relative;}
.empty-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px;}
.empty-icon{font-size:44px;}.empty-text{font-size:15px;font-weight:500;color:#3a3a5c;}.empty-sub{font-size:12px;color:#252538;}
.date-sep{display:flex;align-items:center;gap:10px;margin:14px 0 6px;}
.date-sep::before,.date-sep::after{content:'';flex:1;height:1px;background:#252538;}
.date-label{font-size:10px;font-weight:700;color:#3a3a5c;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;}
.msg-row{display:flex;gap:8px;padding:2px 0;position:relative;}
.msg-row.own{flex-direction:row-reverse;}
.msg-avatar-slot{width:32px;flex-shrink:0;display:flex;align-items:flex-end;}
.msg-content-col{display:flex;flex-direction:column;max-width:65%;gap:3px;}
.msg-row.own .msg-content-col{align-items:flex-end;}
.msg-sender{font-size:11px;font-weight:700;padding:0 4px;}
.reply-preview{background:rgba(255,255,255,0.04);border-left:3px solid #f97316;border-radius:6px;padding:5px 9px;margin-bottom:3px;font-size:11px;}
.reply-preview-name{font-weight:700;color:#f97316;margin-bottom:1px;}.reply-preview-text{color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.bubble{padding:9px 13px;border-radius:15px;font-size:14px;line-height:1.55;word-break:break-word;white-space:pre-wrap;}
.bubble.own{background:linear-gradient(135deg,#c2410c,#f97316);color:white;border-bottom-right-radius:4px;}
.bubble.other{background:#1a1a2e;color:#e2e8f0;border-bottom-left-radius:4px;border:1px solid #252538;}
.bubble-meta{display:flex;align-items:center;gap:6px;margin-top:3px;padding:0 4px;}
.msg-row.own .bubble-meta{flex-direction:row-reverse;}
.bubble-time{font-size:10px;color:#3a3a5c;}
.reply-btn{background:none;border:none;color:#3a3a5c;cursor:pointer;font-size:11px;padding:0;font-family:'Outfit',sans-serif;transition:color 0.15s;}
.reply-btn:hover{color:#f97316;}
.reactions-row{display:flex;flex-wrap:wrap;gap:3px;padding:0 4px;}
.reaction-chip{display:flex;align-items:center;gap:3px;background:#1a1a2e;border:1px solid #252538;border-radius:20px;padding:2px 7px;font-size:12px;cursor:pointer;transition:border-color 0.15s,transform 0.1s;user-select:none;}
.reaction-chip:hover{border-color:#f97316;transform:scale(1.05);}.reaction-chip.mine{border-color:#f97316;background:rgba(249,115,22,0.1);}
.reaction-count{font-size:11px;color:#64748b;}
.msg-row:hover .reaction-trigger{opacity:1;}
.reaction-trigger{opacity:0;transition:opacity 0.2s;display:flex;align-items:center;gap:2px;position:absolute;top:-10px;background:#13131f;border:1px solid #252538;border-radius:20px;padding:3px 5px;box-shadow:0 4px 12px rgba(0,0,0,0.4);z-index:10;}
.msg-row.own .reaction-trigger{right:0;}.msg-row:not(.own) .reaction-trigger{left:40px;}
.reaction-btn{background:none;border:none;cursor:pointer;font-size:15px;padding:2px;border-radius:4px;transition:transform 0.1s;}
.reaction-btn:hover{transform:scale(1.3);}
.reply-bar{padding:8px 14px;background:#0c0c14;border-top:1px solid #252538;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.reply-bar-inner{border-left:3px solid #f97316;padding-left:10px;flex:1;min-width:0;}
.reply-bar-name{font-size:11px;font-weight:700;color:#f97316;}
.reply-bar-text{font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.reply-bar-close{background:none;border:none;color:#64748b;cursor:pointer;font-size:18px;padding:0;line-height:1;transition:color 0.15s;}
.reply-bar-close:hover{color:#f1f5f9;}
.typing-area{padding:6px 20px;min-height:24px;font-size:11px;color:#64748b;font-style:italic;}
.typing-dots{display:inline-flex;gap:3px;vertical-align:middle;margin-right:5px;}
.typing-dot{width:4px;height:4px;background:#64748b;border-radius:50%;animation:db 1.2s infinite;}
.typing-dot:nth-child(2){animation-delay:0.2s;}.typing-dot:nth-child(3){animation-delay:0.4s;}
@keyframes db{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}
.input-area{border-top:1px solid #252538;background:#13131f;padding:12px 14px;display:flex;gap:8px;align-items:flex-end;}
.icon-btn{background:none;border:none;color:#3a3a5c;font-size:17px;cursor:pointer;padding:4px;border-radius:6px;transition:color 0.2s,background 0.2s;line-height:1;position:relative;}
.icon-btn:hover{color:#f97316;background:rgba(249,115,22,0.08);}
.emoji-picker{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#13131f;border:1px solid #252538;border-radius:12px;padding:10px;display:grid;grid-template-columns:repeat(8,1fr);gap:3px;box-shadow:0 8px 24px rgba(0,0,0,0.5);z-index:100;width:232px;}
.emoji-opt{background:none;border:none;font-size:18px;cursor:pointer;padding:4px;border-radius:5px;transition:background 0.15s,transform 0.1s;}
.emoji-opt:hover{background:rgba(255,255,255,0.06);transform:scale(1.2);}
.chat-textarea{flex:1;background:#0c0c14;border:1px solid #252538;border-radius:10px;padding:9px 12px;font-size:14px;font-family:'Outfit',sans-serif;color:#e2e8f0;resize:none;outline:none;max-height:120px;min-height:40px;line-height:1.5;transition:border-color 0.2s;}
.chat-textarea::placeholder{color:#3a3a5c;}.chat-textarea:focus{border-color:#f97316;}.chat-textarea:disabled{opacity:0.4;cursor:not-allowed;}
.char-count{font-size:10px;color:#3a3a5c;align-self:flex-end;flex-shrink:0;margin-bottom:5px;}
.char-count.warn{color:#f97316;}.char-count.over{color:#ef4444;}
.send-btn{width:40px;height:40px;background:linear-gradient(135deg,#f97316,#ea580c);border:none;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:opacity 0.2s,transform 0.1s;font-size:16px;}
.send-btn:hover{opacity:0.9;}.send-btn:active{transform:scale(0.95);}.send-btn:disabled{opacity:0.3;cursor:not-allowed;}
.cr-sidebar{width:240px;flex-shrink:0;padding:16px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;background:#0c0c14;border-left:1px solid #252538;}
.highlight{background:rgba(249,115,22,0.25);border-radius:2px;}
.new-toast{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:#f97316;color:white;font-size:12px;font-weight:700;padding:6px 14px;border-radius:20px;cursor:pointer;box-shadow:0 4px 16px rgba(249,115,22,0.4);white-space:nowrap;z-index:20;}
@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.msg-new{animation:msgIn 0.22s ease;}
.members-card{background:#13131f;border:1px solid #252538;border-radius:14px;overflow:hidden;}
.members-title{padding:12px 16px;border-bottom:1px solid #252538;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;display:flex;align-items:center;justify-content:space-between;}
.member-row{display:flex;align-items:center;gap:8px;padding:7px 14px;transition:background 0.15s;}
.member-row:hover{background:rgba(255,255,255,0.03);}
`;

let cssAdded = false;
let sharedSocket = null;

function ChatRoom({ username, room }) {
  const isGroup = room.type === 'group';
  const groupId = room.id;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [reactions, setReactions] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [groupMembers, setGroupMembers] = useState([]);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);
  const textareaRef = useRef(null);
  const isTypingRef = useRef(false);

  if (!cssAdded) {
    const el = document.createElement('style'); el.textContent = CSS;
    document.head.appendChild(el); cssAdded = true;
  }

  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('.emoji-picker') && !e.target.closest('.icon-btn')) setShowEmojiPicker(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesAreaRef.current; if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near); if (near) setNewMsgCount(0);
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || atBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [atBottom]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const url = isGroup ? `http://localhost:5000/api/groups/${groupId}/messages` : 'http://localhost:5000/api/messages';
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setMessages(res.data); setTimeout(() => scrollToBottom(true), 100); })
      .catch(console.error);

    if (isGroup && room.group) setGroupMembers(room.group.members || []);

    // Create or reuse shared socket
    if (!sharedSocket) {
      sharedSocket = io('http://localhost:5000', { transports: ['websocket', 'polling'], reconnection: true });
    }
    socketRef.current = sharedSocket;
    const socket = sharedSocket;

    const onConnect = () => {
      setIsConnected(true);
      socket.emit('user-online', username);
      if (isGroup) socket.emit('join-group', groupId);
    };
    socket.on('connect', onConnect);
    if (socket.connected) onConnect();

    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));

    const onMsg = (msg) => {
      if (!isGroup) {
        setMessages(prev => [...prev, { ...msg, isNew: true }]);
        setAtBottom(prev => { if (!prev) setNewMsgCount(c => c + 1); return prev; });
      }
    };
    const onGroupMsg = (msg) => {
      if (isGroup && msg.groupId === groupId) {
        setMessages(prev => [...prev, { ...msg, isNew: true }]);
        setAtBottom(prev => { if (!prev) setNewMsgCount(c => c + 1); return prev; });
      }
    };
    socket.on('receive-message', onMsg);
    socket.on('receive-group-message', onGroupMsg);
    socket.on('online-users', users => setOnlineUsers(users));
    socket.on('typing', ({ username: who, isTyping: it, room: r }) => {
      const match = isGroup ? r === groupId : r === 'global';
      if (!match) return;
      setTypingUsers(prev => it ? [...prev.filter(u => u !== who), who] : prev.filter(u => u !== who));
    });
    socket.on('message-reaction', ({ messageId, reactions: updated }) => {
      setReactions(prev => ({ ...prev, [messageId]: updated }));
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('receive-message', onMsg);
      socket.off('receive-group-message', onGroupMsg);
      socket.off('disconnect'); socket.off('connect_error');
    };
  }, [username, isGroup, groupId]);

  useEffect(() => {
    const ta = textareaRef.current; if (!ta) return;
    ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [newMessage]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTypingRef.current && socketRef.current) {
      isTypingRef.current = true;
      socketRef.current.emit('typing', { username, isTyping: true, room: isGroup ? groupId : 'global' });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketRef.current?.emit('typing', { username, isTyping: false, room: isGroup ? groupId : 'global' });
    }, 1500);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || !socketRef.current || !isConnected || text.length > MAX_CHARS) return;
    clearTimeout(typingTimerRef.current); isTypingRef.current = false;
    socketRef.current.emit('typing', { username, isTyping: false, room: isGroup ? groupId : 'global' });
    if (isGroup) {
      socketRef.current.emit('send-group-message', { sender: username, groupId, content: text, replyTo: replyTo || null });
    } else {
      socketRef.current.emit('send-message', { sender: username, content: text, replyTo: replyTo || null });
    }
    setNewMessage(''); setReplyTo(null); setShowEmojiPicker(false);
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleReact = (msgId, emoji) => {
    if (isGroup) socketRef.current?.emit('react-group-message', { messageId: msgId, emoji, username, groupId });
    else socketRef.current?.emit('react-message', { messageId: msgId, emoji, username });
    setReactions(prev => {
      const r = { ...(prev[msgId] || {}) }, users = r[emoji] || [];
      r[emoji] = users.includes(username) ? users.filter(u => u !== username) : [...users, username];
      if (!r[emoji].length) delete r[emoji];
      return { ...prev, [msgId]: r };
    });
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()) || m.sender?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const grouped = groupByDate(filteredMessages);
  const charCount = newMessage.length;
  const typingLabel = typingUsers.filter(u => u !== username).slice(0, 3).join(', ');
  const roomColor = isGroup ? getColor(room.name) : '#f97316';

  return (
    <div className="cr-root">
      <header className="cr-header">
        <div className="cr-room-info">
          <div className="cr-room-icon" style={{ background: `${roomColor}18`, border: `1px solid ${roomColor}30` }}>
            {isGroup ? (room.group?.avatar || '💬') : '🌐'}
          </div>
          <div>
            <div className="cr-room-name">{room.name}</div>
            <div className="cr-room-sub">
              {isGroup ? `${room.group?.isPrivate ? '🔒 Private' : '🌐 Public'} · ${groupMembers.length} members` : `${onlineUsers.length} online`}
            </div>
          </div>
        </div>
        <div className="cr-header-right">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#3a3a5c', fontSize: 13 }}>🔍</span>
            <input className="cr-search" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="conn-badge">
            <div className="conn-dot" style={{ background: isConnected ? '#22c55e' : '#ef4444' }} />
            {isConnected ? 'Live' : 'Off'}
          </div>
          <Avatar name={username} size={28} />
        </div>
      </header>

      <div className="cr-body">
        <div className="cr-main">
          {searchQuery && <div className="search-banner">{filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''} for "{searchQuery}"</div>}

          <div className="messages-area" ref={messagesAreaRef} onScroll={handleScroll}>
            {filteredMessages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">{searchQuery ? '🔍' : isGroup ? room.group?.avatar || '💬' : '🌐'}</div>
                <div className="empty-text">{searchQuery ? 'No results' : 'No messages yet'}</div>
                <div className="empty-sub">{searchQuery ? 'Try different keywords' : 'Be the first to say something!'}</div>
              </div>
            ) : grouped.map(item => {
              if (item.type === 'date') return <div key={item.key} className="date-sep"><span className="date-label">{item.label}</span></div>;
              const isOwn = item.sender === username;
              const msgId = item._id;
              const msgReactions = reactions[msgId] || {};
              const hasReactions = Object.keys(msgReactions).length > 0;
              return (
                <div key={item.key} className={`msg-row${isOwn ? ' own' : ''}${item.isNew ? ' msg-new' : ''}`}>
                  <div className="reaction-trigger">
                    {QUICK_REACTIONS.map(e => <button key={e} className="reaction-btn" onClick={() => handleReact(msgId, e)}>{e}</button>)}
                  </div>
                  <div className="msg-avatar-slot">{!isOwn && <Avatar name={item.sender} size={28} />}</div>
                  <div className="msg-content-col">
                    {!isOwn && <span className="msg-sender" style={{ color: getColor(item.sender) }}>{item.sender}</span>}
                    {item.replyTo?.content && (
                      <div className="reply-preview">
                        <div className="reply-preview-name">{item.replyTo.sender}</div>
                        <div className="reply-preview-text">{item.replyTo.content}</div>
                      </div>
                    )}
                    <div className={`bubble ${isOwn ? 'own' : 'other'}`}>{highlightText(item.content, searchQuery)}</div>
                    <div className="bubble-meta">
                      <span className="bubble-time">{formatTime(item.timestamp)}</span>
                      <button className="reply-btn" onClick={() => setReplyTo({ sender: item.sender, content: item.content, _id: msgId })}>Reply</button>
                    </div>
                    {hasReactions && (
                      <div className="reactions-row">
                        {Object.entries(msgReactions).map(([emoji, users]) => (
                          <div key={emoji} className={`reaction-chip${users.includes(username) ? ' mine' : ''}`} onClick={() => handleReact(msgId, emoji)} title={users.join(', ')}>
                            {emoji}<span className="reaction-count">{users.length}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
            {!atBottom && newMsgCount > 0 && (
              <div className="new-toast" onClick={() => { scrollToBottom(true); setNewMsgCount(0); }}>↓ {newMsgCount} new message{newMsgCount > 1 ? 's' : ''}</div>
            )}
          </div>

          <div className="typing-area">
            {typingLabel && <><span className="typing-dots"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></span>{typingLabel} {typingUsers.filter(u => u !== username).length > 1 ? 'are' : 'is'} typing...</>}
          </div>

          {replyTo && (
            <div className="reply-bar">
              <div className="reply-bar-inner">
                <div className="reply-bar-name">Replying to {replyTo.sender}</div>
                <div className="reply-bar-text">{replyTo.content}</div>
              </div>
              <button className="reply-bar-close" onClick={() => setReplyTo(null)}>×</button>
            </div>
          )}

          <div className="input-area">
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowEmojiPicker(p => !p)}>😊</button>
              {showEmojiPicker && (
                <div className="emoji-picker">
                  {EMOJI_LIST.map(e => <button key={e} className="emoji-opt" onClick={() => { setNewMessage(p => p + e); setShowEmojiPicker(false); textareaRef.current?.focus(); }}>{e}</button>)}
                </div>
              )}
            </div>
            <textarea ref={textareaRef} className="chat-textarea"
              placeholder={isConnected ? `Message ${room.name}...` : 'Disconnected...'}
              value={newMessage} onChange={handleTyping} onKeyDown={handleKeyDown}
              disabled={!isConnected} rows={1} maxLength={MAX_CHARS + 10} />
            {newMessage.length > 0 && <span className={`char-count${charCount > MAX_CHARS * 0.85 ? charCount > MAX_CHARS ? ' over' : ' warn' : ''}`}>{charCount}/{MAX_CHARS}</span>}
            <button className="send-btn" onClick={handleSend} disabled={!isConnected || !newMessage.trim() || charCount > MAX_CHARS}>➤</button>
          </div>
        </div>

        <aside className="cr-sidebar">
          {isGroup ? (
            <div className="members-card">
              <div className="members-title">Members <span style={{ color: '#3a3a5c', fontWeight: 400 }}>{groupMembers.length}</span></div>
              <div style={{ maxHeight: 300, overflowY: 'auto', padding: '6px 0' }}>
                {groupMembers.map(m => (
                  <div key={m} className="member-row">
                    <div style={{ position: 'relative' }}>
                      <Avatar name={m} size={30} />
                      {onlineUsers.includes(m) && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, background: '#22c55e', border: '2px solid #13131f', borderRadius: '50%' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: m === username ? '#f97316' : '#e2e8f0' }}>
                        {m}{m === username ? ' (you)' : ''}
                        {room.group?.creator === m && <span style={{ fontSize: 10, color: '#f97316', marginLeft: 5, fontWeight: 700 }}>ADMIN</span>}
                      </div>
                      <div style={{ fontSize: 11, color: onlineUsers.includes(m) ? '#22c55e' : '#3a3a5c' }}>{onlineUsers.includes(m) ? 'Online' : 'Offline'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <OnlineUsers users={onlineUsers} currentUser={username} />
          )}
          <div style={{ background: '#13131f', border: '1px solid #252538', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 10 }}>Info</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.9 }}>
              <div>💬 {messages.length} messages</div>
              {isGroup ? <div>👥 {groupMembers.length} members</div> : <div>🟢 {onlineUsers.length} online</div>}
            </div>
          </div>
          <div style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.12)', borderRadius: 14, padding: 12, fontSize: 11, color: '#64748b', lineHeight: 1.8 }}>
            <div style={{ color: '#f97316', fontWeight: 700, marginBottom: 4 }}>✦ Tips</div>
            Hover message to react.<br/>Click <strong style={{ color: '#94a3b8' }}>Reply</strong> to quote.<br/><strong style={{ color: '#94a3b8' }}>Enter</strong> sends.
          </div>
        </aside>
      </div>
    </div>
  );
}

function highlightText(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? <mark key={i} className="highlight">{p}</mark> : p);
}

export default ChatRoom;