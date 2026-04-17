import { useMemo, useState } from "react";
import { Library } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ItemCard } from "@/components/ItemCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useItemsStore } from "@/stores/itemsStore";
import {
  DIFFICULTY_LABELS,
  ITEM_TYPE_LABELS,
  type Difficulty,
  type ItemType,
} from "@/types/item";

export function Component() {
  const items = useItemsStore((s) => s.order.map((id) => s.items[id]).filter(Boolean));
  const [topic, setTopic] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [diff, setDiff] = useState<string>("all");
  const [q, setQ] = useState("");

  const topics = useMemo(() => {
    const t = new Set<string>();
    items.forEach((i) => i.metadata.topic && t.add(i.metadata.topic));
    return [...t].sort();
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      if (topic !== "all" && it.metadata.topic !== topic) return false;
      if (type !== "all" && it.type !== type) return false;
      if (diff !== "all" && it.metadata.difficulty !== diff) return false;
      if (term) {
        const hay = [
          it.title,
          it.question,
          it.metadata.topic,
          ...it.options.map((o) => o.text),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [items, topic, type, diff, q]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Banka úloh"
        description="Sdílený katalog úloh napříč tématy s filtrováním."
      />

      <div className="flex flex-wrap items-center gap-2 border-b px-8 py-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hledat…"
          className="h-9 max-w-xs"
        />
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="h-9 w-auto min-w-[180px]">
            <SelectValue placeholder="Téma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechna témata</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-auto min-w-[200px]">
            <SelectValue placeholder="Typ úlohy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny typy</SelectItem>
            {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map((k) => (
              <SelectItem key={k} value={k}>
                {ITEM_TYPE_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={diff} onValueChange={setDiff}>
          <SelectTrigger className="h-9 w-auto min-w-[140px]">
            <SelectValue placeholder="Obtížnost" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Jakákoli obtížnost</SelectItem>
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((k) => (
              <SelectItem key={k} value={k}>
                {DIFFICULTY_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="ml-auto">
          {filtered.length} / {items.length}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filtered.length === 0 ? (
          <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
            <Library className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Banka úloh je prázdná nebo žádná úloha neodpovídá filtrům.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Component;
