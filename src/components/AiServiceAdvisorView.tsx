import React, { useState } from 'react';
import { api } from '../services/api';
import { ServiceCategory } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendedCategory?: ServiceCategory;
  estimatedCostRange?: string;
  urgencyLevel?: 'routine' | 'urgent' | 'emergency';
  precautionTips?: string[];
  isLiveAi?: boolean;
}

interface AiServiceAdvisorViewProps {
  customerName?: string;
  customerCity?: string;
  onSelectCategory: (category: ServiceCategory) => void;
}

export const AiServiceAdvisorView: React.FC<AiServiceAdvisorViewProps> = ({
  customerName = 'Citizen',
  customerCity = 'Mumbai',
  onSelectCategory,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${customerName}! I'm the NagrikAI Smart Service Diagnostic & Cost Advisor. Describe any appliance fault, plumbing leak, electrical issue, or home maintenance problem. I will analyze what's causing it, give you an estimated repair budget, safety precautions, and link you to verified technicians.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const examplePrompts = [
    'My split AC is running but only blowing room temperature air',
    'Main MCB trips whenever the water heater/geyser is turned on',
    'Under-sink pipe is leaking water and kitchen drain is overflowing',
    'Washing machine vibrates violently during the spin cycle',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.askAdvisor(apiMessages, {
        name: customerName,
        city: customerCity,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: res.text,
        recommendedCategory: res.recommendedCategory,
        estimatedCostRange: res.estimatedCostRange,
        urgencyLevel: res.urgencyLevel,
        precautionTips: res.precautionTips,
        isLiveAi: res.isLiveAi,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue analyzing your service problem. Please try again or select a service category directly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                AI Service Diagnostic & Cost Advisor
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                Powered by Gemini AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Accurate problem root-cause diagnostics, parts cost estimation, and instant trade matching.
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400">Target Region:</span>
            <p className="text-xs font-semibold text-white">{customerCity}</p>
          </div>
        </div>

        {/* Example prompts */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-400 mb-2">Try asking about common issues:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none space-y-3'
              }`}
            >
              <div className="whitespace-pre-line">{m.content}</div>

              {/* Diagnostic Metadata Card if provided by AI */}
              {m.role === 'assistant' && (m.recommendedCategory || m.estimatedCostRange || m.urgencyLevel) && (
                <div className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    {m.recommendedCategory && (
                      <div>
                        <span className="text-[11px] text-slate-400 block">Recommended Trade:</span>
                        <span className="font-bold text-blue-400">{m.recommendedCategory}</span>
                      </div>
                    )}

                    {m.estimatedCostRange && (
                      <div>
                        <span className="text-[11px] text-slate-400 block">Estimated Cost:</span>
                        <span className="font-bold text-emerald-400">{m.estimatedCostRange}</span>
                      </div>
                    )}

                    {m.urgencyLevel && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          m.urgencyLevel === 'emergency'
                            ? 'bg-rose-500/20 text-rose-400'
                            : m.urgencyLevel === 'urgent'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {m.urgencyLevel}
                      </span>
                    )}
                  </div>

                  {m.precautionTips && m.precautionTips.length > 0 && (
                    <div className="text-[11px] space-y-1">
                      <span className="font-semibold text-slate-300">Safety & DIY Advice:</span>
                      <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                        {m.precautionTips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.recommendedCategory && (
                    <button
                      onClick={() => onSelectCategory(m.recommendedCategory!)}
                      className="w-full mt-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition text-xs flex items-center justify-center space-x-1"
                    >
                      <span>Find Available {m.recommendedCategory} Technicians</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              <span>Analyzing problem symptoms & calculating cost estimates...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your repair or maintenance problem in detail..."
          disabled={loading}
          className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          Ask AI
        </button>
      </form>
    </div>
  );
};
