import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, CreditCard, Fingerprint } from "lucide-react";

type AttendanceRow = {
  name: string | null;
  status: string | null;
  card_id: string | null;
};

type RegisteredUser = {
  id: string;
  name: string;
  card_id: string;
  attendancePercent: number;
  classesAttended: number;
  totalClasses: number;
};

const UserManagement = () => {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [name, setName] = useState("");
  const [cardId, setCardId] = useState("");
  const [fingerId, setFingerId] = useState("");

  useEffect(() => {
    if (!supabase) return;

    const fetchRegisteredUsers = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("name,status,card_id")
        .order("timestamp", { ascending: false });

      if (error) {
        console.log("Failed to fetch registered users from attendance:", error);
        return;
      }

      const grouped: Record<string, { name: string; card_id: string; total: number; present: number }> = {};

      ((data as AttendanceRow[]) ?? []).forEach((row) => {
        const rowName = row.name?.trim() ?? "";
        const rowCardId = row.card_id?.trim() ?? "";
        const uniqueKey = rowCardId || rowName.toLowerCase();
        if (!uniqueKey) return;

        if (!grouped[uniqueKey]) {
          grouped[uniqueKey] = {
            name: rowName || "Unknown Student",
            card_id: rowCardId || "-",
            total: 0,
            present: 0,
          };
        }

        grouped[uniqueKey].total += 1;
        if (row.status?.toLowerCase() === "present") {
          grouped[uniqueKey].present += 1;
        }
      });

      const mergedUsers: RegisteredUser[] = Object.entries(grouped).map(([key, value]) => {
        const attendancePercent = value.total === 0 ? 0 : Math.round((value.present / value.total) * 100);
        return {
          id: key,
          name: value.name,
          card_id: value.card_id,
          attendancePercent,
          classesAttended: value.present,
          totalClasses: value.total,
        };
      });

      setUsers(mergedUsers);
    };

    fetchRegisteredUsers();
    const intervalId = window.setInterval(fetchRegisteredUsers, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const addUser = () => {
    if (!name || !cardId || !fingerId) return;
    // Existing add-user form remains for enrollment flow; registered list is sourced from attendance.
    setName("");
    setCardId("");
    setFingerId("");
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Add New User
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Card ID"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="relative">
            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Finger ID"
              value={fingerId}
              onChange={(e) => setFingerId(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <button
          onClick={addUser}
          disabled={!name || !cardId || !fingerId}
          className="mt-3 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Registered Users ({users.length})</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{u.name}</p>
                <p className="text-xs text-muted-foreground">
                  Card: {u.card_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Classes attended: <span className="font-medium text-foreground">{u.classesAttended}</span>
                  {" · "}
                  Total classes: <span className="font-medium text-foreground">{u.totalClasses}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Attendance: <span className="font-medium text-foreground">{u.attendancePercent}%</span>
                </p>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No users registered</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
