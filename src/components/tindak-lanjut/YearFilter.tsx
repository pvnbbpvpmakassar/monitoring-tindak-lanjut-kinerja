"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays, ChevronDown, LoaderCircle } from "lucide-react";

interface YearFilterProps {
  selectedYear: number;
}

export default function YearFilter({ selectedYear }: YearFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tahun", value);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <CalendarDays
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <select
        value={selectedYear}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        className="h-11 min-w-[145px] appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:border-[#15406A]/40 focus:border-[#15406A] focus:ring-2 focus:ring-[#15406A]/10 disabled:opacity-60"
      >
        {Array.from({ length: 11 }, (_, index) => 2020 + index).map(
          (year) => (
            <option key={year} value={year}>
              Tahun {year}
            </option>
          )
        )}
      </select>

      {isPending ? (
        <LoaderCircle
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#15406A]"
        />
      ) : (
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      )}
    </div>
  );
}