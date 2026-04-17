import { forwardRef, useImperativeHandle, useRef } from "react";
import { Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MixedMath } from "@/components/math/MixedMath";
import { useEquationDialogStore } from "@/stores/equationDialogStore";
import { cn } from "@/lib/utils";

export interface MathTextareaHandle {
  insertAtCursor: (text: string) => void;
  focus: () => void;
}

export interface MathTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  label?: string;
  compact?: boolean;
  hidePreview?: boolean;
}

export const MathTextarea = forwardRef<MathTextareaHandle, MathTextareaProps>(
  function MathTextarea(
    { value, onChange, placeholder, rows = 4, className, label, compact, hidePreview },
    ref,
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const openEq = useEquationDialogStore((s) => s.openDialog);

    const insertAtCursor = (insertion: string) => {
      const el = textareaRef.current;
      if (!el) {
        onChange(value + insertion);
        return;
      }
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const next = value.slice(0, start) + insertion + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + insertion.length;
        el.selectionStart = el.selectionEnd = pos;
      });
    };

    useImperativeHandle(ref, () => ({
      insertAtCursor,
      focus: () => textareaRef.current?.focus(),
    }));

    const openEquationEditor = (display = false) => {
      const el = textareaRef.current;
      let initialLatex = "";
      if (el) {
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        if (end > start) initialLatex = value.slice(start, end);
      }
      openEq({
        initialLatex,
        display,
        onSave: (latex, isDisplay) => {
          const wrapped = isDisplay ? `$$${latex}$$` : `$${latex}$`;
          if (el && (el.selectionStart ?? 0) !== (el.selectionEnd ?? 0)) {
            const start = el.selectionStart ?? 0;
            const end = el.selectionEnd ?? 0;
            const next = value.slice(0, start) + wrapped + value.slice(end);
            onChange(next);
            requestAnimationFrame(() => {
              el.focus();
              const pos = start + wrapped.length;
              el.selectionStart = el.selectionEnd = pos;
            });
          } else {
            insertAtCursor(wrapped);
          }
        },
      });
    };

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{label}</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => openEquationEditor(false)}
            >
              <Sigma className="h-3.5 w-3.5" />
              Vložit vzorec
            </Button>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 2 : rows}
          className="resize-y font-[15px] leading-relaxed"
        />
        {!hidePreview && value && (
          <div className="rounded-md border border-dashed bg-muted/30 p-3">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Náhled
            </div>
            <MixedMath text={value} className="text-[15px] leading-relaxed" />
          </div>
        )}
      </div>
    );
  },
);
