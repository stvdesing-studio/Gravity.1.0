import React, { useState, useRef, useEffect } from 'react';
import { ChatEntry } from '../types';
import { MessageSquare, Send, Bot, Clock, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';

interface HubOraculoProps {
  onAddLog: (newLog: any) => void;
  neuralPath?: string;
}

export default function HubOraculo({ onAddLog, neuralPath = 'balanced-equilibrium' }: HubOraculoProps) {
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

  // Sync with active descending path
  useEffect(() => {
    if (neuralPath === 'steel-overload') {
      setInput("Can you audit our A36 Wide Flange columns under AISC rules?");
    } else if (neuralPath === 'brand-expression') {
      setInput("Check if overlapping structural text on logo violates safety margin rules.");
    } else if (neuralPath === 'profit-maximization') {
      setInput("Check if our current dynamic pricing model exceeds the 35% margin floor.");
    } else {
      setInput("Que son los tokens que se estan sumando en nuestro RAG?");
    }
  }, [neuralPath]);

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
      const response = await fetch('/api/gemini/oraculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          chatHistory: messages.slice(-6)
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
        
        // Add log entry to the main dashboard stream
        onAddLog({
          id: `log-orc-${Date.now()}`,
          filePath: `Oráculo Inquiry: "${query.substring(0, 30)}..."`,
          fileSize: "System Query",
          capasReached: 9,
          status: "Completed",
          assignedNode: "structural",
          tokens: data.tokensUsed || 350,
          timestamp: new Date().toISOString()
        });
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

  // Basic custom Markdown rendering for clean visual layout inside white brutalist theme
  const renderMessageContent = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((p, idx) => {
      // Heading 3
      if (p.startsWith('### ')) {
        return (
          <h4 key={idx} className="industry-ultra-italic text-sm text-[#1A3A4B] mt-4 mb-2 border-b border-gray-200 pb-1">
            {p.replace('### ', '')}
          </h4>
        );
      }
      // Bullet list
      if (p.includes('\n* ') || p.startsWith('* ')) {
        const lines = p.split('\n');
        return (
          <ul key={idx} className="list-disc pl-5 my-2 space-y-1 text-xs font-mono text-gray-700">
            {lines.map((l, lIdx) => (
              <li key={lIdx}>{l.replace(/^\*\s+/, '').replace(/^\s*\*\s+/, '')}</li>
            ))}
          </ul>
        );
      }
      // Table
      if (p.includes('|') && p.includes('---')) {
        const lines = p.split('\n').filter(l => l.trim() !== '');
        const headers = lines[0].split('|').map(h => h.trim()).filter(h => h !== '');
        const rows = lines.slice(2).map(r => r.split('|').map(cell => cell.trim()).filter(cell => cell !== ''));
        return (
          <div key={idx} className="overflow-x-auto my-3 border border-gray-300">
            <table className="w-full text-left text-[10px] font-mono divide-y divide-gray-300">
              <thead className="bg-[#F5F5F7]">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="p-2 text-[#1A3A4B] font-bold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 text-black select-all">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      // Standard Paragraph
      return (
        <p key={idx} className="text-xs font-mono leading-relaxed text-black mb-2 whitespace-pre-wrap">
          {p}
        </p>
      );
    });
  };

  return (
    <div className="bg-[#111113] border border-[rgba(248,247,244,0.15)] p-4 rounded-none relative overflow-hidden flex flex-col h-full" id="hub-oraculo">
      {/* Dynamic Zone Delimitation */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#E5C158]" />

      <div className="mb-3">
        <span className="font-mono text-[8px] text-[#00E5FF] uppercase tracking-wider block">PHASE 04 / AI ORACLE TERMINAL</span>
        <h2 className="text-sm font-bold text-[#F8F7F4] font-display uppercase mt-0.5">
          [ EL_ORACULO_AI ]
        </h2>
      </div>

      <div className="flex flex-col gap-4 h-full min-h-0">
        
        {/* CHAT INTERACTIVE TERMINAL */}
        <div className="border border-[rgba(248,247,244,0.15)] bg-[#1A1A1E] flex flex-col justify-between h-[340px] rounded-sm">
          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => {
              const isOracle = msg.sender === 'oracle';
              const isSystem = msg.sender === 'system';
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOracle ? 'justify-start' : isSystem ? 'justify-center' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[90%] p-2.5 border text-[11px] rounded-sm ${
                      isOracle
                        ? 'bg-black/40 border-[#E5C158]/50 text-[#F8F7F4]'
                        : isSystem
                        ? 'bg-red-950/20 border-red-900/50 text-red-400'
                        : 'bg-cyan-950/20 border-cyan-800/40 text-[#00E5FF]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-1 mb-1.5">
                      {isOracle ? (
                        <>
                          <Bot className="h-3 w-3 text-[#E5C158]" />
                          <span className="text-[8px] font-mono font-bold text-[#E5C158] uppercase">ORÁCULO AI</span>
                        </>
                      ) : isSystem ? (
                        <>
                          <AlertCircle className="h-3 w-3 text-red-500 animate-pulse" />
                          <span className="text-[8px] font-mono font-bold text-red-500 uppercase">SYSTEM EMERGENCY</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase">OPERATOR</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-1 text-[11px]">
                      {renderMessageContent(msg.message)}
                    </div>

                    {isOracle && (msg.tokensUsed || msg.thinkingTime) && (
                      <div className="flex gap-2 text-[7px] font-mono text-gray-400 mt-2 pt-1 border-t border-white/5">
                        {msg.thinkingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-2 w-2" /> Think: {msg.thinkingTime}ms
                          </span>
                        )}
                        {msg.tokensUsed && (
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-2 w-2 text-[#00E5FF]" /> Weight: {msg.tokensUsed} tokens
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* User Input controls */}
          <div className="p-2 border-t border-[rgba(248,247,244,0.15)] bg-black/60 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask El Oráculo..."
              disabled={isSending}
              className="flex-1 bg-[#111113] border border-[rgba(248,247,244,0.15)] px-2 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-[#00E5FF] disabled:bg-gray-900"
            />
            <button
              onClick={() => handleSend()}
              disabled={isSending || !input.trim()}
              className="bg-[#00E5FF] hover:bg-[#00E5FF]/85 text-black disabled:bg-gray-800 disabled:text-gray-600 px-3 py-1.5 font-mono font-bold text-[10px] uppercase transition flex items-center gap-1 cursor-pointer"
            >
              <Send className="h-2.5 w-2.5" /> SEND
            </button>
          </div>
        </div>

        {/* QUICK DIRECTIVES CHIPS */}
        <div className="border border-[rgba(248,247,244,0.15)] p-3 bg-black/20">
          <div className="space-y-2">
            <h3 className="font-mono text-[9px] text-[#E5C158] border-b border-[rgba(248,247,244,0.1)] pb-1 flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-[#E5C158]" /> Quick Directives
            </h3>
            
            <div className="grid grid-cols-1 gap-1">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.query)}
                  disabled={isSending}
                  className="w-full text-left bg-black/40 border border-[rgba(248,247,244,0.15)] hover:border-[#00E5FF] p-2 text-[10px] font-mono text-white hover:bg-white/5 transition block cursor-pointer"
                >
                  <div className="font-bold text-cyan-400 mb-0.5 uppercase tracking-wide text-[8px]">PRESET DIRECTIVE 0{idx+1}</div>
                  <div className="text-gray-300 truncate">{p.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
