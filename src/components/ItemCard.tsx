import { Link } from "react-router";
import { CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MixedMath } from "@/components/math/MixedMath";
import { cn, formatRelative } from "@/lib/utils";
import {
  DIFFICULTY_LABELS,
  ITEM_TYPE_LABELS,
  type TestItem,
} from "@/types/item";

export function ItemCard({ item }: { item: TestItem }) {
  const hasErrors =
    item.lastValidation?.findings.some((f) => f.severity === "error") ?? false;
  const hasWarnings =
    item.lastValidation?.findings.some((f) => f.severity === "warning") ?? false;

  return (
    <Link
      to={`/uloha/${item.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-card hover:-translate-y-0.5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 font-semibold">
          {item.title || "(bez názvu)"}
        </h3>
        {hasErrors ? (
          <Badge variant="destructive" className="shrink-0 gap-1">
            <AlertTriangle className="h-3 w-3" /> chyba
          </Badge>
        ) : hasWarnings ? (
          <Badge variant="warning" className="shrink-0 gap-1">
            <AlertTriangle className="h-3 w-3" /> kontrolovat
          </Badge>
        ) : item.lastValidation ? (
          <Badge variant="success" className="shrink-0 gap-1">
            <CheckCircle2 className="h-3 w-3" /> ok
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0 gap-1">
            <FileText className="h-3 w-3" /> koncept
          </Badge>
        )}
      </div>

      <MixedMath
        text={item.question}
        className="line-clamp-3 text-sm text-muted-foreground"
        placeholder="(bez zadání)"
      />

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <Badge variant="outline" className="text-[10px] font-normal">
          {ITEM_TYPE_LABELS[item.type]}
        </Badge>
        {item.metadata.topic && (
          <Badge variant="secondary" className="text-[10px] font-normal">
            {item.metadata.topic}
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px] font-normal">
          {DIFFICULTY_LABELS[item.metadata.difficulty]}
        </Badge>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {formatRelative(item.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
