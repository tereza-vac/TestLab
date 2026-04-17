import type { MathfieldElement } from "mathlive";

let loaded: Promise<void> | null = null;

const CS_STRINGS: Record<string, string> = {
  "keyboard.tooltip.symbols": "Symboly",
  "keyboard.tooltip.greek": "Řecká písmena",
  "keyboard.tooltip.numeric": "Číselné",
  "keyboard.tooltip.alphabetic": "Latinská písmena",
  "tooltip.copy to clipboard": "Kopírovat do schránky",
  "tooltip.cut to clipboard": "Vyjmout do schránky",
  "tooltip.paste from clipboard": "Vložit ze schránky",
  "tooltip.redo": "Znovu",
  "tooltip.toggle virtual keyboard": "Přepnout virtuální klávesnici",
  "tooltip.menu": "Menu",
  "tooltip.undo": "Zpět",
  "menu.insert matrix": "Vložit matici",
  "menu.mode-math": "Matematika",
  "menu.mode-text": "Text",
  "menu.mode-latex": "LaTeX",
  "menu.insert.abs": "Absolutní hodnota",
  "menu.insert.nth-root": "n-tá odmocnina",
  "menu.insert.integral": "Integrál",
  "menu.insert.sum": "Suma",
  "menu.insert.product": "Součin",
  "menu.insert.derivative": "Derivace",
};

export function ensureMathLive(): Promise<void> {
  if (!loaded) {
    loaded = import("mathlive").then((mod) => {
      const MFE = mod.MathfieldElement as unknown as {
        strings?: Record<string, Record<string, string>>;
        locale?: string;
      };
      try {
        if (MFE.strings) MFE.strings.cs = CS_STRINGS;
        MFE.locale = "cs";
      } catch {
        /* noop */
      }
    });
  }
  return loaded;
}

export function configureMathfield(mf: MathfieldElement): void {
  mf.smartFence = true;
  mf.smartSuperscript = true;
  mf.mathModeSpace = "\\:";
  mf.onInlineShortcut = () => "";
  mf.inlineShortcuts = {
    ...mf.inlineShortcuts,
    "/": { value: "\\frac{#@}{#?}" },
  };
}
