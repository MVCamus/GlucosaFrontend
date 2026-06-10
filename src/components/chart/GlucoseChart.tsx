import { useMemo, useRef } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useGlucoseStore } from "../../stores/glucoseStore";
import { useRegistryStore } from "../../stores/registryStore";
import { formatReadingsForChart, getGlucoseZoneColor } from "../../utils/chart";

const MOCK_DATA_DATE = "2026-06-03";

export default function GlucoseChart() {
  const dailySummary = useGlucoseStore((s) => s.dailySummary);
  const selectedDate = useGlucoseStore((s) => s.selectedDate);
  const userReadings = useRegistryStore((s) => s.glucoseRecords);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    const userForDate = userReadings.filter((r) => r.timestamp.startsWith(selectedDate));
    const mockForDate = selectedDate === MOCK_DATA_DATE && dailySummary ? dailySummary.glucoseReadings : [];
    const all = [...userForDate, ...mockForDate].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return formatReadingsForChart(all);
  }, [userReadings, selectedDate, dailySummary]);

  const lastReading = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData[chartData.length - 1];
  }, [chartData]);

  if (!dailySummary || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 mx-4 mb-3 shadow-sm text-center text-gray-400">
        Sin datos de glucosa para este día
      </div>
    );
  }

  const chartMinWidth = Math.max(600, chartData.length * 50);

  return (
    <div className="mx-4 mb-3 space-y-3">
      {lastReading && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Última Glicemia Registrada
            </span>
            <span className="text-5xl font-black text-gray-800 tracking-tight mt-1 block">
              {lastReading.glucose} <span className="text-xl font-bold text-gray-400">mg/dL</span>
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 shadow-sm">
              A las {lastReading.time}
            </span>
            <span className="text-[10px] text-gray-400 mt-2 font-medium">
              Día: {new Date(selectedDate + 'T00:00:00').toLocaleDateString("es-CL", { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Curva de glucosa (24h)</h3>
        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
        <div style={{ width: `${chartMinWidth}px`, minWidth: "100%" }}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis domain={[40, 300]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e5e7eb" }} />
              <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={180} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={250} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="glucose" fill="#fed7aa" fillOpacity={0.3} stroke="none" />
              <Line
                type="monotone"
                dataKey="glucose"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={(props: Record<string, unknown>) => {
                  const cx = props.cx as number | undefined;
                  const cy = props.cy as number | undefined;
                  const payload = props.payload as { glucose: number } | undefined;
                  if (cx == null || cy == null || !payload) return null;
                  const color = getGlucoseZoneColor(payload.glucose);
                  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />;
                }}
                activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      {chartData.length > 6 && (
        <div className="text-center pb-2 text-[10px] text-gray-400">← Desliza para ver más horarios →</div>
      )}
    </div>
  </div>
);
}
