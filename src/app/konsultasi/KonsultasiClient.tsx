"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Search, ArrowLeft, Sparkles } from "lucide-react";
import { ustadzData, ustadzReplies, salamReply } from "@/lib/data";
import { getConversation, appendMessage } from "@/lib/storage";
import { ChatMessage } from "@/lib/types";
import Avatar from "@/components/Avatar";

export default function KonsultasiClient({
  initialUstadz,
}: {
  initialUstadz: string;
}) {
  const [activeId, setActiveId] = useState(
    initialUstadz && ustadzData.find((u) => u.id === initialUstadz)
      ? initialUstadz
      : ustadzData[0].id
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mobileChat, setMobileChat] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const activeUstadz = ustadzData.find((u) => u.id === activeId)!;

  useEffect(() => {
    const convo = getConversation(activeId);
    setMessages(convo.messages);
    setMobileChat(true);
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || typing) return;

    setInput("");
    setMessages([...appendMessage(activeId, "user", text)]);
    setTyping(true);

    try {
      // Riwayat untuk persona AI (maks 8 giliran terakhir)
      const history = messages.slice(-8).map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      const res = await fetch("/api/konsultasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ustadzId: activeId, message: text, history }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...appendMessage(activeId, "ustadz", data.reply)]);
      } else {
        // Fallback mesin lokal — demo tetap jalan tanpa LLM
        const isSalam = /assalam|asalam|salamualaikum|alaikum/i.test(text);
        const fallback = isSalam
          ? salamReply
          : ustadzReplies[
              Math.floor(Math.random() * ustadzReplies.length)
            ];
        setMessages([...appendMessage(activeId, "ustadz", fallback)]);
      }
    } catch {
      const isSalam = /assalam|asalam|salamualaikum|alaikum/i.test(text);
      const fallback = isSalam
        ? salamReply
        : ustadzReplies[Math.floor(Math.random() * ustadzReplies.length)];
      setMessages([...appendMessage(activeId, "ustadz", fallback)]);
    } finally {
      setTyping(false);
    }
  };

  const filteredList = ustadzData.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-sand-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            <MessageCircle className="h-3.5 w-3.5" />
            Konsultasi Online
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-slate-800 sm:text-3xl">
            Konsultasi Online dengan Ustadz &amp; Ustadzah
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Tanyakan langsung soal keagamaan, keluarga, atau kebutuhan acara —
            balasan mengikuti keilmuan {`ustadz/ustadzah`} yang Anda pilih.
          </p>
        </div>

        <div className="flex h-[600px] overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
          {/* Sidebar - conversation list */}
          <div
            className={`${
              mobileChat ? "hidden" : "flex"
            } w-full flex-col border-r border-sand-200 md:w-72 md:flex`}
          >
            <div className="border-b border-sand-200 p-3">
              <div className="flex items-center gap-2 rounded-lg bg-sand-50 px-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari ustadz..."
                  className="w-full bg-transparent py-2 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setActiveId(u.id)}
                  className={`flex w-full items-center gap-3 border-b border-sand-100 p-3 text-left transition-colors ${
                    u.id === activeId
                      ? "bg-primary-50"
                      : "hover:bg-sand-50"
                  }`}
                >
                  <Avatar
                    name={u.name}
                    gradient={u.avatarGradient}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">
                      {u.title} {u.name}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {u.specializations[0]}
                    </div>
                  </div>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      u.available ? "bg-green-500" : "bg-sand-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div
            className={`${
              mobileChat ? "flex" : "hidden"
            } flex-1 flex-col md:flex`}
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-sand-200 p-3">
              <button
                onClick={() => setMobileChat(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-sand-100 md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar
                name={activeUstadz.name}
                gradient={activeUstadz.avatarGradient}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-slate-800">
                  {activeUstadz.title} {activeUstadz.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      activeUstadz.available ? "bg-green-500" : "bg-sand-300"
                    }`}
                  />
                  {activeUstadz.available ? "Online" : "Offline"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-sand-50 p-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm animate-fade-in ${
                      m.sender === "user"
                        ? "rounded-br-md bg-primary-600 text-white"
                        : "rounded-bl-md bg-white text-slate-700"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`mt-1 block text-[10px] ${
                        m.sender === "user" ? "text-primary-100" : "text-slate-500"
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
              {/* Indikator mengetik */}
              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-sand-200 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pesan..."
                className="flex-1 rounded-xl bg-sand-100 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:bg-sand-300"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">
          <Sparkles className="mr-1 inline h-3 w-3 text-primary-400" />
          Konsultasi online berbantuan AI — balasan mewakili gaya &amp; keilmuan
          ustadz/ustadzah terpilih untuk demo hackathon. Untuk fatwa resmi,
          rujuk lembaga yang berwenang.
        </p>
      </div>
    </div>
  );
}
