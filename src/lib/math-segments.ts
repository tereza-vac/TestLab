import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Split a string into text / math segments around `$...$` and `$$...$$`.
 * Nested braces and escape sequences are respected.
 */
export function splitMathSegments(
  input: string,
): Array<{ type: "text" | "math"; value: string; display: boolean }> {
  const segments: Array<{ type: "text" | "math"; value: string; display: boolean }> = [];
  let pos = 0;

  while (pos < input.length) {
    const dd = input.indexOf("$$", pos);
    const sd = input.indexOf("$", pos);

    let delimStart = -1;
    let display = false;

    if (dd !== -1 && (sd === -1 || dd <= sd)) {
      delimStart = dd;
      display = true;
    } else if (sd !== -1) {
      delimStart = sd;
      display = false;
    }

    if (delimStart === -1) {
      segments.push({ type: "text", value: input.slice(pos), display: false });
      break;
    }

    if (delimStart > pos) {
      segments.push({
        type: "text",
        value: input.slice(pos, delimStart),
        display: false,
      });
    }

    const delimLen = display ? 2 : 1;
    const searchFrom = delimStart + delimLen;
    const endDelim = display ? "$$" : "$";

    let endPos = -1;
    let cursor = searchFrom;
    let braceLevel = 0;

    while (cursor < input.length) {
      const ch = input[cursor];
      if (ch === "\\") {
        cursor += 2;
        continue;
      }
      if (ch === "{") {
        braceLevel++;
      } else if (ch === "}") {
        braceLevel--;
      } else if (
        braceLevel <= 0 &&
        input.slice(cursor, cursor + endDelim.length) === endDelim
      ) {
        endPos = cursor;
        break;
      }
      cursor++;
    }

    if (endPos === -1) {
      segments.push({ type: "text", value: input.slice(delimStart), display: false });
      break;
    }

    segments.push({
      type: "math",
      value: input.slice(searchFrom, endPos),
      display,
    });
    pos = endPos + delimLen;
  }

  return segments;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render a mixed text+math string (with `$..$`/`$$..$$` delimiters) to HTML.
 */
export function renderMixedMath(text: string): string {
  const segments = splitMathSegments(text);
  return segments
    .map((seg) => {
      if (seg.type === "text") return escapeHtml(seg.value).replace(/\n/g, "<br/>");
      try {
        return katex.renderToString(seg.value, {
          throwOnError: false,
          displayMode: seg.display,
          strict: "ignore",
        });
      } catch {
        return escapeHtml(seg.value);
      }
    })
    .join("");
}

export function textHasMath(text: string): boolean {
  if (!text || !text.includes("$")) return false;
  return splitMathSegments(text).some((s) => s.type === "math");
}
