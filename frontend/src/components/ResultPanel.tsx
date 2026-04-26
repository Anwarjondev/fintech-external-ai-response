import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/index";
import { approveDocument } from "@/api/documents";
import type { ApiError, ApprovalResponse, DocumentAnalysis } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  result: DocumentAnalysis;
  onDone?: (res: ApprovalResponse) => void;
};

function riskTone(level: string): "success" | "warning" | "danger" | "critical" {
  const v = String(level).toLowerCase();
  if (v.includes("crit")) return "critical";
  if (v.includes("high")) return "danger";
  if (v.includes("med")) return "warning";
  return "success";
}

export function ResultPanel({ result, onDone }: Props) {
  const [topic, setTopic] = useState(result.topic);
  const [responseText, setResponseText] = useState(result.response_text);
  const [retrievedDataText, setRetrievedDataText] = useState(() =>
    JSON.stringify(result.retrieved_data ?? {}, null, 2)
  );

  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const jsonError = useMemo(() => {
    try {
      JSON.parse(retrievedDataText || "{}");
      return null;
    } catch {
      return "Invalid JSON";
    }
  }, [retrievedDataText]);

  const handleApprove = async () => {
    setError("");
    if (jsonError) {
      setError(jsonError);
      return;
    }
    if (!topic.trim()) {
      setError("Topic cannot be empty.");
      return;
    }
    if (!responseText.trim()) {
      setError("Response text cannot be empty.");
      return;
    }

    setApproveLoading(true);
    try {
      const res = await approveDocument(result.request_id, {
        format: "pdf",
        topic: topic.trim(),
        response_text: responseText,
        retrieved_data: JSON.parse(retrievedDataText || "{}"),
        is_approved: true,
      });
      setSuccess("Approved and submitted successfully.");
      onDone?.(res);
    } catch (e) {
      setError((e as ApiError).message || "Approval failed.");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    setError("");
    setRejectLoading(true);
    try {
      const res = await approveDocument(result.request_id, {
        format: "pdf",
        topic: topic.trim(),
        response_text: responseText,
        retrieved_data: JSON.parse(retrievedDataText || "{}"),
        is_approved: false,
      });
      setSuccess("Rejected and submitted successfully.");
      onDone?.(res);
    } catch (e) {
      setError((e as ApiError).message || "Rejection failed.");
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xs font-bold text-meta uppercase tracking-wider">
            AI Analysis Result
          </h3>
          <h2 className="text-xl font-semibold text-neutral-100 mt-2">
            {result.topic}
          </h2>
          {result.source_filename && (
            <p className="text-xs text-subtle mt-1">
              From: <span className="text-body">{result.source_filename}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={riskTone(result.risk_level)}>
            Risk: {String(result.risk_level)}
          </Badge>
          {typeof result.deadline_days === "number" && (
            <Badge tone="info">{result.deadline_days}d</Badge>
          )}
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-line">
        <Field label="Request ID" value={result.request_id} mono />
        {result.decision && <Field label="Decision" value={result.decision} />}
        {result.legal_reference && (
          <Field label="Legal ref." value={result.legal_reference} />
        )}
        {result.reason && <Field label="Reason" value={result.reason} />}
      </div>

      {/* Editable fields */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-body block mb-1.5">
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={approveLoading || rejectLoading}
            className="w-full h-10 px-3 rounded-lg bg-input border border-line focus:border-accent outline-none text-sm text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-body block mb-1.5">
            Response text
          </label>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            disabled={approveLoading || rejectLoading}
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-input border border-line focus:border-accent outline-none text-sm text-body resize-none"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setRetrievedDataText(JSON.stringify(JSON.parse(retrievedDataText), null, 2))}
            className="text-xs text-accent hover:underline mb-1.5 block"
          >
            {retrievedDataText === "{}" ? "Show" : "Edit"} JSON data
          </button>
          {retrievedDataText !== "{}" && (
            <>
              <textarea
                value={retrievedDataText}
                onChange={(e) => setRetrievedDataText(e.target.value)}
                disabled={approveLoading || rejectLoading}
                rows={4}
                spellCheck={false}
                className={cn(
                  "w-full px-3 py-2 rounded-lg bg-input border outline-none text-xs font-mono text-body resize-none",
                  jsonError ? "border-danger" : "border-line focus:border-accent"
                )}
              />
              {jsonError && <p className="text-xs text-danger mt-1">{jsonError}</p>}
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-[#451a1a]/60 border border-[#652a2a] px-3 py-2 text-sm text-danger mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-[#1a3a24]/60 border border-[#2a5a3a] px-3 py-2 text-sm text-success mb-4">
          {success}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t border-line">
        <Button
          variant="danger"
          onClick={handleReject}
          loading={rejectLoading}
          disabled={approveLoading || !!success}
        >
          Reject
        </Button>
        <div className="flex-1" />
        <Button
          variant="success"
          onClick={handleApprove}
          loading={approveLoading}
          disabled={rejectLoading || !!success}
        >
          Approve &amp; send
        </Button>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-faint uppercase">
        {label}
      </dt>
      <dd className={cn("mt-0.5 text-sm text-body break-words", mono && "font-mono text-xs")}>
        {value}
      </dd>
    </div>
  );
}
