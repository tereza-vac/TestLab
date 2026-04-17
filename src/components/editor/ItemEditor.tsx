import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Eye,
  Lightbulb,
  Pencil,
  CheckCircle2,
  BookOpen,
  Sigma,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  DIFFICULTY_LABELS,
  ITEM_TYPE_LABELS,
  type Difficulty,
  type ItemType,
  type TestItem,
  type AnswerOption,
} from "@/types/item";
import { useItemsStore } from "@/stores/itemsStore";
import { MathTextarea, type MathTextareaHandle } from "@/components/editor/MathTextarea";
import { MathToolsPanel } from "@/components/editor/MathToolsPanel";
import { ValidationPanel } from "@/components/editor/ValidationPanel";
import { MixedMath } from "@/components/math/MixedMath";
import { cn, formatRelative } from "@/lib/utils";

type View = "editor" | "student" | "solution";

export function ItemEditor({ item }: { item: TestItem }) {
  const navigate = useNavigate();
  const updateItem = useItemsStore((s) => s.updateItem);
  const deleteItem = useItemsStore((s) => s.deleteItem);
  const [view, setView] = useState<View>("editor");
  const [savedAt, setSavedAt] = useState<string>(item.updatedAt);

  const patch = (p: Partial<TestItem>) => {
    updateItem(item.id, p);
    setSavedAt(new Date().toISOString());
  };

  const mutateOption = (optionId: string, updates: Partial<AnswerOption>) => {
    const next = item.options.map((o) =>
      o.id === optionId ? { ...o, ...updates } : o,
    );
    patch({ options: next });
  };

  const addOption = () => {
    patch({
      options: [
        ...item.options,
        { id: crypto.randomUUID(), text: "", isCorrect: false },
      ],
    });
  };

  const removeOption = (id: string) => {
    patch({ options: item.options.filter((o) => o.id !== id) });
  };

  const setCorrectOption = (id: string) => {
    if (item.type === "vice-spravnych") {
      const next = item.options.map((o) =>
        o.id === id ? { ...o, isCorrect: !o.isCorrect } : o,
      );
      patch({ options: next });
    } else {
      const next = item.options.map((o) => ({
        ...o,
        isCorrect: o.id === id,
      }));
      patch({ options: next });
    }
  };

  const handleDelete = () => {
    if (confirm("Opravdu smazat tuto úlohu?")) {
      deleteItem(item.id);
      toast("Úloha byla smazána");
      navigate("/moje-ulohy");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorHeader
        item={item}
        savedAt={savedAt}
        view={view}
        onViewChange={setView}
        onBack={() => navigate(-1)}
        onDelete={handleDelete}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
          <div className="mx-auto w-full max-w-3xl flex-1 px-8 py-6">
            {view === "editor" && (
              <EditorView
                item={item}
                patch={patch}
                mutateOption={mutateOption}
                addOption={addOption}
                removeOption={removeOption}
                setCorrectOption={setCorrectOption}
              />
            )}
            {view === "student" && <StudentView item={item} />}
            {view === "solution" && <SolutionView item={item} />}
          </div>
        </section>

        <aside className="hidden h-full w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l bg-muted/30 p-5 lg:flex">
          <MathToolsPanel />
          <Separator />
          <ValidationPanel item={item} />
        </aside>
      </div>
    </div>
  );
}

function EditorHeader({
  item,
  savedAt,
  view,
  onViewChange,
  onBack,
  onDelete,
}: {
  item: TestItem;
  savedAt: string;
  view: View;
  onViewChange: (v: View) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <h1 className="truncate text-sm font-semibold">
          {item.title || "Nová úloha"}
        </h1>
        <p className="truncate text-[11px] text-muted-foreground">
          Uloženo {formatRelative(savedAt)}
          {item.metadata.topic && ` · ${item.metadata.topic}`}
        </p>
      </div>

      <Tabs value={view} onValueChange={(v) => onViewChange(v as View)}>
        <TabsList>
          <TabsTrigger value="editor" className="gap-1.5 px-2.5">
            <Pencil className="h-3.5 w-3.5" /> Editor
          </TabsTrigger>
          <TabsTrigger value="student" className="gap-1.5 px-2.5">
            <Eye className="h-3.5 w-3.5" /> Student
          </TabsTrigger>
          <TabsTrigger value="solution" className="gap-1.5 px-2.5">
            <Lightbulb className="h-3.5 w-3.5" /> Řešení
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Badge variant="success" className="hidden gap-1 sm:inline-flex">
        <Save className="h-3 w-3" /> Auto-save
      </Badge>
    </header>
  );
}

function EditorView({
  item,
  patch,
  mutateOption,
  addOption,
  removeOption,
  setCorrectOption,
}: {
  item: TestItem;
  patch: (p: Partial<TestItem>) => void;
  mutateOption: (id: string, p: Partial<AnswerOption>) => void;
  addOption: () => void;
  removeOption: (id: string) => void;
  setCorrectOption: (id: string) => void;
}) {
  const questionRef = useRef<MathTextareaHandle>(null);
  const showOptions = item.type !== "otevrena";
  const showMultiple = item.type === "vice-spravnych";

  const correctCount = useMemo(
    () => item.options.filter((o) => o.isCorrect).length,
    [item.options],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Input
          value={item.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Název úlohy"
          className="!h-12 !text-xl font-semibold !shadow-none !border-0 !px-0 focus-visible:!ring-0"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Typ úlohy</Label>
            <Select
              value={item.type}
              onValueChange={(v: ItemType) => patch({ type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ITEM_TYPE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Téma</Label>
            <Input
              value={item.metadata.topic}
              onChange={(e) =>
                patch({ metadata: { ...item.metadata, topic: e.target.value } })
              }
              placeholder="např. Kvadratické rovnice"
            />
          </div>
        </div>
      </div>

      <Separator />

      <MathTextarea
        ref={questionRef}
        label="Zadání"
        value={item.question}
        onChange={(v) => patch({ question: v })}
        rows={5}
        placeholder="Napište zadání úlohy. Matematické výrazy obalte $…$ nebo vložte tlačítkem Vzorec."
      />

      {showOptions && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Odpovědi</Label>
            <div className="flex items-center gap-2">
              {showMultiple ? (
                <Badge variant="secondary">
                  {correctCount} správných označeno
                </Badge>
              ) : (
                <Badge variant={correctCount === 1 ? "success" : "warning"}>
                  {correctCount === 1
                    ? "Správná odpověď označena"
                    : "Označte správnou odpověď"}
                </Badge>
              )}
              <Button size="sm" variant="outline" onClick={addOption}>
                <Plus className="h-4 w-4" /> Přidat
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {item.options.map((opt, idx) => (
              <OptionRow
                key={opt.id}
                option={opt}
                index={idx}
                multiple={showMultiple}
                onChange={(u) => mutateOption(opt.id, u)}
                onRemove={() => removeOption(opt.id)}
                onToggleCorrect={() => setCorrectOption(opt.id)}
              />
            ))}
          </div>
        </div>
      )}

      <Separator />

      <MathTextarea
        label="Řešení / vysvětlení"
        value={item.solution}
        onChange={(v) => patch({ solution: v })}
        rows={4}
        placeholder="Postup, vysvětlení či zdůvodnění správné odpovědi. Podporuje matematiku."
      />

      <Separator />

      <MetadataSection item={item} patch={patch} />
    </div>
  );
}

function OptionRow({
  option,
  index,
  multiple,
  onChange,
  onRemove,
  onToggleCorrect,
}: {
  option: AnswerOption;
  index: number;
  multiple: boolean;
  onChange: (u: Partial<AnswerOption>) => void;
  onRemove: () => void;
  onToggleCorrect: () => void;
}) {
  const letter = String.fromCharCode(65 + index);
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border bg-card p-3 transition-colors",
        option.isCorrect && "border-success/50 bg-success-soft/50",
      )}
    >
      <button
        type="button"
        onClick={onToggleCorrect}
        aria-pressed={option.isCorrect}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
          option.isCorrect
            ? "border-success bg-success text-success-foreground"
            : "border-border bg-background text-muted-foreground hover:border-foreground/40",
        )}
        title={
          option.isCorrect
            ? "Označeno jako správná odpověď"
            : multiple
              ? "Označit jako správnou"
              : "Nastavit jako správnou odpověď"
        }
      >
        {option.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : letter}
      </button>

      <div className="min-w-0 flex-1">
        <MathTextarea
          value={option.text}
          onChange={(v) => onChange({ text: v })}
          placeholder={`Možnost ${letter}`}
          compact
          hidePreview={!option.text.includes("$")}
        />
      </div>

      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function MetadataSection({
  item,
  patch,
}: {
  item: TestItem;
  patch: (p: Partial<TestItem>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">Metadata</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Obtížnost</Label>
          <Select
            value={item.metadata.difficulty}
            onValueChange={(v: Difficulty) =>
              patch({ metadata: { ...item.metadata, difficulty: v } })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DIFFICULTY_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Ročník / úroveň</Label>
          <Input
            value={item.metadata.grade ?? ""}
            onChange={(e) =>
              patch({ metadata: { ...item.metadata, grade: e.target.value } })
            }
            placeholder="např. SŠ, 3. ročník"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Body</Label>
          <Input
            type="number"
            min={0}
            value={item.metadata.points ?? 1}
            onChange={(e) =>
              patch({
                metadata: {
                  ...item.metadata,
                  points: Number(e.target.value) || 0,
                },
              })
            }
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Podtéma</Label>
        <Input
          value={item.metadata.subtopic ?? ""}
          onChange={(e) =>
            patch({ metadata: { ...item.metadata, subtopic: e.target.value } })
          }
          placeholder="např. diskriminant"
        />
      </div>
    </div>
  );
}

function StudentView({ item }: { item: TestItem }) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card p-8">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        Pohled studenta · {item.metadata.topic || "bez tématu"} ·{" "}
        {item.metadata.points ?? 1} b.
      </div>
      <MixedMath
        text={item.question}
        className="text-lg font-medium leading-relaxed"
        placeholder="(zadání nebylo vyplněno)"
      />
      {item.type !== "otevrena" && (
        <div className="flex flex-col gap-2">
          {item.options.map((opt, i) => (
            <div
              key={opt.id}
              className="flex gap-3 rounded-lg border bg-background p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {String.fromCharCode(65 + i)}
              </span>
              <MixedMath
                text={opt.text}
                className="pt-0.5 text-[15px]"
                placeholder="(prázdná odpověď)"
              />
            </div>
          ))}
        </div>
      )}
      {item.type === "otevrena" && (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Pole pro odpověď studenta
        </div>
      )}
    </div>
  );
}

function SolutionView({ item }: { item: TestItem }) {
  const correct = item.options.filter((o) => o.isCorrect);
  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card p-8">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lightbulb className="h-4 w-4" /> Pohled řešení
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Zadání
        </h3>
        <MixedMath
          text={item.question}
          className="text-base"
          placeholder="(bez zadání)"
        />
      </div>

      {correct.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Správná odpověď
          </h3>
          <div className="flex flex-col gap-2">
            {correct.map((o, i) => (
              <div
                key={o.id}
                className="flex items-start gap-2 rounded-lg border border-success/50 bg-success-soft/40 p-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <MixedMath text={o.text} className="text-sm" />
                {i === 0 && correct.length === 1 && (
                  <Badge
                    variant="success"
                    className="ml-auto shrink-0"
                  >
                    {String.fromCharCode(
                      65 +
                        item.options.findIndex((x) => x.id === o.id),
                    )}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {item.solution && (
        <div>
          <h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sigma className="h-3.5 w-3.5" /> Vysvětlení
          </h3>
          <MixedMath
            text={item.solution}
            className="text-sm leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
