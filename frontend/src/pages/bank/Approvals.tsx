import { useEffect, useState } from "react";
import { Card, Spinner, Badge } from "@/components/ui/index";
import { getHistory } from "@/api/history";
import type { HistoryFile, HistoryResponse } from "@/types";

export function ApprovalsPage() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = history?.files?.filter(
    (f) => f.status !== "approved" && f.status !== "rejected"
  ) ?? [];

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-neutral-100 mb-2">Pending Approvals</h1>
      <p className="text-subtle mb-6">
        {pending.length} document{pending.length !== 1 ? "s" : ""} awaiting approval.
      </p>

      {loading ? (
        <Spinner label="Loading…" />
      ) : pending.length === 0 ? (
        <Card>
          <p className="text-subtle text-center py-8">No pending approvals.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((file) => (
            <FileCard key={file.request_id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

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
      <h1 className="text-2xl font-bold text-neutral-100 mb-2">History</h1>
      <p className="text-subtle mb-6">
        {files.length} document{files.length !== 1 ? "s" : ""} total.
      </p>

      {loading ? (
        <Spinner label="Loading…" />
      ) : files.length === 0 ? (
        <Card>
          <p className="text-subtle text-center py-8">No documents yet.</p>
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

function FileCard({ file }: { file: HistoryFile }) {
  const statusTone =
    file.status === "approved"
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
          {file.source_filename && (
            <p className="text-xs text-subtle">
              File: <span className="text-body">{file.source_filename}</span>
            </p>
          )}
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
            {String(file.status || "pending").charAt(0).toUpperCase() +
              String(file.status || "pending").slice(1)}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
