import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult, UserRole, AppState } from "@/types/analysis";
import { sampleEmploymentAgreement } from "@/data/sampleDocument";
import Header from "@/components/Header";
import RoleSelector from "@/components/RoleSelector";
import InputSection from "@/components/InputSection";
import OutputDashboard from "@/components/OutputDashboard";
import { Button } from "@/components/ui/button";
import { Loader2, Search, FileText } from "lucide-react";

const Index = () => {
  const [role, setRole] = useState<UserRole>("Employee");
  const [text, setText] = useState("");
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const analyze = async () => {
    if (!text.trim() || text.trim().length < 10) {
      toast.error("Please enter at least 10 characters of document text.");
      return;
    }

    setState("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { documentText: text, userRole: role },
      });

      if (error) throw new Error(error.message || "Analysis failed");
      if (data?.error) throw new Error(data.error);

      if (typeof data?.is_legal_document !== "boolean") {
        throw new Error("Invalid response from AI");
      }

      setResult(data as AnalysisResult);
      setState("success");
      toast.success("Analysis complete!");
    } catch (err: any) {
      setState("error");
      const msg = err?.message || "Analysis failed. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const loadSample = () => {
    setText(sampleEmploymentAgreement);
    toast.success("Sample document loaded — click Analyze to proceed");
  };

  const reset = () => {
    setState("idle");
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {state !== "success" && (
          <>
            <RoleSelector selected={role} onChange={setRole} />
            <InputSection text={text} onTextChange={setText} onFileText={(t) => setText(t)} />

            <div className="flex gap-3">
              <Button
                onClick={analyze}
                disabled={!text.trim() || state === "loading"}
                className="flex-1 gap-2 h-12 text-base shadow-premium hover:shadow-card-hover transition-all"
              >
                {state === "loading" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Analyze
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={loadSample}
                disabled={state === "loading"}
                className="gap-2 h-12 shadow-card-subtle hover:shadow-card-hover transition-all"
              >
                <FileText className="h-5 w-5" />
                Try Sample Document
              </Button>
            </div>

            {state === "error" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2 animate-section-enter">
                <p className="text-sm text-destructive">{errorMsg}</p>
                <Button variant="outline" size="sm" onClick={analyze}>
                  Retry Analysis
                </Button>
              </div>
            )}
          </>
        )}

        {state === "success" && result && (
          <div className="space-y-6 animate-section-enter">
            <Button variant="outline" onClick={reset} className="gap-2 shadow-card-subtle">
              ← Analyze Another Document
            </Button>
            <OutputDashboard result={result} onReanalyze={analyze} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
