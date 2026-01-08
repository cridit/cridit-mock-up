import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { messages } = await request.json();
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen3:8b",
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { message: text || "Ollama request failed." },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json({ message: data?.message?.content ?? "" });
}
