import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useItemsStore } from "@/stores/itemsStore";

/**
 * Creates a new draft item and immediately redirects to the editor.
 * Matches the “editor-first” UX: no multi-step form — user lands in the
 * full-featured editor on the next render.
 */
export function Component() {
  const createItem = useItemsStore((s) => s.createItem);
  const navigate = useNavigate();

  useEffect(() => {
    const item = createItem();
    navigate(`/uloha/${item.id}`, { replace: true });
  }, [createItem, navigate]);

  return (
    <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
      Připravuji novou úlohu…
    </div>
  );
}

export default Component;
