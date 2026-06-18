import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Send, Dumbbell } from 'lucide-react';

export default function AICoach() {
  const [messages, setMessages] = useState([
    { text: "Hey there! I'm your FitTrack AI Coach. Ask me anything about your logged nutrition or workouts!", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Automatically scroll chat window downwards as new texts stream in
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { text: userMessage, isBot: false }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat/coach`, {
        message: userMessage
      });

      setMessages((prev) => [...prev, { text: response.data.response, isBot: true }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { text: "Coach processing failed. Please check your backend logs or try again.", isBot: true, isError: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Banner */}
      <div className="bg-gray-850 p-4 border-b border-gray-800 flex items-center gap-3">
        <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
          <Dumbbell className="text-emerald-400 w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">FitTrack AI Coach</h3>
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected to Live Database Context
          </p>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-950">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-md
              ${msg.isBot 
                ? msg.isError ? 'bg-red-950/40 border border-red-900/50 text-red-300' : 'bg-gray-800 border border-gray-700/60 text-gray-100' 
                : 'bg-emerald-500 text-gray-950 font-medium'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700/60 px-4 py-3 rounded-2xl flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Action Form */}
      <form onSubmit={handleSend} className="p-4 bg-gray-850 border-t border-gray-800 flex gap-3 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your metrics (e.g., 'What was my highest bench press weight?')"
          className="flex-grow bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition text-sm"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-gray-950 p-3 rounded-xl transition shadow-lg shadow-emerald-500/10"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}