import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle } from "lucide-react";

type AttendanceItem = {
  id: string | number;
  name: string | null;
  status: string | null;
  timestamp: string | null;
  photo_url?: string | null;
};

const LiveFeed = () => {
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const fetchAttendance = async () => {
      setErrorMessage(null);
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        console.log("Failed to fetch attendance feed:", error);
        setErrorMessage(error.message ?? "Failed to fetch attendance records.");
        return;
      }

      setAttendance((data as AttendanceItem[]) ?? []);
    };

    fetchAttendance();
    const intervalId = window.setInterval(fetchAttendance, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
        Live Attendance Feed
      </h3>
      {errorMessage && (
        <p className="text-xs text-destructive mb-3">
          {errorMessage}
        </p>
      )}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {attendance.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors animate-slide-in"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm border-2 border-border">
              {entry.photo_url ? (
                <img
                  src={entry.photo_url}
                  alt={entry.name ?? "Student photo"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                entry.name?.charAt(0) ?? "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{entry.name ?? "Unknown Student"}</p>
              <p className="text-xs text-muted-foreground">
                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "No timestamp"}
              </p>
            </div>
            {entry.status?.toLowerCase() === "present" ? (
              <div className="flex items-center gap-1 text-xs font-medium text-success">
                <CheckCircle className="w-4 h-4" />
                Present
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-medium text-destructive">
                <XCircle className="w-4 h-4" />
                Denied
              </div>
            )}
          </div>
        ))}
        {attendance.length === 0 && !errorMessage && (
          <p className="text-center text-sm text-muted-foreground py-8">No attendance records found</p>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
