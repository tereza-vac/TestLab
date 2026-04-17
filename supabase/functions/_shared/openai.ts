const OPENAI_BASE = "https://api.openai.com/v1";

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const EMBEDDING_MODEL =
  Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";
const CHAT_MODEL = Deno.env.get("OPENAI_CHAT_MODEL") ?? "gpt-4o-mini";

export function hasOpenAI(): boolean {
  return OPENAI_KEY.length > 0;
}

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(`${OPENAI_BASE}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.data[0].embedding as number[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatJson<T>(
  messages: ChatMessage[],
  schemaName: string,
): Promise<T> {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI chat failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content)
    throw new Error(`OpenAI chat returned empty content (schema: ${schemaName})`);
  try {
    return JSON.parse(content) as T;
  } catch (err) {
    throw new Error(
      `OpenAI chat returned invalid JSON (schema: ${schemaName}): ${err}`,
    );
  }
}
