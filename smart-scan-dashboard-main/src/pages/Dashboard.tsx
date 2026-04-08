import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
  LayoutDashboard,
  Users,
  Bell,
  Monitor,
  Sun,
  Moon,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import StatsBar from "@/components/dashboard/StatsBar";
import LiveFeed from "@/components/dashboard/LiveFeed";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import WeeklyChart from "@/components/dashboard/WeeklyChart";
import AcademicCalendar from "@/components/dashboard/AcademicCalendar";
import UserManagement from "@/components/dashboard/UserManagement";
import DeviceMonitor from "@/components/dashboard/DeviceMonitor";
import ExportButton from "@/components/dashboard/ExportButton";

type Tab = "overview" | "users" | "alerts" | "devices";

const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "devices", label: "Devices", icon: Monitor },
];

const Dashboard = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-primary-foreground text-sm">BioAttend</h2>
            <p className="text-[10px] text-sidebar-foreground">Smart Biometric System</p>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-sidebar-accent transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="p-3 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground truncate">{user?.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-6 py-3 flex items-center gap-4">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground capitalize">{activeTab}</h1>
          <div className="ml-auto">
            <ExportButton />
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
          {activeTab === "overview" && (
            <>
              <StatsBar />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <LiveFeed />
                <AlertsPanel />
              </div>
              <AcademicCalendar />
              <WeeklyChart />
            </>
          )}
          {activeTab === "users" && <UserManagement />}
          {activeTab === "alerts" && <AlertsPanel fullPage />}
          {activeTab === "devices" && <DeviceMonitor />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
