import { useParams, useNavigate } from "react-router";
import { useEffect } from "react";
import { useItemsStore } from "@/stores/itemsStore";
import { ItemEditor } from "@/components/editor/ItemEditor";
import { EquationDialog } from "@/components/math/EquationDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function Component() {
  const { id } = useParams<{ id: string }>();
  const item = useItemsStore((s) => (id ? s.items[id] : undefined));
  const navigate = useNavigate();

  useEffect(() => {
    if (id && !item) {
      const t = setTimeout(() => navigate("/moje-ulohy", { replace: true }), 30);
      return () => clearTimeout(t);
    }
  }, [id, item, navigate]);

  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm text-muted-foreground">Úloha nebyla nalezena.</p>
        <Button variant="outline" onClick={() => navigate("/moje-ulohy")}>
          <ArrowLeft className="h-4 w-4" /> Zpět na moje úlohy
        </Button>
      </div>
    );
  }

  return (
    <>
      <ItemEditor item={item} />
      <EquationDialog />
    </>
  );
}

export default Component;
