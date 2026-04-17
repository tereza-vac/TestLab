import { useCallback, useEffect, useRef, useState } from "react";
import type { MathfieldElement } from "mathlive";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { configureMathfield, ensureMathLive } from "@/lib/mathlive-loader";
import { useEquationDialogStore } from "@/stores/equationDialogStore";

export function EquationDialog() {
  const { open, initialLatex, display, onSave, close } = useEquationDialogStore();
  const [ready, setReady] = useState(false);
  const mathfieldRef = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    if (open) ensureMathLive().then(() => setReady(true));
    else window.mathVirtualKeyboard?.hide();
  }, [open]);

  useEffect(() => {
    if (!open || !ready) return;
    const raf = requestAnimationFrame(() => {
      const mf = mathfieldRef.current;
      if (!mf) return;
      configureMathfield(mf);
      mf.setValue(initialLatex, { silenceNotifications: true });
      const focusMf = () => {
        mf.focus();
        mf.position = mf.lastOffset;
      };
      mf.addEventListener("mount", focusMf, { once: true });
      setTimeout(focusMf, 100);
    });
    return () => cancelAnimationFrame(raf);
  }, [open, ready, initialLatex]);

  const handleSave = useCallback(() => {
    const mf = mathfieldRef.current;
    if (!mf) return;
    onSave?.(mf.value, display);
    close();
  }, [onSave, display, close]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent
        className="sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSave();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {initialLatex ? "Upravit matematický výraz" : "Vložit matematický výraz"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
          <Label>Výraz (LaTeX)</Label>
          <div className="rounded-md border bg-background p-2">
            {ready && (
              <math-field
                ref={mathfieldRef as any}
                virtual-keyboard-mode="manual"
                smart-fence
                style={
                  {
                    width: "100%",
                    minHeight: "60px",
                    fontSize: "1.15em",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    "--highlight": "hsl(var(--primary) / 0.15)",
                    "--caret-color": "hsl(var(--primary))",
                  } as React.CSSProperties
                }
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: napište <code className="rounded bg-muted px-1">/</code> pro rychlé
            vložení zlomku. Uložíte stisknutím Ctrl/⌘+Enter.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Zrušit
          </Button>
          <Button onClick={handleSave}>Uložit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
