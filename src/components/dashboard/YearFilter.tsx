
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays, LoaderCircle } from "lucide-react";

interface YearFilterProps {
  selectedYear: string;
}

export default function YearFilter({
  selectedYear,
}: YearFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const years = Array.from(
    { length: 11 },
    (_, index) => 2020 + index
  );

  function handleChange(value: string) {
    startTransition(() => {
      router.push(`${pathname}?tahun=${value}`);
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
      <CalendarDays size={17} className="shrink-0 text-[#15406A]" />

      <select
        aria-label="Filter tahun dashboard"
        value={selectedYear}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        className="min-w-0 cursor-pointer bg-transparent text-sm font-medium text-slate-700 outline-none disabled:opacity-60"
      >
        <option value="all">Semua Tahun</option>

        {years.map((year) => (
          <option key={year} value={year}>
            Tahun {year}
          </option>
        ))}
      </select>

      {isPending && (
        <LoaderCircle
          size={15}
          className="animate-spin text-[#15406A]"
        />
      )}
    </div>
  );
}
