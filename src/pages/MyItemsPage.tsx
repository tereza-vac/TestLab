import { useMemo, useState } from "react";
import { Plus, Search, Inbox } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { ItemCard } from "@/components/ItemCard";
import { useItemsStore } from "@/stores/itemsStore";

export function Component() {
  const items = useItemsStore((s) => s.order.map((id) => s.items[id]).filter(Boolean));
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) => {
      const hay = [
        it.title,
        it.question,
        it.metadata.topic,
        it.metadata.subtopic,
        ...it.options.map((o) => o.text),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [items, q]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Moje úlohy"
        description="Všechny úlohy, na kterých pracujete."
        actions={
          <Button asChild>
            <Link to="/nova-uloha">
              <Plus className="h-4 w-4" /> Nová úloha
            </Link>
          </Button>
        }
      />

      <div className="flex items-center gap-3 border-b px-8 py-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat podle názvu, tématu nebo obsahu…"
            className="pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "úloha" : "úloh"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filtered.length === 0 ? (
          <EmptyState hasItems={items.length > 0} />
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

function EmptyState({ hasItems }: { hasItems: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold">
        {hasItems ? "Nic se nenašlo" : "Zatím žádná úloha"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {hasItems
          ? "Zkuste upravit vyhledávací dotaz."
          : "Vytvořte svou první úlohu a začněte ji ihned psát v editoru."}
      </p>
      {!hasItems && (
        <Button asChild>
          <Link to="/nova-uloha">
            <Plus className="h-4 w-4" /> Vytvořit úlohu
          </Link>
        </Button>
      )}
    </div>
  );
}

export default Component;
