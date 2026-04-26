import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ResultPanel } from "@/components/ResultPanel";
import { uploadDocument, processText } from "@/api/documents";
import type { ApiError, DocumentAnalysis } from "@/types";
import { cn } from "@/lib/utils";

const MAX_SIZE = 50 * 1024 * 1024;

type Tab = "text" | "file";

export default function SubmitPage() {
  const [tab, setTab] = useState<Tab>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DocumentAnalysis | null>(null);

  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePickFile = (list: FileList | null) => {
    if (!list?.length) return;
    const f = list[0];
    if (f.size > MAX_SIZE) {
      setError("File exceeds 50MB.");
      return;
    }
    setFile(f);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      let analysis: DocumentAnalysis;

      if (tab === "text") {
        const trimmed = text.trim();
        if (trimmed.length < 20) {
          setError("Please enter at least 20 characters.");
          setLoading(false);
          return;
        }
        analysis = await processText(trimmed);
      } else {
        if (!file) {
          setError("Please select a file.");
          setLoading(false);
          return;
        }
        analysis = await uploadDocument(file);
      }

      setResult(analysis);
    } catch (err) {
      setError((err as ApiError).message || "Processing failed.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setText("");
    setFile(null);
    setResult(null);
    setError("");
  };

  if (result) {
    return (
      <div className="p-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-neutral-100 mb-2">
          Request Result
        </h1>
        <ResultPanel result={result} onDone={reset} />
        <div className="flex justify-center mt-6">
          <Button variant="ghost" onClick={reset}>
            Submit another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-neutral-100 mb-2">
        Submit a Request
      </h1>
      <p className="text-subtle mb-6">
        Send a text request or upload a document for analysis.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-line">
        {(["text", "file"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              tab === t
                ? "text-accent border-accent"
                : "text-subtle border-transparent hover:text-white"
            )}
          >
            {t === "text" ? "Text" : "File"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {tab === "text" ? (
          <div>
            <label className="text-sm font-medium text-body block mb-1.5">
              Request text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              rows={10}
              placeholder="Describe your request…"
              className="w-full px-4 py-3 rounded-xl bg-input border border-line focus:border-accent outline-none text-[15px] text-body resize-none"
            />
            <p className="text-xs text-faint mt-1">
              {text.length} / 20 minimum
            </p>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handlePickFile(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors",
              isDragging ? "border-accent bg-accent/5" : "border-line"
            )}
          >
            <input
              id={inputId}
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              onChange={(e) => handlePickFile(e.target.files)}
            />
            <div className="w-12 h-12 rounded-full bg-input flex items-center justify-center">
              <UploadIcon />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-white">
                Click or drag to upload
              </p>
              <p className="text-sm text-subtle">PDF, DOC, DOCX (Max 50MB)</p>
            </div>
            <Button type="button" variant="secondary">
              Browse
            </Button>
            {file && (
              <div className="mt-4 px-4 py-2 rounded-lg bg-input border border-line text-sm">
                <p className="text-body">{file.name}</p>
              </div>
            )}
          </label>
        )}

        {error && (
          <div className="rounded-lg bg-[#451a1a]/60 border border-[#652a2a] px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <Button
            type="submit"
            loading={loading}
            disabled={
              tab === "text"
                ? text.trim().length < 20
                : !file
            }
          >
            {loading ? "Processing…" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-subtle"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
