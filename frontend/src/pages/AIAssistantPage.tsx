import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore, useAQIStore } from '../store';
import { askAI } from '../services/api';
import type { AIResponse } from '../types';
import { cn } from '../utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  aiResponse?: AIResponse;
  timestamp: Date;
  isLoading?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'How is the air quality in my city today?',
  'Should my child play outside?',
  'How can I reduce indoor pollution?',
  'Suggest a low-pollution daily routine.',
  'Why is PM2.5 dangerous?',
  'Is it safe to exercise outdoors today?',
  'What changes can I make with a limited budget?',
  'How do I protect my family from smog?',
];

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', colors[priority] ?? colors.low)}>
      {priority}
    </span>
  );
}

function AIMessageCard({ aiResponse }: { aiResponse: AIResponse }) {
  return (
    <div className="space-y-3">
      {!aiResponse.isAIGenerated && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Using rule-based recommendations (AI service temporarily unavailable)</span>
        </div>
      )}

      <p className="text-sm text-gray-800 leading-relaxed">{aiResponse.summary}</p>

      {aiResponse.air_quality_context && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <strong>Air Quality Context:</strong> {aiResponse.air_quality_context}
        </div>
      )}

      {aiResponse.recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Recommendations</p>
          {aiResponse.recommendations.map((rec, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900">{rec.action}</p>
                <PriorityBadge priority={rec.priority} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{rec.reason}</p>
              {rec.benefit && (
                <p className="text-xs text-forest-700 font-medium">✓ {rec.benefit}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {aiResponse.alternatives.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Alternatives</p>
          <ul className="space-y-1">
            {aiResponse.alternatives.map((alt, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-teal-500 mt-0.5">•</span>
                {alt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {aiResponse.limitations.length > 0 && (
        <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
          <span className="font-medium">Limitations: </span>
          {aiResponse.limitations.join(' • ')}
        </div>
      )}

      <p className="text-xs text-gray-400 italic">
        These recommendations are for general guidance only and are not medical advice.
        Consult a healthcare professional for personal health concerns.
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (message.isLoading) {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-forest-100 border-2 border-forest-200 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-forest-700" />
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-xs">
          <div className="flex gap-1 items-center h-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-forest-300 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1',
          isUser
            ? 'bg-forest-700 text-white'
            : 'bg-forest-100 border-2 border-forest-200'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4 text-forest-700" />
        )}
      </div>

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-forest-700 text-white rounded-tr-sm'
            : 'bg-white border border-gray-100 rounded-tl-sm'
        )}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : message.aiResponse ? (
          <AIMessageCard aiResponse={message.aiResponse} />
        ) : (
          <p className="text-sm text-gray-800">{message.content}</p>
        )}
        <p className={cn('text-xs mt-2', isUser ? 'text-forest-200' : 'text-gray-400')}>
          {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const profile = useUserStore((s) => s.profile);
  const { currentData: aqiData } = useAQIStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '',
      aiResponse: {
        summary: `Hello${profile?.name ? `, ${profile.name}` : ''}! I'm Aireva AI, your personal air quality assistant. I can help you understand your local air quality, plan your day safely, and make healthier lifestyle choices. What would you like to know?`,
        air_quality_context: aqiData
          ? `I have access to current air quality data for ${aqiData.city} from ${aqiData.dataProvider}.`
          : 'Air quality data is not currently loaded. I\'ll provide general guidance, but for location-specific advice, please fetch your city\'s data from the Live AQI page.',
        recommendations: [],
        alternatives: [],
        limitations: ['I am not a medical professional. For health concerns, consult a doctor.'],
        isAIGenerated: true,
      },
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: `loading_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askAI(question, profile, aqiData);
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? {
                ...m,
                isLoading: false,
                aiResponse: response,
                content: response.summary,
              }
            : m
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? {
                ...m,
                isLoading: false,
                content: `I'm having trouble connecting right now. Please check that the backend is running and try again. (${errorMsg})`,
                aiResponse: undefined,
              }
            : m
        )
      );
      toast.error('AI service unavailable');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_new',
        role: 'assistant',
        content: '',
        aiResponse: {
          summary: 'Chat cleared. How can I help you today?',
          air_quality_context: '',
          recommendations: [],
          alternatives: [],
          limitations: [],
          isAIGenerated: true,
        },
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Aireva AI Assistant</h2>
            <p className="text-xs text-gray-500">Powered by Google Gemini</p>
          </div>
        </div>
        <button onClick={clearChat} className="btn-ghost text-xs flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" />
          Clear chat
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-xs text-blue-700">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          AI responses are for general guidance only. This is not medical advice. Always verify air quality data
          from official sources and consult healthcare professionals for health decisions.
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 scrollbar-hide">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="py-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-700 hover:border-forest-300 hover:text-forest-700 hover:bg-forest-50 transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about air quality, health tips, or your daily routine..."
          disabled={isLoading}
          className="input-field flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="btn-primary px-4 py-2.5 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
