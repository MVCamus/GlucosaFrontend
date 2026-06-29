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
import { getLocalDateStr } from "../../utils/date";

export default function GlucoseChart() {
  const dailySummary = useGlucoseStore((s) => s.dailySummary);
  const selectedDate = useGlucoseStore((s) => s.selectedDate);
  const userReadings = useRegistryStore((s) => s.glucoseRecords);
  const insulinRecords = useRegistryStore((s) => s.insulinRecords);
  const foodRecords = useRegistryStore((s) => s.foodRecords);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    const userForDate = userReadings.filter((r) => getLocalDateStr(r.timestamp) === selectedDate);
    const all = [...userForDate].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return formatReadingsForChart(all);
  }, [userReadings, selectedDate, dailySummary]);

  const eventMarkers = useMemo(() => {
    const markers: { time: string; timestamp: string; type: "insulin" | "food"; label: string }[] = [];
    for (const r of insulinRecords) {
      if (getLocalDateStr(r.timestamp) !== selectedDate) continue;
      markers.push({
        time: new Date(r.timestamp).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
        timestamp: r.timestamp,
        type: "insulin",
        label: `${r.units}U`,
      });
    }
    for (const r of foodRecords) {
      if (getLocalDateStr(r.timestamp) !== selectedDate) continue;
      markers.push({
        time: new Date(r.timestamp).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
        timestamp: r.timestamp,
        type: "food",
        label: r.foodType === "pellet" ? "Pellet" : r.foodType === "casera" ? "Casera" : "Mix",
      });
    }
    markers.sort((a, b) => a.time.localeCompare(b.time));
    return markers;
  }, [insulinRecords, foodRecords, selectedDate]);

  const dataTimes = useMemo(() => chartData.map((d) => new Date(d.timestamp).getTime()), [chartData]);
  const dataCount = chartData.length;
  const chartMinWidth = Math.max(600, dataCount * 50);
  const chartContentWidth = chartMinWidth + 5;
  const marginLeft = -15;
  const yMax = useMemo(() => {
    if (dataCount === 0) return 300;
    const maxVal = Math.max(...chartData.map((d) => d.glucose));
    return Math.max(300, Math.ceil((maxVal + 20) / 50) * 50);
  }, [chartData, dataCount]);
  const yMin = 40;

  const markerPositions = useMemo(() => {
    if (dataCount < 2) return [];
    return eventMarkers
      .map((m) => {
        const eventMs = new Date(m.timestamp).getTime();
        for (let i = 0; i < dataTimes.length - 1; i++) {
          if (eventMs >= dataTimes[i] && eventMs <= dataTimes[i + 1]) {
            const diff = dataTimes[i + 1] - dataTimes[i];
            const ratio = diff === 0 ? 0 : (eventMs - dataTimes[i]) / diff;
            const idx = i + ratio;
            const x = marginLeft + idx * chartContentWidth / (dataCount - 1);
            return { ...m, x };
          }
        }
        return null;
      })
      .filter(Boolean) as (typeof eventMarkers[number] & { x: number })[];
  }, [eventMarkers, dataTimes, dataCount, chartContentWidth, marginLeft]);

  const lastReading = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData[chartData.length - 1];
  }, [chartData]);

  if (!dailySummary || chartData.length === 0) {
    return (
      <div id="tour-glucose-chart" className="bg-white rounded-xl p-6 mx-4 mb-3 shadow-sm text-center text-gray-400">
        Sin datos de glucosa para este día
      </div>
    );
  }

  return (
    <div id="tour-glucose-chart" className="mx-4 mb-3 space-y-3">
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
        <div style={{ width: `${chartMinWidth}px`, minWidth: "100%" }} className="relative">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11 }} />
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

              {markerPositions.map((m, i) => (
                <g key={i}>
                  <line
                    x1={m.x}
                    y1={10}
                    x2={m.x}
                    y2={280}
                    stroke={m.type === "insulin" ? "#3b82f6" : "#22c55e"}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                  <rect
                    x={m.x - 10}
                    y={4}
                    width={20}
                    height={16}
                    rx={4}
                    fill={m.type === "insulin" ? "#3b82f6" : "#22c55e"}
                    opacity={0.9}
                  />
                  <text
                    x={m.x}
                    y={15}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight="bold"
                  >
                    {m.type === "insulin" ? "I" : "F"}
                  </text>
                  <title>{m.type === "insulin" ? `Insulina: ${m.label}` : `Comida: ${m.label}`}</title>
                </g>
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      {markerPositions.length > 0 && (
        <div className="flex items-center justify-center gap-4 pb-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Insulina
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Comida
          </span>
          {chartData.length > 6 && <span>← Desliza →</span>}
        </div>
      )}
    </div>
  </div>
);
}
