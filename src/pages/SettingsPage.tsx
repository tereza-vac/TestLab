import { useRef, useState } from "react";
import { Upload, Trash2, FileText, Moon, Sun, Database } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useDocumentsStore } from "@/stores/documentsStore";
import { useTheme } from "@/components/theme-provider";
import { hasSupabase } from "@/lib/supabase";
import { formatRelative } from "@/lib/utils";

export function Component() {
  const docs = useDocumentsStore((s) => s.order.map((id) => s.docs[id]).filter(Boolean));
  const addDoc = useDocumentsStore((s) => s.addDoc);
  const deleteDoc = useDocumentsStore((s) => s.deleteDoc);
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (
          !file.type.startsWith("text/") &&
          !file.name.match(/\.(txt|md|csv|json)$/i)
        ) {
          toast.warning(`Přeskočeno: ${file.name}`, {
            description:
              "Zatím podporujeme textové soubory (.txt, .md, .csv, .json). PDF/DOCX přijde v další verzi.",
          });
          continue;
        }
        const content = await file.text();
        addDoc({ name: file.name, size: file.size, content });
      }
      toast.success("Dokumenty nahrány");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Nastavení"
        description="Znalostní báze, vzhled a propojení se Supabase."
      />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">
                    Znalostní báze (RAG zdroje)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Nahrajte zdrojové texty (např. Cvičebnice ZSV, autorské
                    pokyny, učebnice). RAG kontrola úloh je bude procházet a
                    hledat relevantní pasáže.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                >
                  <Upload className="h-4 w-4" />
                  Nahrát soubory
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".txt,.md,.csv,.json,text/*"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </div>

              <Separator className="my-4" />

              {docs.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Zatím žádné dokumenty. Nahrajte alespoň jeden pro využití RAG.
                </div>
              ) : (
                <ul className="flex flex-col divide-y">
                  {docs.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 py-2.5 text-sm"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate font-medium">
                        {d.name}
                      </span>
                      <Badge variant="secondary">
                        {Math.max(1, Math.round(d.size / 1024))} kB
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelative(d.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          deleteDoc(d.id);
                          toast(`Smazáno: ${d.name}`);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Database className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Připojení Supabase</CardTitle>
                  <CardDescription className="mt-1">
                    {hasSupabase ? (
                      <>Supabase je nakonfigurováno. Úlohy a RAG kontrola
                      používají edge funkce <code>validate-item</code> a
                      pgvector.</>
                    ) : (
                      <>Supabase není nakonfigurováno – aplikace běží v{" "}
                      <strong>offline režimu</strong> s localStorage. Přidejte{" "}
                      <code>VITE_SUPABASE_URL</code> a{" "}
                      <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> do{" "}
                      <code>.env</code>.</>
                    )}
                  </CardDescription>
                </div>
                <Badge variant={hasSupabase ? "success" : "warning"}>
                  {hasSupabase ? "Online" : "Offline"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Vzhled</CardTitle>
                  <CardDescription className="mt-1">
                    Přepněte mezi světlým a tmavým motivem.
                  </CardDescription>
                </div>
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                  <ThemeBtn
                    active={theme === "light"}
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-3.5 w-3.5" /> Světlý
                  </ThemeBtn>
                  <ThemeBtn
                    active={theme === "dark"}
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-3.5 w-3.5" /> Tmavý
                  </ThemeBtn>
                  <ThemeBtn
                    active={theme === "system"}
                    onClick={() => setTheme("system")}
                  >
                    Systém
                  </ThemeBtn>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ThemeBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors ${
        active
          ? "bg-background text-foreground shadow"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default Component;
