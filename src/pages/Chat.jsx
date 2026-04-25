// src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, MessageCircle, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChats, sendMessage, getChatUsers } from '../services/firestore';
import { ROUTES } from '../utils/constants';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { formatDistanceToNow } from 'date-fns';

function UserAvatar({ name, size = 'md' }) {
  const colors = ['#F9C61F', '#E84545', '#8b5cf6', '#3b82f6', '#10b981', '#f97316'];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const sz = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base';
  return (
    <div className={`${sz} rounded-xl flex items-center justify-center font-display font-bold text-white shrink-0`}
      style={{ background: colors[idx] }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function ChatList({ users, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => u.displayName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="field pl-9 text-sm py-2.5" placeholder="Search teachers..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageCircle size={32} className="text-white/20" />
            <p className="text-white/30 font-body text-sm">No teachers found</p>
          </div>
        ) : (
          filtered.map(u => (
            <button key={u.id} onClick={() => onSelect(u)}
              className="flex items-center gap-3 p-3 rounded-2xl glass-card hover:bg-white/10 active:scale-[0.98] transition-all text-left">
              <UserAvatar name={u.displayName} />
              <div className="min-w-0 flex-1">
                <p className="text-white font-display font-semibold text-sm truncate">{u.displayName || 'Unknown'}</p>
                <p className="text-white/40 text-xs font-body">{u.isATeacher ? 'Teacher' : 'Parent'}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function MessagingScreen({ chatUser, chatId, onBack }) {
  const { userId } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = getChats(chatId, setMessages);
    return unsub;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const t = text;
    setText('');
    try {
      await sendMessage(chatId, t);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen mesh-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-white/8">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/80" />
        </button>
        <UserAvatar name={chatUser.displayName} size="sm" />
        <div>
          <p className="text-white font-display font-semibold text-sm">{chatUser.displayName}</p>
          <p className="text-white/40 text-xs">{chatUser.isATeacher ? 'Teacher' : 'Parent'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.map(msg => {
          const mine = msg.senderId === userId;
          const date = msg.createdAt?.toDate?.() || new Date();
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed
                ${mine
                  ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-navy-900 rounded-br-sm'
                  : 'bg-white/8 text-white rounded-bl-sm border border-white/8'
                }`}>
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-navy-900/50' : 'text-white/30'}`}>
                  {formatDistanceToNow(date, { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 pb-safe border-t border-white/8 flex items-center gap-3">
        <input
          className="field flex-1 py-3 text-sm"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send} disabled={!text.trim() || sending}
          className="w-11 h-11 rounded-xl bg-gold-500 flex items-center justify-center disabled:opacity-40 transition-all active:scale-95">
          <Send size={18} className="text-navy-900" />
        </button>
      </div>
    </div>
  );
}

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('');
}

export default function Chat() {
  const { chatId: paramChatId } = useParams();
  const { userType, userId } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatId, setChatId] = useState(paramChatId || null);

  useEffect(() => {
    getChatUsers().then(setUsers).catch(() => {});
  }, []);

  const selectUser = (u) => {
    setSelectedUser(u);
    setChatId(getChatId(userId, u.id));
  };

  if (selectedUser && chatId) {
    return <MessagingScreen chatUser={selectedUser} chatId={chatId} onBack={() => { setSelectedUser(null); setChatId(null); }} />;
  }

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Messages" showBack />
      <div className="flex-1 overflow-y-auto pb-24">
        <ChatList users={users} onSelect={selectUser} />
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
