import Dashboard from "@/components/Dashboard";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Finanzas
          </h1>

          <Link
            href="/registro"
            className="bg-black text-white px-4 py-2 rounded-full"
          >
            + Día
          </Link>
        </div>

        <Dashboard />
      </div>
    </main>
  );
}