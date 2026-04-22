"use client";

import { useEffect, useState } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const SESSION_KEY = "aarogyaaid.chat.session.v1";

export function useSessionChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved) as ChatMessage[];
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  const append = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const clear = () => {
    setMessages([]);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return { messages, append, clear };
}
