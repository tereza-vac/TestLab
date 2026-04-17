import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createEmptyItem,
  type TestItem,
  type ValidationReport,
} from "@/types/item";

interface ItemsState {
  items: Record<string, TestItem>;
  order: string[];
  createItem: (overrides?: Partial<TestItem>) => TestItem;
  updateItem: (id: string, patch: Partial<TestItem>) => void;
  deleteItem: (id: string) => void;
  setValidation: (id: string, report: ValidationReport) => void;
  getItem: (id: string) => TestItem | undefined;
  listItems: () => TestItem[];
}

export const useItemsStore = create<ItemsState>()(
  persist(
    (set, get) => ({
      items: {},
      order: [],

      createItem: (overrides) => {
        const item = createEmptyItem(overrides);
        set((s) => ({
          items: { ...s.items, [item.id]: item },
          order: [item.id, ...s.order],
        }));
        return item;
      },

      updateItem: (id, patch) => {
        set((s) => {
          const existing = s.items[id];
          if (!existing) return s;
          const next: TestItem = {
            ...existing,
            ...patch,
            metadata: patch.metadata
              ? { ...existing.metadata, ...patch.metadata }
              : existing.metadata,
            updatedAt: new Date().toISOString(),
          };
          return { items: { ...s.items, [id]: next } };
        });
      },

      deleteItem: (id) => {
        set((s) => {
          const { [id]: _, ...rest } = s.items;
          return {
            items: rest,
            order: s.order.filter((x) => x !== id),
          };
        });
      },

      setValidation: (id, report) => {
        set((s) => {
          const existing = s.items[id];
          if (!existing) return s;
          return {
            items: {
              ...s.items,
              [id]: { ...existing, lastValidation: report },
            },
          };
        });
      },

      getItem: (id) => get().items[id],
      listItems: () =>
        get()
          .order.map((id) => get().items[id])
          .filter(Boolean),
    }),
    { name: "testlab.items" },
  ),
);
