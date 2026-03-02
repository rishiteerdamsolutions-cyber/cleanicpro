import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-slate-800">
          DPV License Admin
        </Link>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
