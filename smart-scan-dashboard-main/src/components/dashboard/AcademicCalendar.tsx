import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabase";

type AttendanceRow = {
  status: string;
  timestamp: string;
};

const toDayKey = (date: Date) => date.toISOString().slice(0, 10);

const calcPercentage = (rows: AttendanceRow[]) => {
  if (rows.length === 0) return 0;
  const present = rows.filter((row) => row.status?.toLowerCase() === "present").length;
  return Math.round((present / rows.length) * 100);
};

const AcademicCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const fetchAttendance = async () => {
      const { data, error } = await supabase.from("attendance").select("status,timestamp");
      if (error) {
        console.log("Failed to fetch calendar attendance:", error);
        return;
      }
      setRows((data as AttendanceRow[]) ?? []);
    };

    fetchAttendance();
  }, []);

  const presentDays = useMemo(() => {
    const map = new Map<string, boolean>();
    rows.forEach((row) => {
      const date = new Date(row.timestamp);
      if (Number.isNaN(date.getTime())) return;
      if (row.status?.toLowerCase() === "present") {
        map.set(toDayKey(date), true);
      }
    });
    return Array.from(map.keys()).map((key) => new Date(`${key}T00:00:00`));
  }, [rows]);

  const { dailyPercent, monthlyPercent, yearlyPercent } = useMemo(() => {
    const targetDay = toDayKey(selectedDate);
    const targetMonth = selectedDate.getMonth();
    const targetYear = selectedDate.getFullYear();

    const dailyRows = rows.filter((row) => toDayKey(new Date(row.timestamp)) === targetDay);
    const monthlyRows = rows.filter((row) => {
      const date = new Date(row.timestamp);
      return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
    });
    const yearlyRows = rows.filter((row) => new Date(row.timestamp).getFullYear() === targetYear);

    return {
      dailyPercent: calcPercentage(dailyRows),
      monthlyPercent: calcPercentage(monthlyRows),
      yearlyPercent: calcPercentage(yearlyRows),
    };
  }, [rows, selectedDate]);

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Academic Calendar</h3>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_170px] gap-4">
        <div className="rounded-lg bg-secondary/40 border border-border/50">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={{ presentDay: presentDays }}
            modifiersClassNames={{ presentDay: "bg-success/20 text-success-foreground rounded-md" }}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
            <p className="text-[11px] text-muted-foreground">Yearly</p>
            <p className="text-lg font-semibold text-foreground">{yearlyPercent}%</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
            <p className="text-[11px] text-muted-foreground">Monthly</p>
            <p className="text-lg font-semibold text-foreground">{monthlyPercent}%</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
            <p className="text-[11px] text-muted-foreground">Daily</p>
            <p className="text-lg font-semibold text-foreground">{dailyPercent}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendar;
