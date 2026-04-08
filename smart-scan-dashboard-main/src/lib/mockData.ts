// Mock data helpers — replace with Firebase later

const names = ["Aarav Sharma", "Priya Patel", "Rohan Gupta", "Sneha Verma", "Vikram Singh", "Ananya Rao", "Karan Mehta", "Divya Joshi"];

const now = Date.now();
const hour = 3600000;

export interface AttendanceEntry {
  id: string;
  name: string;
  timestamp: string;
  photo: string;
  status: "present" | "denied";
}

export interface AlertEntry {
  id: string;
  reason: string;
  timestamp: string;
}

export interface UserEntry {
  id: string;
  name: string;
  card_id: string;
  finger_id: string;
}

export interface DeviceStatus {
  last_seen: string;
  firmware: string;
  uptime: string;
}

export const mockAttendance: AttendanceEntry[] = names.map((name, i) => ({
  id: `att-${i}`,
  name,
  timestamp: new Date(now - i * hour * 0.5).toISOString(),
  photo: "",
  status: i % 5 === 0 ? "denied" : "present",
}));

export const mockAlerts: AlertEntry[] = [
  { id: "a1", reason: "unknown_card", timestamp: new Date(now - hour).toISOString() },
  { id: "a2", reason: "finger_mismatch", timestamp: new Date(now - hour * 2).toISOString() },
  { id: "a3", reason: "loitering", timestamp: new Date(now - hour * 3).toISOString() },
  { id: "a4", reason: "duplicate_scan", timestamp: new Date(now - hour * 4).toISOString() },
  { id: "a5", reason: "after_hours", timestamp: new Date(now - hour * 6).toISOString() },
];

export const mockUsers: UserEntry[] = names.slice(0, 5).map((name, i) => ({
  id: `u-${i}`,
  name,
  card_id: `CARD-${1000 + i}`,
  finger_id: `FP-${200 + i}`,
}));

export const mockDevice: DeviceStatus = {
  last_seen: new Date(now - 60000).toISOString(), // 1 min ago → online
  firmware: "v2.4.1",
  uptime: "3d 14h 22m",
};

export const mockWeeklyData = [12, 18, 15, 20, 17, 8, 5];
