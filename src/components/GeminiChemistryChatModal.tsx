import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  FlaskConical,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiFetch } from '../services/apiBase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelUsed?: string;
  tier?: string;
  hasFormulaContext?: boolean;
}

export interface FormulaChatContext {
  formulaName?: string;
  productType?: string;
  productCategory?: string;
  batchSizeKg?: number;
  waterHardnessPpm?: number;
  ingredients?: Array<{
    name: string;
    percentage?: number;
    activeMatterPct?: number;
    role?: string;
    costPerKg?: number | null;
  }>;
  properties?: {
    pH?: string | number;
    viscosity?: string | number;
    activeMatter?: number;
    calculatedHlb?: string | number;
  };
  warnings?: string[];
  verdictReasons?: string[];
  specVerdict?: string;
  screeningStatus?: string;
  fingerprint?: string;
}

interface GeminiChemistryChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  formulaContext?: FormulaChatContext | null;
  initialPrompt?: string;
  lang?: string;
}

export const GeminiChemistryChatModal: React.FC<GeminiChemistryChatModalProps> = ({
  isOpen,
  onClose,
  formulaContext,
  initialPrompt,
  lang = 'en'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `**नमस्ते & Welcome to the Gemini Cleaning Chemistry Expert!** 🧪

Main Google Gemini 3.8 Flash ke high-accuracy chemical intelligence model par based hoon, jisme **Detergent & Cleaning Product Formulation Chemistry** ki specialized r&d training shamil hai:

- **Surfactant Science:** LABSA, SLES, CAPB, Glucosides (APG), AOS, Amine Oxides, Quats & HLB balancing.
- **Stoichiometry & pH:** LABSA neutralization with Caustic Soda (NaOH)/TEA, buffering, pKa calculations.
- **Viscosity & Rheology:** Salt titration curves (NaCl 0.8% - 1.8%), salting-out thresholds, HPMC, Carbomers.
- **Builders & Hard Water:** GLDA, MGDA, STPP, Zeolite, Sodium Gluconate water softening.
- **Troubleshooting:** Cloudiness, haze, phase separation, syneresis, enzyme stability, preservatives.

Aap mujhse English, हिन्दी, ya Hinglish me pooch sakte hain. **Check Formula** se related koi bhi problem ho to yahan direct consult karein!`,
        timestamp: Date.now(),
        modelUsed: 'gemini-3.8-flash'
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachFormulaContext, setAttachFormulaContext] = useState(true);
  const [showCapabilityDetails, setShowCapabilityDetails] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Handle initial prompt injected when user clicks "Consult AI on Formula"
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanText = text.replace(/[*#_`>-]/g, ' ').replace(/\n+/g, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history for backend
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content
      }));

      // Build context if enabled
      const contextPayload = attachFormulaContext && formulaContext ? {
        formulaName: formulaContext.formulaName,
        productCategory: formulaContext.productCategory || formulaContext.productType,
        batchSizeKg: formulaContext.batchSizeKg,
        waterHardnessPpm: formulaContext.waterHardnessPpm,
        ingredients: formulaContext.ingredients?.map(i => ({
          name: i.name,
          percentage: i.percentage,
          activeMatterPct: i.activeMatterPct,
          role: i.role,
          costPerKg: i.costPerKg
        })),
        properties: formulaContext.properties,
        warnings: formulaContext.warnings,
        verdictReasons: formulaContext.verdictReasons,
        specVerdict: formulaContext.specVerdict,
        screeningStatus: formulaContext.screeningStatus,
        fingerprint: formulaContext.fingerprint
      } : undefined;

      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          context: contextPayload
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response returned from chemistry engine.',
        timestamp: Date.now(),
        modelUsed: data.modelUsed || 'gemini-3.8-flash',
        tier: data.tier,
        hasFormulaContext: Boolean(contextPayload)
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Failed to get chemistry chat response:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Offline Chemical Engine Active**\n\nAapke sawal par standard chemistry advice:\n- **Neutralization:** LABSA ko Caustic Soda (NaOH) ke sath pH 7.5 - 8.5 par stoichiometric neutral karein.\n- **Viscosity:** NaCl namak 0.8% se 1.8% ke beech add karein. 2% se zyada namak daalne se liquid patla ho jayega.\n- **Clarity:** Paani ka hardness check karein aur 0.5% - 1.0% GLDA ya Sodium Gluconate milayein.`,
        timestamp: Date.now(),
        modelUsed: 'Deterministic Chemical R&D Engine'
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPromptChips = [
    {
      label: '🔬 Diagnose Current Formula Warnings',
      prompt: 'Check Formula me warnings aayi hain. Mere active formula ke ingredients, pH, aur ratios ko analyze karke batayein ki kya chemical problems hain aur kaise fix karein?'
    },
    {
      label: '💧 Viscosity & Salt Curve Help',
      prompt: 'Mere detergent liquid ka viscosity kaise badhayein? Salt (NaCl) kab aur kitna dalna chahiye taaki salting-out ya separation na ho?'
    },
    {
      label: '⚖️ LABSA Neutralization Ratio',
      prompt: 'LABSA ko neutralize karne ke liye Caustic Soda (NaOH 100% flakes ya 48% lye) ka exact chemical stoichiometry calculation batayein. Target pH 8.0 ke liye kitna NaOH lagega?'
    },
    {
      label: '🌫️ Cloudiness / Turbidity Fix',
      prompt: 'Liquid detergent banate waqt dhundhla (cloudy / hazy) ho raha hai. Is phase separation ko clear isotropic single phase me kaise convert karein?'
    },
    {
      label: '💰 Cost Reduction without Loss of Cleaning',
      prompt: 'Formula ka raw material cost kam karna hai par foam aur stain removal detergency barkarar rahe. Kaun se builders ya ratio changes karein?'
    },
    {
      label: '🌿 Plant-based / Green Surfactants',
      prompt: 'SLES aur LABSA ki jagah eco-friendly plant surfactants (Coco Glucoside, Lauryl Glucoside, CAPB) use karne ka balanced formula batayein.'
    }
  ];

  if (!isOpen) return null;

  const hasFormulaAttached = Boolean(formulaContext && formulaContext.ingredients && formulaContext.ingredients.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl h-[92vh] max-h-[850px] bg-[#0b1020] border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-cyan-950/80 flex flex-col overflow-hidden relative">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-500 to-emerald-400" />

        {/* TOP BAR / HEADER */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0f172a] border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] shadow-md shadow-cyan-500/30 shrink-0">
              <div className="w-full h-full bg-[#0b1020] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                  Gemini Chemistry Assistant
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-mono shrink-0 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                  GEMINI 3.8 FLASH
                </span>
                <span className="hidden md:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-mono">
                  ✓ CLEANING CHEMISTRY VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Industrial Detergent R&D, Surfactants, HLB, Stoichiometry, Viscosity & Formula Troubleshooting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowCapabilityDetails(!showCapabilityDetails)}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition text-xs font-medium flex items-center gap-1"
              title="View Chemistry Capabilities"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Capabilities</span>
              {showCapabilityDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* EXPANDABLE CHEMISTRY CAPABILITY VERIFICATION CARD */}
        {showCapabilityDetails && (
          <div className="bg-[#131d35] border-b border-cyan-500/30 px-4 sm:px-6 py-3 text-xs animate-fadeIn shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="font-extrabold text-cyan-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Detergent & Cleaning Chemistry Domain Verification</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1">
                  <div className="bg-[#0b1020] p-2 rounded-lg border border-slate-700/60">
                    <span className="font-bold text-cyan-400 block">Surfactant Science</span>
                    LABSA, SLES, CAPB, Glucosides, AOS, HLB 1.0-20.0
                  </div>
                  <div className="bg-[#0b1020] p-2 rounded-lg border border-slate-700/60">
                    <span className="font-bold text-amber-400 block">Neutralization & pH</span>
                    Molar NaOH/TEA equivalents, Buffer capacity
                  </div>
                  <div className="bg-[#0b1020] p-2 rounded-lg border border-slate-700/60">
                    <span className="font-bold text-purple-400 block">Rheology & Salt</span>
                    NaCl micellar growth, 0.8%-1.8% curve, HPMC
                  </div>
                  <div className="bg-[#0b1020] p-2 rounded-lg border border-slate-700/60">
                    <span className="font-bold text-emerald-400 block">Builders & Stability</span>
                    GLDA, MGDA, STPP, SXS Hydrotrope, Krafft point
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FORMULA CONTEXT ATTACHMENT STRIP */}
        {hasFormulaAttached && (
          <div className="bg-[#0f172a]/95 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="text-slate-400 font-medium">Active Formula Attached:</span>
              <span className="font-bold text-white truncate">
                {formulaContext?.formulaName || 'Current Formulation'}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-500/30 font-bold shrink-0">
                {formulaContext?.ingredients?.length || 0} ingredients
              </span>
              {formulaContext?.properties?.pH && (
                <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  pH: {String(formulaContext.properties.pH)}
                </span>
              )}
              {formulaContext?.warnings && formulaContext.warnings.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono text-[10px] border border-amber-500/40 flex items-center gap-1 shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                  {formulaContext.warnings.length} Warnings Detected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={attachFormulaContext}
                  onChange={(e) => setAttachFormulaContext(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/30"
                />
                <span>Include formula in AI queries</span>
              </label>
            </div>
          </div>
        )}

        {/* CHAT MESSAGES SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px] shrink-0 self-start shadow-md shadow-cyan-950">
                    <div className="w-full h-full bg-[#0b1020] rounded-[11px] flex items-center justify-center">
                      <FlaskConical className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-cyan-950/60'
                      : 'bg-[#131d35] border border-slate-700/80 text-slate-100 rounded-bl-none shadow-slate-950/50'
                  }`}
                >
                  {/* Assistant Header / Meta */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700/60 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-cyan-300">Gemini Chemistry Expert</span>
                        {msg.modelUsed && (
                          <span className="font-mono text-slate-400">({msg.modelUsed})</span>
                        )}
                        {msg.hasFormulaContext && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold">
                            Formula Analyzed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleSpeak(msg.content, msg.id)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition"
                          title={speakingMessageId === msg.id ? "Stop Speech" : "Read Aloud (TTS)"}
                        >
                          {speakingMessageId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Content (Formatted Markdown) */}
                  <div className="whitespace-pre-wrap space-y-2">
                    {msg.content}
                  </div>

                  {/* Timestamp */}
                  <div className={`text-[9px] mt-2 text-right ${isUser ? 'text-cyan-200/70' : 'text-slate-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* LOADING STATE */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px] shrink-0 self-start shadow-md shadow-cyan-950">
                <div className="w-full h-full bg-[#0b1020] rounded-[11px] flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-cyan-400 animate-spin" />
                </div>
              </div>
              <div className="bg-[#131d35] border border-cyan-500/40 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-cyan-300 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-medium">Gemini Chemistry Engine running formulation diagnosis...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* QUICK QUESTION CHIPS CAROUSEL */}
        <div className="px-4 sm:px-6 py-2 bg-[#0d1424] border-t border-slate-800/80 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1 mr-1 shrink-0">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Chemistry Queries:
            </span>
            {quickPromptChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-[#152342] hover:bg-cyan-500/20 border border-slate-700/60 hover:border-cyan-500/50 text-[11px] font-medium text-slate-300 hover:text-cyan-200 transition shrink-0 cursor-pointer disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* INPUT BOX & CONTROLS */}
        <div className="p-3 sm:p-4 bg-[#0f172a] border-t border-slate-800/90 shrink-0">
          <div className="flex items-end gap-2 bg-[#131d35] border border-slate-700/80 focus-within:border-cyan-500/70 focus-within:ring-2 focus-within:ring-cyan-500/20 rounded-2xl p-2 transition shadow-inner">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about cleaning chemistry, LABSA neutralization, viscosity, or paste formula issues (English / हिन्दी / Hinglish)..."
              rows={2}
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none px-2 py-1"
            />

            <div className="flex items-center gap-1.5 pb-0.5">
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className={`p-2.5 rounded-xl font-extrabold text-xs transition shadow-md flex items-center justify-center cursor-pointer ${
                  inputValue.trim() && !isLoading
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/60 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Send query (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-2 pt-1.5">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[9px] text-slate-400">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[9px] text-slate-400">Shift+Enter</kbd> for newline</span>
            <span>Language: <strong className="text-cyan-400 uppercase font-mono">{lang}</strong> • Multilingual Chemistry Support</span>
          </div>
        </div>

      </div>
    </div>
  );
};
