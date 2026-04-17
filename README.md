# TestLab

**Autorský nástroj pro tvorbu testových úloh** s podporou matematického obsahu
(LaTeX / KaTeX / MathLive) a kontrolou věcné a formální správnosti proti
zdrojovým dokumentům pomocí **RAG** (Retrieval-Augmented Generation).

Inspirováno designem a stackem projektu
[`sciobot-next`](https://github.com/scio-cz/sciobot-next).

> Production: bude zprovozněno na Vercelu (viz _Deploy_).

## Co TestLab umí

- **Editor-first workflow** – po založení nové úlohy skočíte rovnou do plného
  editoru, žádné vícekrokové formuláře.
- **Strukturovaná tvorba úlohy** – zadání, volitelné odpovědi, výběr správné
  odpovědi (jedna/více), řešení, metadata (téma, obtížnost, body, ročník).
- **Silná podpora matematiky** – inline `$...$` i blokové `$$...$$` výrazy,
  vizuální editor rovnic (**MathLive**) s českými popisky, rychlá paleta
  symbolů (zlomek, mocnina, odmocnina, integrál, suma, matice, …),
  KaTeX náhled v reálném čase.
- **Tři pohledy v editoru** – _Editor_, _Student_ (náhled jak ji uvidí žák),
  _Řešení_ (zvýrazněná správná odpověď + vysvětlení).
- **RAG validace úlohy** – jedno tlačítko spustí kontrolu, která najde
  relevantní pasáže z nahraných dokumentů (Cvičebnice ZSV, autorské pokyny,
  …), detekuje rozpor se zdrojem a zkontroluje i formální pravidla.
- **Banka úloh** – filtrování podle tématu, typu a obtížnosti.
- **Offline-first** – aplikace plně funguje i bez Supabase (vše je v
  localStorage), s Supabase se automaticky přepne na cloudové úložiště a
  pgvector-RAG.

## Stack

Stejný jako v `sciobot-next` — pouze s minimálním rozsahem nutným pro TestLab:

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 3, Radix UI +
  shadcn-styled komponenty, Zustand, React Router 7, Sonner.
- **Matematika:** KaTeX (renderování), MathLive (editor rovnic), custom mixed
  text/math segmenter (sdílený s přístupem v `sciobot-next`).
- **Rich-text (rezervováno pro budoucí Tiptap rozšíření).**
- **Backend:** Supabase (Postgres + pgvector, Auth, Edge Functions).
- **AI / RAG:** OpenAI (embedding `text-embedding-3-small`, chat `gpt-4o-mini`)
  volané z edge funkce `validate-item`. Fallback: lokální heuristický analyzer
  v prohlížeči, pokud backend/AI není k dispozici.
- **Deploy:** Vercel (SPA) + Supabase cloud projekt.

## Rychlý start

### Požadavky

- [Node.js 20+](https://nodejs.org/) (doporučeno) nebo Bun 1.1+
- Volitelně [Docker Desktop](https://www.docker.com/products/docker-desktop/) pro lokální Supabase
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

### 1. Instalace

```bash
npm install
```

### 2. Dev server

Aplikace funguje bez dalšího setupu v **offline režimu** (vše se ukládá do
localStorage včetně RAG zdrojů). Spusťte:

```bash
npm run dev
```

Otevře se na http://localhost:8080.

### 3. Supabase (volitelně – plná funkčnost RAG)

```bash
cp .env.example .env            # doplňte OPENAI_API_KEY a VITE_SUPABASE_*
npm run supabase:start          # spustí lokální Supabase v Dockeru
npm run supabase:reset          # aplikuje migrace (items, documents, pgvector)
npm run supabase:functions:serve # spustí edge funkce (validate-item, ingest-document)
```

Po `supabase start` dostanete lokální `URL` a `anon` key – vložte je jako
`VITE_SUPABASE_URL` a `VITE_SUPABASE_PUBLISHABLE_KEY` do `.env`.

### 4. Produkční build

```bash
npm run build         # vyrobí ./dist
npm run preview       # lokální preview dist buildu
```

## Deploy na Vercel

TestLab je konfigurován jako statická SPA, jak naznačuje `vercel.json`.

1. Push do GitHubu.
2. V Vercelu _Import Git Repository_ → vyberte repozitář `TestLab`.
3. Framework: **Vite** (autodetekce). Nic dalšího nastavovat netřeba –
   `vercel.json` to řeší včetně SPA rewrites a cache hlaviček.
4. V _Project Settings → Environment Variables_ přidejte:
   - `VITE_SUPABASE_URL` – URL vašeho Supabase projektu.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` – `anon` klíč.
5. Deploy. Hotovo.

### Supabase cloud projekt

1. Vytvořte projekt na https://supabase.com/dashboard.
2. Ve složce projektu TestLab:
   ```bash
   supabase link --project-ref <ref>
   supabase db push                    # nahraje migrace
   supabase functions deploy validate-item
   supabase functions deploy ingest-document
   supabase secrets set OPENAI_API_KEY=sk-...
   supabase secrets set OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   supabase secrets set OPENAI_CHAT_MODEL=gpt-4o-mini
   ```

## Struktura projektu

```
src/
  components/
    ui/               shadcn-styled UI primitives
    math/             KaTeX MixedMath renderer + MathLive EquationDialog
    editor/           ItemEditor, MathTextarea, MathToolsPanel, ValidationPanel
  pages/              Dashboard, NewItem, MyItems, ItemBank, ItemEditor, Tests, Settings
  layouts/            MainLayout (sidebar + content)
  stores/             zustand stores (items, documents, equation dialog)
  services/           validateItem (RAG orchestrator)
  lib/                utils, math-segments, mathlive-loader, supabase client
  types/              TestItem, ValidationReport, Difficulty, ItemType
supabase/
  migrations/         pgvector-enabled schema (items, documents, document_chunks)
  functions/
    validate-item/    RAG validation edge function
    ingest-document/  document chunking + embedding
```

## Design systém

TestLab používá stejné principy jako `sciobot-next`:

- Fonty: **Inter**.
- Barvy přes CSS custom properties (`--primary`, `--sidebar`, `--success-soft`,
  …), světlý i tmavý motiv.
- Komponenty postavené nad Radix UI ve stylu shadcn/new-york.

## Modely RAG validace

Edge funkce `validate-item` orchestruje kontrolu v pořadí:

1. Složí query z `question + options + solution + metadata.topic`.
2. Embedding přes OpenAI `text-embedding-3-small` (1536 dim).
3. `match_document_chunks` RPC (pgvector, cosine distance) vrátí top 5 pasáží.
4. Retrieved context + úloha jdou do chat modelu (`gpt-4o-mini`) se
   strukturovaným JSON schématem (`{summary, findings[]}`).
5. Výsledek uložíme do `items.last_validation` a zobrazíme v panelu.

## Inspirováno

Některé přístupy (MixedMath renderer, MathLive konfigurace s českou
lokalizací, sidebar + content layout, dizajnové tokeny) vycházejí z
kódu projektu `sciobot-next`. Kód byl převzatý a přizpůsobený rozsahu TestLabu.

## Licence

Interní prototyp pro hackathon Scio _Implementace AI do AN_ (duben 2026).
