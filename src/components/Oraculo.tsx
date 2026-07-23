import React, { useState, useRef, useEffect } from 'react';
import { ChatEntry } from '../types';
import { MessageSquare, Send, Bot, Clock, Library, ShieldAlert, AlertCircle } from 'lucide-react';

export default function Oraculo() {
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: 'init',
      sender: 'oracle',
      message: `### 🌌 STV Gravity Engine Oráculo Initialized

I am the structural audit intelligence of Santi Vilanova's **STV Gravity Operating System**.
My neural coordinates are mapped to **AISC steel specifications, AWS welding codes, IMCA maritime procedures, and the Golden-ratio visual brand guidelines**.

How can I assist your design-engineering pipeline today? Ask me about:
*   **"Que son los tokens que se estan sumando?"** to dissect our parsing weight.
*   **"Audit steel connection specifications for AISC compatibility"** to run joint audits.
*   **"Check visual branding margins and chromatic vibrations"** to check Vilanova brand grid compliance.`,
      timestamp: new Date().toISOString()
    }
  ]);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    { label: "Que son los tokens?", query: "Que son los tokens que se estan sumando en nuestro RAG?" },
    { label: "Audit AISC Steel Specs", query: "Can you audit our A36 Wide Flange columns under AISC rules?" },
    { label: "Verify Brand Clear-Space", query: "Check if overlapping structural text on logo violates safety margin rules." }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isSending) return;

    setInput('');
    setIsSending(true);

    const userMsg: ChatEntry = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      message: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      // API call to Express full-stack Oráculo server-side route
      const response = await fetch('/api/gemini/oraculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          chatHistory: messages.slice(-6) // Send recent context for continuity
        })
      });

      if (response.ok) {
        const data = await response.json();
        const oracleMsg: ChatEntry = {
          id: `orc-${Date.now()}`,
          sender: 'oracle',
          message: data.response,
          tokensUsed: data.tokensUsed,
          thinkingTime: data.thinkingTime,
          sources: data.sources,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, oracleMsg]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed response from Oráculo.");
      }
    } catch (err: any) {
      console.error(err);
      const systemError: ChatEntry = {
        id: `sys-${Date.now()}`,
        sender: 'system',
        message: `⚠️ **System Pipeline Disconnected**: Oráculo server encountered an interruption. Under fallback procedurals:
        
        Ensure your **GEMINI_API_KEY** is configured in AI Studio Secrets panel. Operating in static parsing boundaries.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, systemError]);
    } finally {
      setIsSending(false);
    }
  };

  // Simple custom Markdown rendering to elegant styled HTML
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    return lines.map((line, idx) => {
      // 1. Headers
      if (line.startsWith('### ')) {
        inTable = false;
        return <h3 key={idx} className="text-sm font-semibold font-display text-white mt-4 mb-2 uppercase tracking-wide border-l-2 border-brand-gold pl-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        inTable = false;
        return <h4 key={idx} className="text-xs font-semibold text-brand-gold mt-3 mb-1 uppercase tracking-wider">{line.replace('#### ', '')}</h4>;
      }

      // 2. Bold emphasis
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const inlineCodeRegex = /`(.*?)`/g;

      // Handle bullet lists
      const isBullet = line.startsWith('* ') || line.startsWith('- ');
      const content = line.replace(/^[\*\-]\s+/, '');

      // Check if table row
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        
        // Skip separator line | :--- | :--- |
        if (cells.every(c => c.includes('---') || c.includes(':--'))) {
          return null;
        }

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
          return null;
        } else {
          tableRows.push(cells);
          
          // If next line is not a table line, compile the whole table
          const nextLine = lines[idx + 1];
          if (!nextLine || !nextLine.startsWith('|')) {
            inTable = false;
            const headers = [...tableHeaders];
            const rows = [...tableRows];
            tableHeaders = [];
            tableRows = [];

            return (
              <div key={idx} className="overflow-x-auto my-3 rounded-lg border border-brand-slate-light bg-brand-slate-dark/60">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-brand-slate-light/50 border-b border-brand-slate-light text-gray-400 font-semibold uppercase text-[9px]">
                      {headers.map((h, i) => <th key={i} className="p-2.5">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-slate-light/30">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-brand-slate-light/10 text-gray-300">
                        {row.map((cell, cIdx) => <td key={cIdx} className="p-2.5">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          return null;
        }
      }

      inTable = false;

      // Wrap line content
      const elementContent = (
        <span dangerouslySetInnerHTML={{
          __html: formattedLine
            .replace(boldRegex, '<strong class="text-brand-gold font-semibold">$1</strong>')
            .replace(inlineCodeRegex, '<code class="bg-brand-slate-dark px-1.5 py-0.5 rounded text-amber-400 font-mono text-[10px]">$1</code>')
        }} />
      );

      if (isBullet) {
        return <li key={idx} className="ml-4 list-disc text-xs text-gray-300 py-0.5">{elementContent}</li>;
      }

      return line.trim() === '' ? <div key={idx} className="h-2" /> : <p key={idx} className="text-xs text-gray-300 leading-relaxed mb-1.5">{elementContent}</p>;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="oraculo-tab">
      
      {/* Sidebar: Quick Prompts and Metadata */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
            Oráculo Quick Seeds
          </h3>
          <p className="text-xs text-gray-400">
            Trigger compliance queries instantly against the pipeline ruleset:
          </p>
          
          <div className="space-y-2.5">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                disabled={isSending}
                className="w-full text-left p-3 text-xs rounded-lg bg-brand-slate-dark/70 border border-brand-slate-light text-gray-300 hover:border-brand-gold/60 hover:text-white transition group"
              >
                <div className="font-semibold text-brand-gold group-hover:underline">{p.label}</div>
                <div className="text-[10px] text-gray-500 mt-1 truncate">"{p.query}"</div>
              </button>
            ))}
          </div>
        </div>

        {/* Audit Boundaries */}
        <div className="rounded-xl border border-brand-slate-light bg-brand-slate-medium p-5 space-y-3 font-mono text-[10px] text-gray-400">
          <span className="uppercase text-white font-semibold font-display tracking-wider block text-xs">
            Oráculo Bounds File
          </span>
          <div className="space-y-1.5 pt-1.5">
            <div className="flex justify-between">
              <span>● AISC Steel Construction:</span>
              <span className="text-brand-gold">Sec E, F, J compliant</span>
            </div>
            <div className="flex justify-between">
              <span>● AWS D1.1 Welding:</span>
              <span className="text-brand-gold">Table 7.2 Compliant</span>
            </div>
            <div className="flex justify-between">
              <span>● IMCA Maritime Specs:</span>
              <span className="text-brand-gold">Audited v4</span>
            </div>
            <div className="flex justify-between">
              <span>● Vilanova Brand Ratios:</span>
              <span className="text-brand-gold">1.618x margins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-3 flex flex-col h-[520px] rounded-xl border border-brand-slate-light bg-brand-slate-medium overflow-hidden">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between bg-brand-slate-dark/60 p-4 border-b border-brand-slate-light">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-brand-gold" />
            <span className="text-xs font-mono font-semibold text-white tracking-wider">
              ORACULO_SHELL_v4.2.1-LIVE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-emerald-400 uppercase">ONLINE</span>
          </div>
        </div>

        {/* Conversation Logs */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-brand-slate-dark/20">
          {messages.map((msg) => {
            const isOracle = msg.sender === 'oracle';
            const isSystem = msg.sender === 'system';
            const isUser = msg.sender === 'user';

            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Icon */}
                <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border text-xs ${
                  isUser 
                    ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' 
                    : isSystem
                    ? 'bg-red-950/20 border-red-800 text-red-500'
                    : 'bg-indigo-950/20 border-indigo-500 text-indigo-400'
                }`}>
                  {isUser ? 'U' : isSystem ? '!' : 'Ω'}
                </div>

                {/* Message Box */}
                <div className="space-y-1">
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    isUser 
                      ? 'bg-brand-gold/10 border-brand-gold/30 text-white rounded-tr-none' 
                      : isSystem
                      ? 'bg-red-950/20 border-red-900/40 text-red-400 rounded-tl-none'
                      : 'bg-brand-slate-medium border-brand-slate-light text-gray-300 rounded-tl-none shadow-md'
                  }`}>
                    {renderMarkdown(msg.message)}
                  </div>

                  {/* Telemetry info for Oracle responses */}
                  {isOracle && (msg.tokensUsed || msg.thinkingTime) && (
                    <div className="flex items-center gap-3 font-mono text-[9px] text-gray-500 px-1 pt-0.5">
                      {msg.thinkingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> Latency: {msg.thinkingTime}ms
                        </span>
                      )}
                      {msg.tokensUsed && (
                        <span className="flex items-center gap-1">
                          <Library className="h-2.5 w-2.5" /> Tokens added: {msg.tokensUsed}
                        </span>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <span className="text-brand-gold/80">
                          Grounding: {msg.sources.join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {isSending && (
            <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
              <div className="h-8 w-8 rounded-full bg-brand-slate-light border border-gray-700 flex items-center justify-center text-xs text-gray-500">
                Ω
              </div>
              <div className="p-4 rounded-xl border border-brand-slate-light bg-brand-slate-medium rounded-tl-none">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <span className="h-2 w-2 rounded-full bg-brand-gold animate-ping" />
                  Oráculo compiling neural nodes...
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 bg-brand-slate-dark/40 border-t border-brand-slate-light flex gap-2">
          <input
            type="text"
            placeholder="Query architectural welds, brand safety margins, or token equations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isSending}
            className="flex-1 text-xs bg-brand-slate-dark border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-gold"
          />
          <button
            onClick={() => handleSend()}
            disabled={isSending || !input.trim()}
            className={`p-2.5 rounded-lg text-brand-slate-dark transition ${
              isSending || !input.trim()
                ? 'bg-brand-slate-light text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-brand-gold text-brand-slate-dark hover:bg-yellow-400'
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
