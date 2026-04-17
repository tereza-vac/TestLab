import { corsHeaders, corsPreflight, json } from "../_shared/cors.ts";
import { chatJson, embedText, hasOpenAI } from "../_shared/openai.ts";
import { createUserClient } from "../_shared/supabase.ts";

interface ItemIn {
  id: string;
  title: string;
  type: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  solution: string;
  metadata: {
    topic?: string;
    subtopic?: string;
    difficulty?: string;
    grade?: string;
    points?: number;
  };
}

interface Finding {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  description: string;
  target?: "question" | "option" | "solution" | "metadata" | "global";
  optionId?: string;
  suggestion?: string;
}

/**
 * POST /functions/v1/validate-item
 * Body: { item: TestItem }
 *
 * Runs RAG validation:
 *   1. Builds a query from the item (question + options + solution).
 *   2. Retrieves the top matching document chunks via pgvector.
 *   3. Sends the retrieved context + item to an LLM asking for structured
 *      findings on formal correctness and factual consistency.
 *
 * Returns a ValidationReport.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflight();

  try {
    const body = await req.json().catch(() => null);
    const item = body?.item as ItemIn | undefined;
    if (!item) return json({ error: "item is required" }, 400);

    if (!hasOpenAI())
      return json({ error: "OPENAI_API_KEY not configured" }, 501);

    const supa = createUserClient(req);
    const {
      data: { user },
    } = await supa.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const query = buildQuery(item);
    const embedding = await embedText(query);

    const { data: matches, error: matchErr } = await supa.rpc(
      "match_document_chunks",
      {
        query_embedding: embedding,
        match_count: 5,
        p_owner_id: user.id,
      },
    );
    if (matchErr) console.error("[validate-item] match error", matchErr);

    const retrieved = (matches as Array<{
      id: string;
      document_id: string;
      document_name: string;
      content: string;
      similarity: number;
    }> | null) ?? [];

    const contextBlock = retrieved
      .map(
        (m, i) =>
          `[${i + 1}] ${m.document_name} (shoda ${Math.round(
            m.similarity * 100,
          )}%):\n${m.content}`,
      )
      .join("\n\n");

    const aiResult = await chatJson<{
      summary: string;
      findings: Finding[];
    }>(
      [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content:
            `Úloha (JSON):\n${JSON.stringify(item, null, 2)}\n\n` +
            (contextBlock
              ? `Kontext z nahraných dokumentů:\n${contextBlock}`
              : "Kontext z nahraných dokumentů: (žádné relevantní pasáže)"),
        },
      ],
      "validation-report",
    );

    const report = {
      itemId: item.id,
      generatedAt: new Date().toISOString(),
      model: Deno.env.get("OPENAI_CHAT_MODEL") ?? "gpt-4o-mini",
      summary: aiResult.summary,
      findings: aiResult.findings ?? [],
      usedDocuments: [...new Set(retrieved.map((m) => m.document_name))],
      sources: retrieved.map((m) => ({
        documentName: m.document_name,
        excerpt: m.content.slice(0, 400),
        similarity: m.similarity,
      })),
    };

    return json(report);
  } catch (err) {
    console.error("[validate-item] error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function buildQuery(item: ItemIn): string {
  const parts: string[] = [item.question];
  for (const o of item.options) parts.push(o.text);
  parts.push(item.solution);
  if (item.metadata?.topic) parts.push(item.metadata.topic);
  if (item.metadata?.subtopic) parts.push(item.metadata.subtopic);
  return parts.filter(Boolean).join("\n");
}

const SYSTEM_PROMPT = `Jsi zkušený editor testových úloh pro český vzdělávací systém
(NSZ, ZSV, matematika). Tvým úkolem je zkontrolovat úlohu z hlediska:
1) Formální správnosti (typografie, interpunkce, velká/malá písmena, překlepy,
   jednotnost formulací distraktorů, odpovídající typ úlohy).
2) Věcné správnosti — porovnej zadání a řešení s pasážemi z přiložených
   zdrojových dokumentů. Pokud je zadání v rozporu se zdrojem, uveď to.
3) Jednoznačnosti řešení. Pokud je více možných odpovědí nebo odpověď závisí
   na výkladu, upozorni na to.

Odpověz výhradně ve formátu JSON s následujícím schématem:
{
  "summary": "stručné shrnutí výsledku kontroly v češtině, 1–2 věty",
  "findings": [
    {
      "id": "náhodné krátké id",
      "severity": "error" | "warning" | "info",
      "title": "krátký nadpis v češtině",
      "description": "detailní popis nálezu v češtině",
      "target": "question" | "option" | "solution" | "metadata" | "global",
      "optionId": "id možnosti pokud se nález týká konkrétní odpovědi",
      "suggestion": "konkrétní návrh opravy v češtině (volitelné)"
    }
  ]
}

Pokud úloha nemá žádné problémy, vrať prázdné pole "findings" a odpovídající
"summary". Pokud kontext z dokumentů nestačí k rozhodnutí, uveď to jako info.`;
