import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/sonner";
import { AlertTriangle, Clock, Fingerprint, CreditCard, Eye } from "lucide-react";

const reasonIcons: Record<string, typeof AlertTriangle> = {
  unknown_card: CreditCard,
  finger_mismatch: Fingerprint,
  loitering: Eye,
};

const reasonLabels: Record<string, string> = {
  unknown_card: "Unknown Card",
  finger_mismatch: "Fingerprint Mismatch",
  loitering: "Loitering Detected",
  duplicate_scan: "Duplicate Scan",
  after_hours: "After Hours Entry",
};

type FailedAttempt = {
  id: string | number;
  reason: string | null;
  timestamp: string | null;
  card_id?: string | null;
};

const AlertsPanel = ({ fullPage = false }: { fullPage?: boolean }) => {
  const [alerts, setAlerts] = useState<FailedAttempt[]>([]);
  const hasLoadedOnce = useRef(false);
  const latestSeenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from("failed_attempts")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        console.log("Failed to fetch alerts:", error);
        return;
      }

      const nextAlerts = (data as FailedAttempt[]) ?? [];
      setAlerts(nextAlerts);

      const latest = nextAlerts[0];
      const latestToken = latest ? `${latest.id}-${latest.timestamp ?? ""}` : null;
      if (!hasLoadedOnce.current) {
        latestSeenRef.current = latestToken;
        hasLoadedOnce.current = true;
        return;
      }

      if (latestToken && latestToken !== latestSeenRef.current) {
        latestSeenRef.current = latestToken;
        const latestReason = latest.reason ?? "Unknown alert";
        toast.error(`New alert: ${reasonLabels[latestReason] || latestReason}`);
      }
    };

    fetchAlerts();
    const intervalId = window.setInterval(fetchAlerts, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const visibleAlerts = fullPage ? alerts : alerts.slice(0, 10);

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        Security Alerts
      </h3>
      <div className={`space-y-2 overflow-y-auto pr-1 ${fullPage ? "max-h-[600px]" : "max-h-[400px]"}`}>
        {visibleAlerts.map((alert) => {
          const reason = alert.reason ?? "unknown";
          const Icon = reasonIcons[reason] || AlertTriangle;
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 animate-slide-in"
            >
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">
                  {reasonLabels[reason] || reason}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Card ID: {alert.card_id ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "No timestamp"}
                </p>
              </div>
            </div>
          );
        })}
        {visibleAlerts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No alerts</p>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
