import { Link } from "react-router";
import {
  FilePlus2,
  FileText,
  Library,
  Sparkles,
  ClipboardList,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/ItemCard";
import { useShallow } from "zustand/react/shallow";
import { useItemsStore } from "@/stores/itemsStore";
import { useDocumentsStore } from "@/stores/documentsStore";

export function Component() {
  const items = useItemsStore(
    useShallow((s) => s.order.map((id) => s.items[id]).filter(Boolean)),
  );
  const docs = useDocumentsStore(
    useShallow((s) => s.order.map((id) => s.docs[id]).filter(Boolean)),
  );
  const recent = items.slice(0, 6);

  const stats = {
    total: items.length,
    drafts: items.filter((i) => i.status === "koncept").length,
    validated: items.filter((i) => i.lastValidation).length,
    docs: docs.length,
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Přehled"
        description="Autorský nástroj pro strukturované testové úlohy s matematikou a RAG validací."
        actions={
          <Button asChild>
            <Link to="/nova-uloha">
              <FilePlus2 className="h-4 w-4" /> Nová úloha
            </Link>
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Celkem úloh" value={stats.total} icon={FileText} />
          <StatCard label="Koncepty" value={stats.drafts} icon={FilePlus2} />
          <StatCard
            label="S kontrolou"
            value={stats.validated}
            icon={Sparkles}
          />
          <StatCard label="Zdrojů v RAG" value={stats.docs} icon={Library} />
        </div>

        <section className="mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nedávné úlohy</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/moje-ulohy">Zobrazit vše</Link>
            </Button>
          </div>

          {recent.length === 0 ? (
            <EmptyHero />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <QuickStart />
          <RagCallout />
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5 pt-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold leading-tight">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyHero() {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 p-8 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FilePlus2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <CardTitle className="mb-1 text-base">
            Pojďme vytvořit první úlohu
          </CardTitle>
          <CardDescription>
            TestLab je editor-first – po kliknutí se rovnou ocitnete v plném
            editoru úlohy s podporou matematiky a kontroly proti zdrojům.
          </CardDescription>
        </div>
        <Button asChild>
          <Link to="/nova-uloha">Vytvořit úlohu</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickStart() {
  return (
    <Card>
      <CardContent className="p-5 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">Jak začít</CardTitle>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
              <li>
                V <strong>Nastavení</strong> nahrajte zdrojové dokumenty
                (např. Cvičebnice ZSV, autorské pokyny).
              </li>
              <li>
                Vytvořte <strong>Novou úlohu</strong> – otevře se plný editor.
              </li>
              <li>
                Napište zadání, možnosti, řešení a nakonec spusťte{" "}
                <strong>RAG kontrolu</strong>.
              </li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RagCallout() {
  return (
    <Card>
      <CardContent className="p-5 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">
              Validace proti zdrojům (RAG)
            </CardTitle>
            <CardDescription className="mt-1">
              TestLab kontroluje formální správnost (typografie, dvojznačnosti,
              jednoznačnost řešení) a porovnává zadání proti nahraným
              dokumentům. Najde relevantní pasáže a upozorní na nesoulad se
              zdroji.
            </CardDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Component;
