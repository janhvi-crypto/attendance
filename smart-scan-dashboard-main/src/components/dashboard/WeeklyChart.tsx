import {
  type ChartOptions,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type AttendanceRow = {
  status: string | null;
  timestamp: string | null;
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const WeeklyChart = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const fetchAttendance = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("status,timestamp")
        .order("timestamp", { ascending: false });

      if (error) {
        console.log("Failed to fetch weekly attendance:", error);
        return;
      }

      setRows((data as AttendanceRow[]) ?? []);
    };

    fetchAttendance();
    const intervalId = window.setInterval(fetchAttendance, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const { labels, weeklyData } = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }

    const keys = days.map((date) => dayKey(date));
    const counts: Record<string, number> = {};
    keys.forEach((key) => {
      counts[key] = 0;
    });

    rows.forEach((row) => {
      if (row.status?.toLowerCase() !== "present" || !row.timestamp) return;
      const key = dayKey(new Date(row.timestamp));
      if (key in counts) {
        counts[key] += 1;
      }
    });

    const labelsValue = days.map((date) => date.toLocaleDateString(undefined, { weekday: "short" }));
    const dataValue = keys.map((key) => counts[key] ?? 0);

    return { labels: labelsValue, weeklyData: dataValue };
  }, [rows]);

  const data = {
    labels,
    datasets: [
      {
        label: "Attendance",
        data: weeklyData,
        backgroundColor: isDark ? "hsla(175, 80%, 45%, 0.6)" : "hsla(175, 80%, 40%, 0.6)",
        borderColor: isDark ? "hsl(175, 80%, 45%)" : "hsl(175, 80%, 40%)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: isDark ? "#888" : "#666" } },
      y: {
        grid: { color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
        ticks: { color: isDark ? "#888" : "#666" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Attendance</h3>
      <div className="h-[250px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default WeeklyChart;
