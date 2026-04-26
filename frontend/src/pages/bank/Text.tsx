import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ResultPanel } from "@/components/ResultPanel";
import { processText } from "@/api/documents";
import type { ApiError, DocumentAnalysis } from "@/types";

export default function TextPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DocumentAnalysis | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 20) {
      setError("Please enter at least 20 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const analysis = await processText(trimmed);
      setResult(analysis);
    } catch (err) {
      setError((err as ApiError).message || "Processing failed.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setText("");
    setResult(null);
    setError("");
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-neutral-100 mb-2">Text Request</h1>
      <p className="text-subtle mb-6">
        Paste or type a request for AI analysis.
      </p>

      {!result ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-body block mb-1.5">
              Request text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              rows={12}
              placeholder="Paste the official letter or describe the request here…"
              className="w-full px-4 py-3 rounded-xl bg-input border border-line focus:border-accent outline-none text-[15px] leading-relaxed text-body resize-none"
            />
            <p className="text-xs text-faint mt-1 flex justify-between">
              <span>Minimum 20 characters</span>
              <span>{text.length}</span>
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-[#451a1a]/60 border border-[#652a2a] px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="submit"
              loading={loading}
              disabled={text.trim().length < 20}
            >
              {loading ? "Analyzing…" : "Analyze"}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <ResultPanel result={result} onDone={reset} />
          <div className="flex justify-center mt-6">
            <Button variant="ghost" onClick={reset}>
              Submit another
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
