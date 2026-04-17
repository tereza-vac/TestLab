import {
  type TestItem,
  type ValidationReport,
  type ValidationFinding,
} from "@/types/item";
import { hasSupabase, invokeEdgeFunction } from "@/lib/supabase";
import { useDocumentsStore } from "@/stores/documentsStore";

/**
 * Validate a test item against the knowledge base using RAG.
 *
 * - If a Supabase backend is configured, calls the `validate-item` edge
 *   function which runs pgvector retrieval + LLM analysis.
 * - Otherwise falls back to a local heuristic analyzer that scans the
 *   document text in the browser for the most relevant sentences and
 *   runs rule-based checks. This keeps the demo flow fully functional
 *   without any backend.
 */
export async function validateItem(item: TestItem): Promise<ValidationReport> {
  if (hasSupabase) {
    try {
      return await invokeEdgeFunction<ValidationReport>("validate-item", {
        item,
      });
    } catch (err) {
      console.warn(
        "[validateItem] Edge function failed, falling back to local analysis.",
        err,
      );
    }
  }
  return localAnalysis(item);
}

function localAnalysis(item: TestItem): ValidationReport {
  const findings: ValidationFinding[] = [];
  const docs = useDocumentsStore.getState().list();

  if (!item.question.trim()) {
    findings.push({
      id: randomId(),
      severity: "error",
      title: "Chybí zadání",
      description: "Úloha nemá vyplněné zadání – studentovi se nezobrazí žádný text.",
      target: "question",
    });
  }

  const nonEmpty = item.options.filter((o) => o.text.trim());
  if (item.type !== "otevrena" && nonEmpty.length < 2) {
    findings.push({
      id: randomId(),
      severity: "error",
      title: "Málo možností",
      description: "Úloha potřebuje alespoň 2 vyplněné odpovědi.",
      target: "option",
    });
  }

  const correct = item.options.filter((o) => o.isCorrect);
  if (item.type === "vyber-z-moznosti" && correct.length !== 1) {
    findings.push({
      id: randomId(),
      severity: "error",
      title: "Přesně jedna správná odpověď",
      description:
        "Typ „Výběr z možností (1 správná)“ musí mít právě jednu správnou odpověď.",
      target: "option",
      suggestion: "Zkontrolujte zaškrtnutí správné odpovědi.",
    });
  }
  if (item.type === "vice-spravnych" && correct.length < 2) {
    findings.push({
      id: randomId(),
      severity: "warning",
      title: "Více správných odpovědí",
      description:
        "Typ „Výběr z možností (více správných)“ by měl mít alespoň 2 správné odpovědi.",
      target: "option",
    });
  }

  item.options.forEach((o, idx) => {
    const letter = String.fromCharCode(65 + idx);
    if (!o.text.trim()) return;
    if (/^[a-zA-Z]/.test(o.text) && /[A-Z]/.test(o.text.charAt(0))) {
      const ends = o.text.trim().slice(-1);
      const isSentenceLike = /\s/.test(o.text.trim()) && o.text.trim().split(/\s+/).length > 3;
      if (isSentenceLike && ends !== "." && ends !== "!" && ends !== "?") {
        findings.push({
          id: randomId(),
          severity: "warning",
          title: `Možnost (${letter}): chybí tečka`,
          description:
            "Celá věta jako možnost by měla končit tečkou nebo jiným interpunkčním znaménkem.",
          target: "option",
          optionId: o.id,
          suggestion: `${o.text.trim()}.`,
        });
      }
    }
  });

  if (!item.solution.trim()) {
    findings.push({
      id: randomId(),
      severity: "info",
      title: "Doplňte řešení",
      description:
        "Popsaná správná úvaha / řešení pomáhá autorům i reviewerům pochopit záměr úlohy.",
      target: "solution",
    });
  }

  if (!item.metadata.topic.trim()) {
    findings.push({
      id: randomId(),
      severity: "info",
      title: "Chybí téma",
      description:
        "Vyplňte téma v metadatech – usnadní to třídění v bance úloh a kontrolu RAG.",
      target: "metadata",
    });
  }

  // Retrieve likely relevant excerpts from knowledge documents
  const sources = retrieveRelevant(item, docs, 3);
  sources.forEach((src, idx) => {
    findings.push({
      id: randomId(),
      severity: "info",
      title: `Relevantní pasáž #${idx + 1}: ${src.documentName}`,
      description:
        "RAG našel pasáž v knowledge base, která tematicky odpovídá úloze. Zkontrolujte, zda je zadání faktograficky v souladu se zdrojem.",
      target: "global",
      sources: [src],
    });
  });

  const summary = buildSummary(findings, docs.length);

  return {
    itemId: item.id,
    generatedAt: new Date().toISOString(),
    model: hasSupabase ? "remote-fallback→local" : "local-heuristic",
    summary,
    findings,
    usedDocuments: docs.map((d) => d.name),
  };
}

function buildSummary(findings: ValidationFinding[], docCount: number): string {
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  if (errors === 0 && warnings === 0) {
    return docCount > 0
      ? "Úloha vypadá formálně v pořádku. Prověřte ještě faktickou správnost proti zvýrazněným pasážím."
      : "Úloha vypadá formálně v pořádku. Nahrajte zdrojové dokumenty v Nastavení pro kontrolu věcné správnosti.";
  }
  const parts: string[] = [];
  if (errors) parts.push(`${errors} chyba/chyby`);
  if (warnings) parts.push(`${warnings} upozornění`);
  return `Nalezeno ${parts.join(", ")}. Projděte seznam a opravte odpovídající místa.`;
}

function retrieveRelevant(
  item: TestItem,
  docs: Array<{ name: string; content: string }>,
  k: number,
) {
  const query = [
    item.question,
    ...item.options.map((o) => o.text),
    item.solution,
    item.metadata.topic,
    item.metadata.subtopic ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const terms = uniqTokens(query).slice(0, 30);

  const scored: Array<{
    documentName: string;
    excerpt: string;
    similarity: number;
  }> = [];

  for (const doc of docs) {
    const sentences = splitSentences(doc.content);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (t.length < 3) continue;
        if (lower.includes(t)) score += 1;
      }
      if (score > 0) {
        scored.push({
          documentName: doc.name,
          excerpt: sentence.trim().slice(0, 280),
          similarity: Math.min(1, score / Math.max(terms.length, 1)),
        });
      }
    }
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[\.!?])\s+(?=[A-ZÁ-Ž0-9])/u)
    .filter((s) => s.trim().length > 30);
}

function uniqTokens(text: string): string[] {
  const set = new Set<string>();
  text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .forEach((t) => {
      const low = t.toLowerCase();
      if (low.length > 2) set.add(low);
    });
  return [...set];
}

function randomId(): string {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
