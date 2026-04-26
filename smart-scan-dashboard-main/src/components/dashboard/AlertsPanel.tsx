import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AlertTriangle, Clock, Fingerprint, CreditCard, Eye } from "lucide-react";
import { connectLiveAlerts, type LiveAlert } from "@/lib/mqttLiveAlerts";

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
  mismatch: "Mismatch",
  polling: "Polling (LED Control)",
  led_control: "LED Control",
};

type FailedAttempt = {
  id: string | number;
  reason: string | null;
  timestamp: string | null;
  card_id?: string | null;
};

const AlertsPanel = ({ fullPage = false }: { fullPage?: boolean }) => {
  const [alerts, setAlerts] = useState<FailedAttempt[]>([]);
  const [mqttConnected, setMqttConnected] = useState<boolean | null>(null);
  const [mqttError, setMqttError] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const url = import.meta.env.VITE_MQTT_URL as string | undefined;
    const username = import.meta.env.VITE_MQTT_USERNAME as string | undefined;
    const password = import.meta.env.VITE_MQTT_PASSWORD as string | undefined;
    const topic = (import.meta.env.VITE_MQTT_TOPIC_ALERTS as string | undefined) ?? "smartscan/alerts";

    if (!url || !username || !password) {
      console.log("MQTT not configured. Add VITE_MQTT_URL, VITE_MQTT_USERNAME, VITE_MQTT_PASSWORD.");
      setMqttConnected(null);
      return;
    }

    const { disconnect } = connectLiveAlerts({
      url,
      username,
      password,
      topic,
      onStatus: ({ connected, error }) => {
        setMqttConnected(connected);
        setMqttError(error ?? null);
        if (error) toast.error(`MQTT error: ${error}`);
      },
      onAlert: (incoming: LiveAlert) => {
        if (seenIdsRef.current.has(incoming.id)) return;
        seenIdsRef.current.add(incoming.id);

        const next: FailedAttempt = {
          id: incoming.id,
          reason: incoming.reason,
          timestamp: incoming.timestamp,
          card_id: incoming.card_id ?? null,
        };

        setAlerts((prev) => [next, ...prev].slice(0, 50));

        const r = incoming.reason ?? "Unknown alert";
        toast.error(`New alert: ${reasonLabels[r] || r}`);
      },
    });

    return () => disconnect();
  }, []);

  const visibleAlerts = fullPage ? alerts : alerts.slice(0, 10);

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        Security Alerts
        <span
          className={[
            "ml-auto text-[11px] px-2 py-0.5 rounded-full border",
            mqttConnected === true
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : mqttConnected === false
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-muted/40 text-muted-foreground border-border",
          ].join(" ")}
          title={mqttError ?? "MQTT status"}
        >
          {mqttConnected === true ? "MQTT: connected" : mqttConnected === false ? "MQTT: disconnected" : "MQTT: not configured"}
        </span>
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
