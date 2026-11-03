"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Shield, FileText, AlertTriangle, BookOpen } from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  action?: string;
  injectionDetected?: boolean;
}

interface TranscriptPanelProps {
  messages: ChatMessage[];
  isThinking: boolean;
}

/** Render [label](url) sebagai tautan yang bisa diklik (internal = <Link>). */
function renderWithLinks(text: string): ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!m) return <span key={i}>{part}</span>;
    const [, label, href] = m;
    const internal = href.startsWith("/");
    return internal ? (
      <Link
        key={i}
        href={href}
        className="font-semibold text-emerald-700 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-800"
      >
        {label}
      </Link>
    ) : (
      <a
        key={i}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-emerald-700 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-800"
      >
        {label}
      </a>
    );
  });
}

export default function TranscriptPanel({ messages, isThinking }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
    >
      {messages.length === 0 && !isThinking && (
        <div className="flex flex-col items-center justify-center h-full text-center py-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600 max-w-xs">
            Assalamu&apos;alaikum! Saya Asisten AI CariUstadz. Silakan tanyakan
            apa saja tentang ustadz, kajian, atau booking.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-emerald-600 text-white rounded-br-md"
                : "bg-gray-100 text-gray-800 rounded-bl-md"
            }`}
          >
            {msg.role === "assistant" && msg.action === "blocked" && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mb-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Permintaan tidak dapat diproses
              </div>
            )}
            {msg.role === "assistant" && msg.action === "dalil" && (
              <div className="flex items-center gap-1.5 text-xs text-teal-700 mb-1 font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                Dalil — Terverifikasi
              </div>
            )}
            {msg.role === "assistant" && msg.action === "booking_plan" && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-1 font-medium">
                <FileText className="w-3.5 h-3.5" />
                Rencana Undangan — Menunggu Persetujuan
              </div>
            )}
            {renderWithLinks(msg.content)}
          </div>
        </div>
      ))}

      {isThinking && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
