import React, { useState } from "react";
import { climateWorkers, sampleChats, ChatMessage, ClimateWorker } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/PageHeader";
import { MessageCircle, Send, Award, Circle, ArrowLeft, Users } from "lucide-react";

const badgeColor = { Gold: "text-coin bg-coin/15", Silver: "text-muted-foreground bg-muted", Bronze: "text-warning bg-warning/15" };

const AwarenessPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedWorker, setSelectedWorker] = useState<ClimateWorker | null>(null);
  const [chats, setChats] = useState(sampleChats);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim() || !selectedWorker) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: "user",
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChats((prev) => ({
      ...prev,
      [selectedWorker.id]: [...(prev[selectedWorker.id] || []), newMsg],
    }));
    setInput("");

    // Simulated auto-reply
    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: selectedWorker.id,
        text: getAutoReply(input.trim()),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChats((prev) => ({
        ...prev,
        [selectedWorker.id]: [...(prev[selectedWorker.id] || []), reply],
      }));
    }, 1500);
  };

  const getAutoReply = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes("waste") || lower.includes("recycle")) return "Great question! Proper waste segregation is the foundation of recycling. Always separate wet, dry, and hazardous waste. 🌱";
    if (lower.includes("climate")) return "Climate change is real and urgent. Every small action counts — from reducing plastic use to planting trees. Together we can make a difference! 🌍";
    if (lower.includes("hello") || lower.includes("hi")) return "Hello! Welcome to the Green Bharat community. How can I help you with sustainability today? 💚";
    return "That's a thoughtful question! I'd recommend starting with small changes in your daily routine. Every action towards sustainability matters. Keep earning those Bio Coins! 🪙";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="Awareness Hub" subtitle="Connect with climate change workers" />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden flex h-[calc(100vh-180px)] min-h-[500px]">
          {/* Worker List */}
          <div className={`w-full sm:w-80 border-r border-border flex-shrink-0 flex flex-col ${selectedWorker ? "hidden sm:flex" : "flex"}`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-bold flex items-center gap-2">
                <Users size={18} className="text-primary" /> Climate Workers
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Chat with verified awareness badge holders</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {climateWorkers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWorker(w)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b border-border ${selectedWorker?.id === w.id ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {w.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      {w.online && <Circle size={10} fill="hsl(152,55%,34%)" className="text-success absolute -bottom-0.5 -right-0.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{w.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${badgeColor[w.badge]}`}>
                          <Award size={10} /> {w.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{w.role}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedWorker ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button onClick={() => setSelectedWorker(null)} className="sm:hidden text-muted-foreground">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-xs">
                  {selectedWorker.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedWorker.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedWorker.online ? "Online" : "Offline"}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground bg-muted inline-block px-3 py-1 rounded-full">{selectedWorker.bio}</p>
                </div>
                {(chats[selectedWorker.id] || []).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.senderId === "user"
                        ? "gradient-hero text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.senderId === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message about climate issues..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm"
                  />
                  <button onClick={sendMessage} className="gradient-hero text-primary-foreground p-2.5 rounded-lg hover:opacity-90 transition-opacity">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden sm:flex items-center justify-center text-center p-8">
              <div>
                <MessageCircle size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Select a climate worker to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AwarenessPage;
