import { addDays, weekStart } from "@/lib/calc";
import { HEAT, heatLevel } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function Heatmap({
  byDay,
  today,
  weeks = 26,
}: {
  byDay: Map<string, number>;
  today: string;
  weeks?: number;
}) {
  const start = addDays(weekStart(today), -(weeks - 1) * 7);
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {Array.from({ length: weeks }, (_, w) => (
        <div key={w} className="flex flex-col gap-1">
          {Array.from({ length: 7 }, (_, d) => {
            const day = addDays(start, w * 7 + d);
            const m = byDay.get(day) ?? 0;
            return (
              <div
                key={d}
                title={`${day}: ${m} min`}
                className={cn(
                  "h-3 w-3 rounded-[3px]",
                  day > today ? "opacity-0" : HEAT[heatLevel(m)],
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
