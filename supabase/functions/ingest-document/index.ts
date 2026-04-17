import { corsHeaders, corsPreflight, json } from "../_shared/cors.ts";
import { embedText, hasOpenAI } from "../_shared/openai.ts";
import { createUserClient } from "../_shared/supabase.ts";

/**
 * POST /functions/v1/ingest-document
 * Body: { documentId: string, content: string }
 *
 * Splits the document's text into chunks, embeds them with OpenAI, and
 * stores them in public.document_chunks. Auth required; chunks are
 * owned by the authenticated user (enforced by RLS).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflight();

  try {
    const body = await req.json().catch(() => null);
    const documentId = body?.documentId as string | undefined;
    const content = (body?.content as string | undefined) ?? "";
    if (!documentId || !content)
      return json({ error: "documentId and content are required" }, 400);

    if (!hasOpenAI())
      return json({ error: "OPENAI_API_KEY not configured" }, 501);

    const supa = createUserClient(req);
    const {
      data: { user },
      error: userErr,
    } = await supa.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const chunks = splitIntoChunks(content, 900, 150);
    const embedded = await Promise.all(
      chunks.map(async (content, index) => ({
        document_id: documentId,
        owner_id: user.id,
        chunk_index: index,
        content,
        embedding: await embedText(content),
      })),
    );

    // Upsert — delete previous chunks for idempotency
    await supa.from("document_chunks").delete().eq("document_id", documentId);
    const { error } = await supa.from("document_chunks").insert(embedded);
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, chunks: embedded.length });
  } catch (err) {
    console.error("[ingest-document] error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

/**
 * Split text into overlapping chunks of roughly `size` characters,
 * preferring sentence boundaries.
 */
function splitIntoChunks(text: string, size: number, overlap: number): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= size) return [clean];

  const chunks: string[] = [];
  let pos = 0;
  while (pos < clean.length) {
    let end = Math.min(pos + size, clean.length);
    if (end < clean.length) {
      const boundary = clean.lastIndexOf(". ", end);
      if (boundary > pos + size / 2) end = boundary + 1;
    }
    chunks.push(clean.slice(pos, end).trim());
    if (end === clean.length) break;
    pos = Math.max(end - overlap, pos + 1);
  }
  return chunks.filter((c) => c.length > 0);
}
