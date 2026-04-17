import { create } from "zustand";

interface EquationDialogState {
  open: boolean;
  initialLatex: string;
  display: boolean;
  onSave?: (latex: string, display: boolean) => void;
  openDialog: (opts: {
    initialLatex?: string;
    display?: boolean;
    onSave: (latex: string, display: boolean) => void;
  }) => void;
  close: () => void;
}

export const useEquationDialogStore = create<EquationDialogState>((set) => ({
  open: false,
  initialLatex: "",
  display: false,
  onSave: undefined,
  openDialog: ({ initialLatex = "", display = false, onSave }) =>
    set({ open: true, initialLatex, display, onSave }),
  close: () => set({ open: false, onSave: undefined }),
}));
