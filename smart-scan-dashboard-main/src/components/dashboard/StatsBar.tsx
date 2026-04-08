import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, XCircle, AlertTriangle, Wifi } from "lucide-react";

const StatsBar = () => {
  const [presentToday, setPresentToday] = useState(0);
  const [deniedToday, setDeniedToday] = useState(0);
  const [alertsToday, setAlertsToday] = useState(0);

  const [deviceLastSeen, setDeviceLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const fetchStats = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartIso = todayStart.toISOString();

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("status,timestamp")
        .gte("timestamp", todayStartIso);

      if (attendanceError) {
        console.log("Failed to fetch attendance stats:", attendanceError);
      } else {
        const rows = attendanceData ?? [];
        const presentCount = rows.filter((row) => row.status?.toLowerCase() === "present").length;
        const deniedCount = rows.filter((row) => row.status?.toLowerCase() === "denied").length;
        setPresentToday(presentCount);
        setDeniedToday(deniedCount);
      }

      const { count: alertCount, error: alertsError } = await supabase
        .from("failed_attempts")
        .select("*", { count: "exact", head: true })
        .gte("timestamp", todayStartIso);

      if (alertsError) {
        console.log("Failed to fetch alert stats:", alertsError);
      } else {
        setAlertsToday(alertCount ?? 0);
      }

      const { data: deviceData, error: deviceError } = await supabase
        .from("device_status")
        .select("last_seen")
        .order("last_seen", { ascending: false })
        .limit(1);

      if (deviceError) {
        console.log("Failed to fetch device_status for stats:", deviceError);
        return;
      }

      const row = deviceData?.[0] as { last_seen?: string | null } | undefined;
      setDeviceLastSeen(row?.last_seen ?? null);
    };

    fetchStats();
    const intervalId = window.setInterval(fetchStats, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const lastSeenMs = deviceLastSeen ? new Date(deviceLastSeen).getTime() : NaN;
  const isOnline =
    Number.isFinite(lastSeenMs) && Date.now() - lastSeenMs < 5 * 60 * 1000;

  const cards = [
    { label: "Present Today", value: presentToday, icon: Users, color: "text-success", bg: "bg-success/10" },
    { label: "Denied Today", value: deniedToday, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Alerts", value: alertsToday, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    {
      label: "Device Status",
      value: isOnline ? "Online" : "Offline",
      icon: Wifi,
      color: isOnline ? "text-success" : "text-destructive",
      bg: isOnline ? "bg-success/10" : "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-card rounded-xl p-5 animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{card.label}</span>
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
