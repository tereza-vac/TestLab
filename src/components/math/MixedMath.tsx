import { createElement, useMemo } from "react";
import { renderMixedMath } from "@/lib/math-segments";
import { cn } from "@/lib/utils";

type InlineTag = "div" | "span" | "p" | "section" | "article";

/**
 * Renders a string with inline `$…$` and block `$$…$$` math using KaTeX.
 * Plain text is escaped and newlines become `<br/>`.
 */
export function MixedMath({
  text,
  className,
  as = "div",
  placeholder,
}: {
  text: string;
  className?: string;
  as?: InlineTag;
  placeholder?: string;
}) {
  const html = useMemo(() => renderMixedMath(text || ""), [text]);

  if (!text && placeholder) {
    return createElement(
      as,
      { className: cn("text-muted-foreground italic", className) },
      placeholder,
    );
  }

  return createElement(as, {
    className: cn("tl-prose", className),
    dangerouslySetInnerHTML: { __html: html },
  });
}
