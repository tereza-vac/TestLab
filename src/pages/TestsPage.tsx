import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ClipboardList, Sparkles } from "lucide-react";

export function Component() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Testy"
        description="Skládání celých testů z úloh v bance – v přípravě."
      />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <Card>
          <CardContent className="flex items-start gap-3 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">
                TestLab je autorský nástroj, ne generátor.
              </CardTitle>
              <CardDescription className="mt-1">
                Cílem aplikace je efektivní tvorba jednotlivých testových úloh
                s matematikou a RAG validací. Skládání celých testů z uložených
                úloh, export do PDF a verzování budou přidány v další iteraci.
              </CardDescription>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="flex items-start gap-3 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">
                Co přijde v další iteraci
              </CardTitle>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                <li>Skládání testu (drag & drop) z úloh v Bance úloh</li>
                <li>Export do PDF / DOCX se správnou sazbou matematiky</li>
                <li>Dávková RAG kontrola napříč všemi úlohami v testu</li>
                <li>Verzování a revizní pracovní postup</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Component;
