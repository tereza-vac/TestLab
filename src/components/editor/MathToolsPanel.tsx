import {
  Divide,
  Superscript,
  Radical,
  Sigma,
  Pi,
  FunctionSquare,
  Grid3x3,
  Infinity as InfinityIcon,
  Percent,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MixedMath } from "@/components/math/MixedMath";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEquationDialogStore } from "@/stores/equationDialogStore";

interface Snippet {
  id: string;
  label: string;
  icon: LucideIcon;
  latex: string;
  preview: string;
}

const SNIPPETS: Snippet[] = [
  { id: "frac", label: "Zlomek", icon: Divide, latex: "\\frac{a}{b}", preview: "\\frac{a}{b}" },
  { id: "power", label: "Mocnina", icon: Superscript, latex: "x^{n}", preview: "x^{n}" },
  { id: "sqrt", label: "Odmocnina", icon: Radical, latex: "\\sqrt{x}", preview: "\\sqrt{x}" },
  { id: "nsqrt", label: "n-tá odmocnina", icon: Radical, latex: "\\sqrt[n]{x}", preview: "\\sqrt[n]{x}" },
  { id: "integ", label: "Integrál", icon: FunctionSquare, latex: "\\int_{a}^{b} f(x)\\,dx", preview: "\\int_{a}^{b} f(x)\\,dx" },
  { id: "sum", label: "Suma", icon: Sigma, latex: "\\sum_{i=1}^{n} a_i", preview: "\\sum_{i=1}^{n} a_i" },
  { id: "prod", label: "Součin", icon: Pi, latex: "\\prod_{i=1}^{n} a_i", preview: "\\prod_{i=1}^{n} a_i" },
  { id: "lim", label: "Limita", icon: InfinityIcon, latex: "\\lim_{x\\to\\infty} f(x)", preview: "\\lim_{x\\to\\infty} f(x)" },
  { id: "matrix", label: "Matice", icon: Grid3x3, latex: "\\begin{pmatrix}a & b\\\\ c & d\\end{pmatrix}", preview: "\\begin{pmatrix}a & b\\\\ c & d\\end{pmatrix}" },
  { id: "percent", label: "Procenta", icon: Percent, latex: "\\frac{x}{100}", preview: "\\frac{x}{100}" },
];

export function MathToolsPanel({
  onInsert,
}: {
  onInsert?: (latexWithDelimiters: string) => void;
}) {
  const openEq = useEquationDialogStore((s) => s.openDialog);

  const handle = (snippet: Snippet) => {
    if (onInsert) {
      onInsert(`$${snippet.latex}$`);
      return;
    }
    openEq({
      initialLatex: snippet.latex,
      display: false,
      onSave: () => {
        /* onInsert is the primary path; dialog no-op */
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Matematické prvky</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {SNIPPETS.map((s) => (
          <Tooltip key={s.id}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-col items-center gap-1 py-2"
                onClick={() => handle(s)}
              >
                <MixedMath
                  as="span"
                  text={`$${s.preview}$`}
                  className="text-sm"
                />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {s.label}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Vložit: <code>${s.latex}$</code>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
