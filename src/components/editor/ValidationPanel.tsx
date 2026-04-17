import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  Sparkles,
  XCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn, formatRelative } from "@/lib/utils";
import type {
  TestItem,
  ValidationFinding,
  ValidationReport,
  ValidationSeverity,
} from "@/types/item";
import { validateItem } from "@/services/validateItem";
import { useItemsStore } from "@/stores/itemsStore";
import { useDocumentsStore } from "@/stores/documentsStore";
import { toast } from "sonner";

export function ValidationPanel({ item }: { item: TestItem }) {
  const [loading, setLoading] = useState(false);
  const setValidation = useItemsStore((s) => s.setValidation);
  const docCount = useDocumentsStore((s) => s.order.length);

  const report = item.lastValidation;

  const run = async () => {
    setLoading(true);
    try {
      const next = await validateItem(item);
      setValidation(item.id, next);
      toast.success("Kontrola proběhla", {
        description: next.summary,
      });
    } catch (err) {
      console.error(err);
      toast.error("Kontrola selhala", {
        description: err instanceof Error ? err.message : "Neznámá chyba",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">RAG validace</h3>
        {report && (
          <span className="text-[11px] text-muted-foreground">
            {formatRelative(report.generatedAt)}
          </span>
        )}
      </div>

      <Button
        onClick={run}
        disabled={loading}
        variant="default"
        size="sm"
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? "Kontroluji…" : "Zkontrolovat úlohu"}
      </Button>

      <p className="text-xs text-muted-foreground">
        {docCount > 0
          ? `Kontroluje formální správnost a porovnává zadání proti ${docCount} nahraným dokumentům.`
          : "Nahrajte zdrojové dokumenty v Nastavení pro kontrolu věcné správnosti. Formální kontrola funguje i bez nich."}
      </p>

      {report && (
        <>
          <Separator />
          <ReportSummary report={report} />
          <div className="flex flex-col gap-2">
            {report.findings.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center">
                <ShieldCheck className="h-8 w-8 text-success" />
                <p className="text-sm font-medium">Úloha prošla kontrolou</p>
                <p className="text-xs text-muted-foreground">
                  Nenalezeny žádné problémy.
                </p>
              </div>
            ) : (
              report.findings.map((f) => <FindingCard key={f.id} finding={f} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReportSummary({ report }: { report: ValidationReport }) {
  const stats = {
    error: report.findings.filter((f) => f.severity === "error").length,
    warning: report.findings.filter((f) => f.severity === "warning").length,
    info: report.findings.filter((f) => f.severity === "info").length,
  };
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
      <p className="text-xs leading-relaxed">{report.summary}</p>
      <div className="flex flex-wrap gap-1">
        {stats.error > 0 && (
          <Badge variant="destructive">{stats.error} chyba</Badge>
        )}
        {stats.warning > 0 && (
          <Badge variant="warning">{stats.warning} upozornění</Badge>
        )}
        {stats.info > 0 && <Badge variant="secondary">{stats.info} info</Badge>}
      </div>
      {report.usedDocuments.length > 0 && (
        <div className="text-[11px] text-muted-foreground">
          Použité dokumenty: {report.usedDocuments.join(", ")}
        </div>
      )}
    </div>
  );
}

const SEVERITY_META: Record<
  ValidationSeverity,
  { icon: typeof Info; badge: string; wrap: string }
> = {
  error: {
    icon: XCircle,
    badge: "text-destructive",
    wrap: "border-destructive/40 bg-destructive/5",
  },
  warning: {
    icon: AlertTriangle,
    badge: "text-warning",
    wrap: "border-warning/40 bg-warning-soft/40",
  },
  info: {
    icon: Info,
    badge: "text-primary",
    wrap: "border-primary/30 bg-primary/5",
  },
};

function FindingCard({ finding }: { finding: ValidationFinding }) {
  const meta = SEVERITY_META[finding.severity];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        meta.wrap,
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.badge)} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-tight">{finding.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {finding.description}
          </p>
          {finding.suggestion && (
            <div className="mt-2 rounded border border-dashed border-foreground/20 bg-background/40 px-2 py-1 text-[11px]">
              <span className="font-semibold">Návrh: </span>
              {finding.suggestion}
            </div>
          )}
          {finding.sources?.map((src, i) => (
            <div
              key={i}
              className="mt-2 rounded border bg-background/60 p-2 text-[11px]"
            >
              <div className="mb-1 flex items-center gap-1 font-medium text-muted-foreground">
                <FileText className="h-3 w-3" />
                {src.documentName}
                {typeof src.similarity === "number" && (
                  <span className="ml-auto">
                    shoda {Math.round(src.similarity * 100)}%
                  </span>
                )}
              </div>
              <p className="leading-relaxed">“{src.excerpt}”</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
