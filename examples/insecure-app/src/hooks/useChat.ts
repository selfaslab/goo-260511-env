import { useState } from "react";

/**
 * INTENTIONALLY INSECURE EXAMPLE.
 *
 * This file demonstrates the kind of mistake .env Guardian catches:
 * a client-side hook that reads a provider API key from import.meta.env.
 * The key ships to every browser as plain JS.
 */
export function useChat(): {
  messages: string[];
  ask: (q: string) => Promise<void>;
} {
  const [messages, setMessages] = useState<string[]>([]);

  async function ask(question: string): Promise<void> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: question }],
      }),
    });
    const json = (await response.json()) as { choices: { message: { content: string } }[] };
    setMessages((prev) => [...prev, json.choices[0].message.content]);
  }

  return { messages, ask };
}
