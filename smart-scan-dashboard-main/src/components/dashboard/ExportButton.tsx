import { supabase } from "@/lib/supabase";
import { Download } from "lucide-react";
import { toast } from "@/components/ui/sonner";

type AttendanceRow = {
  card_id: string | null;
  name: string | null;
  status: string | null;
  timestamp: string | null;
};

const ExportButton = () => {
  const exportCSV = async () => {
    if (!supabase) {
      toast.error("Supabase is not configured.");
      return;
    }

    const { data, error } = await supabase
      .from("attendance")
      .select("card_id,name,status,timestamp")
      .order("timestamp", { ascending: true });

    if (error) {
      console.log("Failed to export attendance CSV:", error);
      toast.error("Failed to export CSV");
      return;
    }

    const rows = (data as AttendanceRow[]) ?? [];
    if (rows.length === 0) {
      toast.error("No attendance data found.");
      return;
    }

    const toDateKey = (iso: string) => iso.slice(0, 10);
    const formatDateLabel = (isoDate: string) => {
      const d = new Date(`${isoDate}T00:00:00`);
      // Use a longer month label so Excel auto-sizes wider columns.
      // CSV cannot explicitly set column widths.
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
    };

    const allDateKeys = Array.from(
      new Set(
        rows
          .map((row) => row.timestamp)
          .filter((ts): ts is string => Boolean(ts))
          .map((ts) => toDateKey(ts)),
      ),
    ).sort();

    type StudentAgg = {
      cardId: string;
      name: string;
      presentDates: Set<string>;
    };

    const studentMap = new Map<string, StudentAgg>();
    rows.forEach((row) => {
      const cardId = row.card_id?.trim() || "-";
      const studentName = row.name?.trim() || "Unknown";
      const key = cardId !== "-" ? cardId : studentName.toLowerCase();

      if (!studentMap.has(key)) {
        studentMap.set(key, {
          cardId,
          name: studentName,
          presentDates: new Set<string>(),
        });
      }

      if (row.status?.toLowerCase() === "present" && row.timestamp) {
        studentMap.get(key)?.presentDates.add(toDateKey(row.timestamp));
      }
    });

    const headers = [
      "Enrollment No. (Card ID)",
      "Student Name",
      "Total Attended Classes",
      "PERCENTAGE % Attended",
      ...allDateKeys.map(formatDateLabel),
    ];

    const csvRows: string[] = [headers.join(",")];

    Array.from(studentMap.values()).forEach((student) => {
      const attended = student.presentDates.size;
      const totalClasses = allDateKeys.length || 1;
      const pct = Math.round((attended / totalClasses) * 100);
      const isDetainee = pct < 75;
      // Excel often auto-converts large numeric strings to scientific notation.
      // Prefixing with a single quote keeps it as text.
      const rollNoCell = `'${student.cardId}`;
      const pctCell = `${pct}%${isDetainee ? "*" : ""}`;

      const dateValues = allDateKeys.map((dateKey) => (student.presentDates.has(dateKey) ? "1" : ""));

      const row = [
        `"${rollNoCell}"`,
        `"${student.name}"`,
        attended.toString(),
        `"${pctCell}"`,
        ...dateValues,
      ];

      csvRows.push(row.join(","));
    });

    const csv = csvRows.join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportCSV}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-accent transition-colors"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  );
};

export default ExportButton;
