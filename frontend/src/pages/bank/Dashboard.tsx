import { useEffect, useState } from "react";
import { Card, Spinner } from "@/components/ui/index";
import { getHistory } from "@/api/history";
import type { HistoryResponse } from "@/types";

export default function BankDashboardPage() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-100 mb-2">Dashboard</h1>
      <p className="text-subtle mb-6">Overview of processing activities.</p>

      {loading ? (
        <Spinner label="Loading stats…" />
      ) : (
        <div className="grid grid-cols-3 gap-5">
          <Card>
            <div className="text-4xl font-bold text-accent">
              {history?.file_count ?? 0}
            </div>
            <p className="text-subtle text-sm mt-2">Documents processed</p>
          </Card>
          <Card>
            <div className="text-4xl font-bold text-success">
              {history?.files?.filter((f) => f.status === "approved").length ?? 0}
            </div>
            <p className="text-subtle text-sm mt-2">Approved</p>
          </Card>
          <Card>
            <div className="text-4xl font-bold text-danger">
              {history?.files?.filter((f) => f.status === "rejected").length ?? 0}
            </div>
            <p className="text-subtle text-sm mt-2">Rejected</p>
          </Card>
        </div>
      )}
    </div>
  );
}
