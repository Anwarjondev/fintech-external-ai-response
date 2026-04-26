import { useEffect, useState } from "react";
import { Card, Spinner, Badge } from "@/components/ui/index";
import { getHistory } from "@/api/history";
import type { HistoryFile, HistoryResponse } from "@/types";

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const files = history?.files ?? [];

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-neutral-100 mb-2">
        Request History
      </h1>
      <p className="text-subtle mb-6">
        Your {files.length} request{files.length !== 1 ? "s" : ""}.
      </p>

      {loading ? (
        <Spinner label="Loading…" />
      ) : files.length === 0 ? (
        <Card>
          <p className="text-subtle text-center py-8">No requests yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <FileCard key={file.request_id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ResultsPage() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = history?.files?.filter(
    (f) => f.status === "approved" || f.status === "completed"
  ) ?? [];

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-neutral-100 mb-2">
        Completed Requests
      </h1>
      <p className="text-subtle mb-6">
        Results from {completed.length} completed request
        {completed.length !== 1 ? "s" : ""}.
      </p>

      {loading ? (
        <Spinner label="Loading…" />
      ) : completed.length === 0 ? (
        <Card>
          <p className="text-subtle text-center py-8">
            No completed requests yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {completed.map((file) => (
            <FileCard key={file.request_id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileCard({ file }: { file: HistoryFile }) {
  const statusTone =
    file.status === "approved" || file.status === "completed"
      ? "success"
      : file.status === "rejected"
        ? "danger"
        : "warning";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-neutral-100 truncate">
            {file.topic || "Untitled"}
          </h3>
          <p className="text-xs text-subtle mt-1">
            ID: <span className="text-body">{file.request_id}</span>
          </p>
          {file.created_at && (
            <p className="text-xs text-faint mt-0.5">{file.created_at}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {file.risk_level && (
            <Badge tone={file.risk_level.includes("high") ? "danger" : "info"}>
              {file.risk_level}
            </Badge>
          )}
          <Badge tone={statusTone}>
            {String(file.status || "pending")
              .charAt(0)
              .toUpperCase() + String(file.status || "pending").slice(1)}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
