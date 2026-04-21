import LayoutShell from "@/components/layout/LayoutShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <LayoutShell>{children}</LayoutShell>
    </div>
  );
}
