import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface KnowledgeDoc {
  id: string;
  name: string;
  size: number;
  content: string;
  createdAt: string;
}

interface State {
  docs: Record<string, KnowledgeDoc>;
  order: string[];
  addDoc: (doc: Omit<KnowledgeDoc, "id" | "createdAt">) => KnowledgeDoc;
  deleteDoc: (id: string) => void;
  list: () => KnowledgeDoc[];
}

function randomId(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const useDocumentsStore = create<State>()(
  persist(
    (set, get) => ({
      docs: {},
      order: [],
      addDoc: ({ name, size, content }) => {
        const doc: KnowledgeDoc = {
          id: randomId(),
          name,
          size,
          content,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          docs: { ...s.docs, [doc.id]: doc },
          order: [doc.id, ...s.order],
        }));
        return doc;
      },
      deleteDoc: (id) => {
        set((s) => {
          const { [id]: _, ...rest } = s.docs;
          return {
            docs: rest,
            order: s.order.filter((x) => x !== id),
          };
        });
      },
      list: () => get().order.map((id) => get().docs[id]).filter(Boolean),
    }),
    { name: "testlab.documents" },
  ),
);
