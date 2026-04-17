export type ItemType =
  | "vyber-z-moznosti"
  | "vice-spravnych"
  | "doplnovacka"
  | "otevrena";

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  "vyber-z-moznosti": "Výběr z možností (1 správná)",
  "vice-spravnych": "Výběr z možností (více správných)",
  doplnovacka: "Doplňovačka",
  otevrena: "Otevřená odpověď",
};

export type Difficulty = "snadna" | "stredni" | "tezka";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  snadna: "Snadná",
  stredni: "Střední",
  tezka: "Těžká",
};

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ItemMetadata {
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  grade?: string;
  points?: number;
  tags: string[];
}

export type ValidationSeverity = "info" | "warning" | "error";

export interface ValidationFinding {
  id: string;
  severity: ValidationSeverity;
  title: string;
  description: string;
  target?: "question" | "option" | "solution" | "metadata" | "global";
  optionId?: string;
  suggestion?: string;
  sources?: ValidationSource[];
}

export interface ValidationSource {
  documentName: string;
  excerpt: string;
  similarity?: number;
}

export interface ValidationReport {
  itemId: string;
  generatedAt: string;
  model?: string;
  summary: string;
  findings: ValidationFinding[];
  usedDocuments: string[];
}

export interface TestItem {
  id: string;
  title: string;
  type: ItemType;
  question: string;
  options: AnswerOption[];
  solution: string;
  metadata: ItemMetadata;
  createdAt: string;
  updatedAt: string;
  lastValidation?: ValidationReport;
  status: "koncept" | "hotovo" | "schvaleno";
}

export function createEmptyItem(overrides: Partial<TestItem> = {}): TestItem {
  const now = new Date().toISOString();
  return {
    id: cryptoRandomId(),
    title: "Nová úloha",
    type: "vyber-z-moznosti",
    question: "",
    options: [
      { id: cryptoRandomId(), text: "", isCorrect: false },
      { id: cryptoRandomId(), text: "", isCorrect: false },
      { id: cryptoRandomId(), text: "", isCorrect: false },
      { id: cryptoRandomId(), text: "", isCorrect: false },
    ],
    solution: "",
    metadata: {
      topic: "",
      difficulty: "stredni",
      grade: "",
      points: 1,
      tags: [],
    },
    createdAt: now,
    updatedAt: now,
    status: "koncept",
    ...overrides,
  };
}

function cryptoRandomId(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
