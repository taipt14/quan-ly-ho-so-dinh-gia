import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, RefreshCw, FileText, AlertTriangle, Lightbulb } from 'lucide-react';
import { ValuationDossier } from '../types/dossier';

interface AiValuationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentDossier?: ValuationDossier | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AiValuationAssistant: React.FC<AiValuationAssistantProps> = ({
  isOpen,
  onClose,
  currentDossier
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là **Trợ lý AI Thẩm định giá** (ValuManager AI). Tôi có thể giúp bạn kiểm tra rủi ro pháp lý hồ sơ, gợi ý phương pháp thẩm định, viết đoạn mô tả tài sản cho báo cáo hoặc giải đáp Tiêu chuẩn Thẩm định giá Việt Nam. Bạn cần hỗ trợ gì?'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendPrompt = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          dossierContext: currentDossier || null
        })
      });

      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ **Lỗi AI:** ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Không thể kết nối tới server AI. (${err.message})` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Đánh giá rủi ro hồ sơ pháp lý bất động sản này?',
    'So sánh ưu nhược điểm phương pháp So sánh vs Chi phí?',
    'Viết đoạn mô tả vị trí tài sản chuyên nghiệp cho chứng thư?',
    'Các lưu ý khi thẩm định giá xe ô tô / phương tiện vận tải?'
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col">
      
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center space-x-1">
              <span>Trợ lý AI Thẩm định</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40">
                Gemini 3.6 Flash
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Tư vấn nghiệp vụ & Soạn thảo chứng thư</p>
          </div>
        </div>

        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Dossier Context Chip */}
      {currentDossier && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-amber-300 truncate">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">{currentDossier.code}:</span>
            <span className="truncate">{currentDossier.assetName}</span>
          </div>
        </div>
      )}

      {/* Chat Messages History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs sm:text-sm">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start space-x-2.5 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-purple-600 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none whitespace-pre-wrap'
            }`}>
              {msg.content}
            </div>

          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs p-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>AI đang phân tích và soạn thảo câu trả lời...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
          <Lightbulb className="w-3 h-3 mr-1 text-amber-400" />
          Gợi ý câu hỏi nhanh:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleSendPrompt(promptText)}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 px-2.5 py-1 rounded-lg border border-slate-700 transition text-left truncate max-w-full"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input Footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Hỏi AI về pháp lý, giá đất, phương pháp định giá..."
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
