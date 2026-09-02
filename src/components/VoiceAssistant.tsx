import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, X, Bot, Sparkles } from "lucide-react";

const responses: Record<string, string> = {
  hello: "Namaste! Welcome to Green Bharat. I'm your AI assistant. How can I help you today?",
  "bio coin": "Bio Coins are rewards you earn for collecting and reporting waste. 10 coins per kg! You can redeem them for electricity discounts, bus passes, and more.",
  waste: "You can report waste by going to the Report section. Upload a photo, select the waste type, enter the weight, and submit. Municipal staff will verify and credit your Bio Coins.",
  redeem: "Go to the Redeem section to exchange your Bio Coins for real rewards — government bill discounts, gift cards, and even plant a tree!",
  ranking: "City rankings are based on cleanliness scores. Your city's rank depends on community participation, waste collection, and environmental metrics.",
  help: "I can help you with: Bio Coins, waste reporting, redeeming rewards, city rankings, and connecting with climate workers. Just ask!",
  default: "That's a great question! I'm here to help you with Green Bharat. You can ask about Bio Coins, waste reporting, rewards, or city rankings.",
};

const VoiceAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Namaste! 🙏 I'm your Green Bharat AI assistant. Ask me anything about Bio Coins, waste reporting, or sustainability!" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getResponse = (query: string): string => {
    const lower = query.toLowerCase();
    for (const [key, val] of Object.entries(responses)) {
      if (key !== "default" && lower.includes(key)) return val;
    }
    return responses.default;
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  };

  const handleSend = (text?: string) => {
    const query = text || input.trim();
    if (!query) return;
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setInput("");
    setTimeout(() => {
      const reply = getResponse(query);
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
      speak(reply);
    }, 600);
  };

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setMessages((prev) => [...prev, { role: "ai", text: "Speech recognition is not supported in your browser. Please type your question instead." }]);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 gradient-hero rounded-full flex items-center justify-center shadow-elevated hover:scale-110 transition-transform ${isOpen ? "hidden" : ""}`}
      >
        <Bot size={26} className="text-primary-foreground" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-elevated border border-border flex flex-col overflow-hidden animate-fade-in" style={{ height: "480px" }}>
          <div className="gradient-hero px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary-foreground" />
              <span className="font-bold text-primary-foreground text-sm">AI Voice Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  m.role === "user" ? "gradient-hero text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-lg transition-all ${isListening ? "bg-destructive text-destructive-foreground animate-pulse-green" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about Bio Coins, waste..."
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm"
            />
            <button onClick={() => handleSend()} className="gradient-hero text-primary-foreground p-2.5 rounded-lg hover:opacity-90">
              <Volume2 size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;
