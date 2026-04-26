import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ResultPanel } from "@/components/ResultPanel";
import { uploadDocument } from "@/api/documents";
import type { ApiError, DocumentAnalysis } from "@/types";
import { cn } from "@/lib/utils";

const MAX_SIZE = 50 * 1024 * 1024;

export default function UploadPage() {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DocumentAnalysis | null>(null);

  const pickFile = (list: FileList | null) => {
    if (!list?.length) return;
    const f = list[0];
    if (f.size > MAX_SIZE) {
      setError("File exceeds 50MB limit.");
      return;
    }
    setFile(f);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const analysis = await uploadDocument(file);
      setResult(analysis);
    } catch (err) {
      setError((err as ApiError).message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-neutral-100 mb-2">Upload Document</h1>
      <p className="text-subtle mb-6">Upload a PDF or Word file for AI analysis.</p>

      {!result ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              pickFile(e.dataTransfer.files);
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
              onChange={(e) => pickFile(e.target.files)}
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
                <p className="text-xs text-subtle">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            )}
          </label>

          {error && (
            <div className="rounded-lg bg-[#451a1a]/60 border border-[#652a2a] px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button type="submit" loading={loading} disabled={!file}>
              {loading ? "Uploading…" : "Analyze"}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <ResultPanel result={result} onDone={reset} />
          <div className="flex justify-center mt-6">
            <Button variant="ghost" onClick={reset}>
              Upload another
            </Button>
          </div>
        </>
      )}
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
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-subtle"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
