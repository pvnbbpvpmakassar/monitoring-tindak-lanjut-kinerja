
export const instant = false;

import { connection } from "next/server";
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Wallet,
} from "lucide-react";

import YearFilter from "@/components/dashboard/YearFilter";
import StatCard from "@/components/dashboard/StatCard";
import { getDashboardSummary } from "@/lib/db/queries";

interface DashboardPageProps {
  searchParams: Promise<{
    tahun?: string | string[];
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  await connection();

  const params = await searchParams;
  const currentYear = new Date().getFullYear();

  const rawYear = Array.isArray(params.tahun)
    ? params.tahun[0]
    : params.tahun;

  let selectedYear: number | null;

  if (rawYear === "all") {
    selectedYear = null;
  } else if (
    rawYear &&
    /^\d{4}$/.test(rawYear) &&
    Number(rawYear) >= 2020 &&
    Number(rawYear) <= 2030
  ) {
    selectedYear = Number(rawYear);
  } else {
    selectedYear = currentYear;
  }

  const selectedYearValue =
    selectedYear === null ? "all" : String(selectedYear);

  const summary = await getDashboardSummary(selectedYear);

  const periodLabel =
    selectedYear === null
      ? "Seluruh periode 2020–2030"
      : `Tahun ${selectedYear}`;

  return (
    <div className="space-y-8">
      {/* Page introduction */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-[#15406A]">
            Ringkasan Monitoring
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#172b42] sm:text-3xl">
            Dashboard
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Pantau perkembangan tindak lanjut hasil pemeriksaan
            dan penyelesaian kewajiban.
          </p>
        </div>

        <YearFilter selectedYear={selectedYearValue} />
      </section>

      {/* Statistics */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-800">
            Ringkasan Data
          </h3>

          <span className="rounded-full bg-[#15406A]/5 px-3 py-1 text-xs font-medium text-[#15406A]">
            {periodLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Belum Ditindaklanjuti"
            value={summary.belumDitindaklanjuti}
            description="Temuan yang belum memiliki laporan tindak lanjut."
            icon={ClipboardList}
            color="blue"
          />

          <StatCard
            title="Belum Sesuai"
            value={summary.belumSesuai}
            description="Laporan tindak lanjut yang belum dinyatakan sesuai."
            icon={AlertCircle}
            color="amber"
          />

          <StatCard
            title="Sesuai"
            value={summary.sesuai}
            description="Laporan tindak lanjut yang telah dinyatakan sesuai."
            icon={CheckCircle2}
            color="green"
          />

          <StatCard
            title="Sisa Kewajiban"
            value={summary.sisaKewajiban}
            description="Akumulasi nilai temuan yang belum disetor."
            icon={Wallet}
            color="red"
            format="currency"
          />
        </div>
      </section>

      {/* Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#15406A]">
            <ClipboardList size={20} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Informasi Monitoring
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Data ringkasan di atas diambil langsung dari database
              dan mengikuti filter periode yang dipilih. Untuk
              melihat informasi setiap temuan beserta laporan dan
              bukti dukungnya, silakan buka menu Tindak Lanjut.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
