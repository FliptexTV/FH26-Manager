import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { subscribeToMessages, sendMessage, deleteMessage, UserData } from '../services/playerService';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { User } from 'firebase/auth';

interface ChatViewProps {
  user: User;
  userData: UserData | null;
  isAdmin: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ user, userData, isAdmin }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(setMessages);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const username = userData?.username || user.displayName || 'Spieler';
    await sendMessage(newMessage.trim(), user.uid, username, user.photoURL || undefined);
    setNewMessage('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Nachricht wirklich löschen?')) {
      await deleteMessage(id);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] max-w-4xl mx-auto bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3">
        <MessageSquare className="text-green-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Community Chat</h2>
          <p className="text-xs text-slate-400">Tausche dich mit anderen Managern aus</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">Noch keine Nachrichten. Schreib die erste!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === user.uid;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
                <img 
                  src={msg.photoURL || 'https://via.placeholder.com/40'} 
                  alt={msg.username} 
                  className="w-8 h-8 rounded-full border border-slate-700 shrink-0"
                />
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400">{msg.username}</span>
                    <span className="text-[10px] text-slate-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-green-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(msg.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-2 transition self-center"
                    title="Nachricht löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Schreibe eine Nachricht..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition"
          maxLength={500}
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatView;
