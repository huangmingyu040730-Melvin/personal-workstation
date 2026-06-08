import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_26rem),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <Sidebar />
      <Topbar />
      <main className="mx-auto max-w-[1780px] px-4 py-6 lg:ml-72 lg:px-8 xl:px-10 2xl:px-12">{children}</main>
    </div>
  );
}
