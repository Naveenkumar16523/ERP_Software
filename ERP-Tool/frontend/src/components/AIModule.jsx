import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2, Zap, Download } from 'lucide-react';
import { useAIConversations, useAIMessages, useSendMessage } from '../hooks/useAI';
import { useERPStore } from '../store/useERPStore';

const QUICK_PROMPTS = [
  'Summarize this month\'s financial performance',
  'Which employees have pending leave requests?',
  'Show me low stock alerts',
  'List top customers by spend',
  'How many shipments are in transit?'
];

export default function AIModule() {
  const { addToast } = useERPStore();
  const { data: conversations = [] } = useAIConversations();
  const defaultConvId = conversations[0]?.id;
  const { data: aiMessages = [] } = useAIMessages(defaultConvId);
  const sendMessage = useSendMessage();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimisticMsgs, setOptimisticMsgs] = useState([]);
  const messagesEndRef = useRef(null);

  const displayMessages = [...aiMessages, ...optimisticMsgs];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  useEffect(() => {
    // Clear optimistic msgs when real data arrives
    if (aiMessages.length > 0) {
      setOptimisticMsgs([]);
    }
  }, [aiMessages]);

  const handleSend = async (msg) => {
    const text = msg || input.trim();
    if (!text) return;
    
    // Optimistically update UI
    setOptimisticMsgs(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    
    try {
      await sendMessage.mutateAsync({ content: text, conversationId: defaultConvId });
    } catch (err) {
      addToast('Failed to send message to AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportChat = () => {
    if (displayMessages.length === 0) return addToast('No chat history to export', 'error');
    const text = displayMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Chat exported successfully', 'success');
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-4 animate-fade-up">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-main">AI Companion</h1>
          <p className="text-xs text-dimmed">Powered by LOGICORE Intelligence</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={handleExportChat} className="flex items-center gap-1.5 text-xs text-muted hover:text-main bg-surface border border-main px-3 py-1 rounded-full transition-colors">
            <Download className="w-3 h-3" /> Export Chat
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-medium">
            <Zap className="w-3 h-3 animate-pulse" /> Online
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      {displayMessages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => handleSend(p)}
              className="text-xs bg-surface border border-main text-muted hover:text-main hover:bg-surface-elevated px-3 py-1.5 rounded-full transition-colors">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 min-h-0 max-h-[60vh]">
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Bot className="w-10 h-10 text-muted/20 mb-2" />
            <p className="text-sm text-muted">Ask me anything about your business data</p>
          </div>
        )}
        {displayMessages.map((m, i) => (
          <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gradient-to-br from-cyan-500 to-violet-600 text-white'}`}>
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'theme-card border border-main text-muted rounded-tl-none shadow-sm bg-surface/30'}`}>
              {m.content.split('\n').map((line, li) => (
                <p key={li} className={line.startsWith('**') ? 'font-semibold text-main' : 'text-muted'} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="theme-card border border-main px-4 py-3 rounded-xl rounded-tl-none bg-surface/30">
              <div className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 text-muted animate-spin" /><span className="text-xs text-dimmed">Analyzing your data...</span></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about your business data..."
          className="form-input flex-1 text-sm w-full"
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || loading}
          className="btn-primary px-4 flex items-center gap-1.5 disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}