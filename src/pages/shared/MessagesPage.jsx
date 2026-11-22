import React, { useState, useMemo } from 'react';
import { Send, Search, Plus } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';

export default function MessagesPage() {
  const { conversations, sendMessage, markConversationRead, startConversation } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [selectedId, setSelectedId] = useState(conversations[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('Dr. Meera Krishnan');
  const [recipientRole, setRecipientRole] = useState('Mentor · Accessibility Architect');
  const [firstMsg, setFirstMsg] = useState('');

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        !q ||
        c.participantName.toLowerCase().includes(q) ||
        c.participantRole.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const activeConv =
    conversations.find((c) => c.id === selectedId) || filteredConversations[0] || conversations[0];

  const handleSelect = (id) => {
    setSelectedId(id);
    markConversationRead(id);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!activeConv || !draft.trim()) return;
    sendMessage(activeConv.id, draft, currentUser?.name || 'UDAAN User');
    setDraft('');
  };

  const handleStartNew = (e) => {
    e.preventDefault();
    const id = startConversation({
      participantName: recipientName,
      participantRole: recipientRole,
      initialMessage: firstMsg,
      senderName: currentUser?.name || 'UDAAN User',
    });
    setSelectedId(id);
    setNewChatOpen(false);
    setFirstMsg('');
    showToast(`Conversation started with ${recipientName}`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Accessible Communication"
        title="Messages"
        description="Text-based communication across students, mentors, faculty members, and support coordinators."
        actions={
          <button type="button" onClick={() => setNewChatOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Message
          </button>
        }
      />

      <div className="card-surface overflow-hidden grid lg:grid-cols-12 min-h-[540px]">
        {/* Left Conversation List */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                aria-label="Search conversations"
                className="input-field pl-9 py-2 text-xs"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
            {filteredConversations.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              const lastMsg = conv.messages[conv.messages.length - 1];
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleSelect(conv.id)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                    isSelected
                      ? 'bg-royal-50 dark:bg-royal-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Avatar name={conv.participantName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {conv.participantName}
                      </p>
                      <span className="text-[11px] text-slate-400 shrink-0">{conv.lastActive}</span>
                    </div>
                    <p className="text-[11px] text-royal-600 dark:text-royal-400 truncate">
                      {conv.participantRole}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {lastMsg?.text || 'Start chatting...'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-royal-600 text-white text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Chat Thread */}
        <div className="lg:col-span-8 flex flex-col">
          {activeConv ? (
            <>
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Avatar name={activeConv.participantName} size="sm" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeConv.participantName}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activeConv.participantRole}</p>
                </div>
              </div>

              <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[380px] bg-slate-50/50 dark:bg-slate-950/30">
                {activeConv.messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.isOwn ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.isOwn
                          ? 'bg-royal-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {m.sender} · {m.time}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                <label htmlFor="chat-input" className="sr-only">Write a message</label>
                <input
                  id="chat-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type an accessible message..."
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary px-4">
                  <Send className="w-4 h-4" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">Select a conversation to view messages.</div>
          )}
        </div>
      </div>

      <Modal isOpen={newChatOpen} onClose={() => setNewChatOpen(false)} title="Start New Conversation">
        <form onSubmit={handleStartNew} className="space-y-4">
          <div>
            <label htmlFor="nc-rec" className="block text-sm font-semibold mb-1.5">Contact</label>
            <select
              id="nc-rec"
              value={recipientName}
              onChange={(e) => {
                const val = e.target.value;
                setRecipientName(val);
                if (val.includes('Arjun')) setRecipientRole('Mentor · Cloud Engineering');
                else if (val.includes('Ananya')) setRecipientRole('Support Coordinator');
                else if (val.includes('Rajeshwari')) setRecipientRole('Faculty · CSE');
                else setRecipientRole('Mentor · Accessibility Architect');
              }}
              className="input-field"
            >
              <option>Dr. Meera Krishnan</option>
              <option>Arjun Venkatesh</option>
              <option>Prof. Rajeshwari Kulkarni</option>
              <option>Ananya Deshmukh</option>
            </select>
          </div>
          <div>
            <label htmlFor="nc-msg" className="block text-sm font-semibold mb-1.5">Message</label>
            <textarea
              id="nc-msg"
              rows={3}
              value={firstMsg}
              onChange={(e) => setFirstMsg(e.target.value)}
              className="input-field"
              placeholder="Write your message..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNewChatOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Send Message</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
