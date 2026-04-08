import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Monitor, Wifi, WifiOff, Clock } from "lucide-react";

type DeviceStatusRow = Record<string, string | number | null | undefined>;

const DeviceMonitor = () => {
  const [device, setDevice] = useState<DeviceStatusRow | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const fetchDevice = async () => {
      const { data, error } = await supabase
        .from("device_status")
        .select("*")
        .order("last_seen", { ascending: false })
        .limit(1);

      if (error) {
        console.log("Failed to fetch device_status:", error);
        return;
      }

      const row = (data as DeviceStatusRow[] | null)?.[0] ?? null;
      setDevice(row);
    };

    fetchDevice();
    const intervalId = window.setInterval(fetchDevice, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const lastSeenRaw = device?.last_seen;
  const lastSeen = lastSeenRaw ? new Date(String(lastSeenRaw)) : null;
  const isOnline =
    lastSeen && !Number.isNaN(lastSeen.getTime())
      ? Date.now() - lastSeen.getTime() < 5 * 60 * 1000
      : false;

  const detailEntries = device
    ? Object.entries(device).filter(([key]) => key !== "last_seen" && key !== "id")
    : [];

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
        <Monitor className="w-4 h-4 text-primary" />
        Device Monitoring
      </h3>
      <div className="flex flex-col items-center gap-4 py-8">
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center ${isOnline ? "bg-success/10" : "bg-destructive/10"}`}
        >
          {isOnline ? (
            <Wifi className="w-10 h-10 text-success" />
          ) : (
            <WifiOff className="w-10 h-10 text-destructive" />
          )}
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold ${isOnline ? "text-success" : "text-destructive"}`}>
            {isOnline ? "Online" : "Offline"}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 justify-center">
            <Clock className="w-3 h-3" />
            Last seen:{" "}
            {lastSeen && !Number.isNaN(lastSeen.getTime()) ? lastSeen.toLocaleString() : "—"}
          </p>
        </div>
        <div className="w-full max-w-sm mt-4 space-y-2">
          {detailEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center p-2 rounded-lg bg-secondary/50 text-sm gap-2"
            >
              <span className="text-muted-foreground capitalize shrink-0">{key.replace(/_/g, " ")}</span>
              <span className="text-foreground font-medium text-right truncate">{String(value ?? "—")}</span>
            </div>
          ))}
          {!device && (
            <p className="text-center text-sm text-muted-foreground py-4">No device status data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceMonitor;
