import styles from "./charts.module.css";

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  /** Fill the area under the line (only sensible for a single primary series). */
  area?: boolean;
}

export interface LinePoint {
  label: string;
  values: Record<string, number>;
}

export interface LineChartProps {
  data: LinePoint[];
  series: LineSeries[];
  height?: number;
  formatValue?: (n: number) => string;
  /** Force the y-axis to start at 0. */
  zeroBased?: boolean;
  suffix?: string;
  hideLegend?: boolean;
}

const W = 520;
const PAD = { top: 12, right: 10, bottom: 22, left: 46 };

export function LineChart({
  data,
  series,
  height = 200,
  formatValue = (n) => String(n),
  zeroBased = true,
  suffix = "",
  hideLegend = false,
}: LineChartProps) {
  const plotW = W - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const allValues = data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0));
  const rawMax = Math.max(1, ...allValues);
  const rawMin = zeroBased ? 0 : Math.min(0, ...allValues);
  const max = rawMax * 1.1;
  const min = rawMin;

  const x = (i: number) => PAD.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - ((v - min) / (max - min || 1)) * plotH;

  const ticks = [0, 0.5, 1].map((f) => min + (max - min) * f);

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={`Line chart: ${series.map((s) => s.label).join(", ")}`}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" className={styles.axisLabel}>
              {formatValue(t)}
              {suffix}
            </text>
          </g>
        ))}

        {series.map((s) => {
          const pts = data.map((d, i) => `${x(i)},${y(d.values[s.key] ?? 0)}`).join(" ");
          const last = data[data.length - 1];
          return (
            <g key={s.key}>
              {s.area && data.length > 1 && (
                <polygon
                  points={`${x(0)},${y(min)} ${pts} ${x(data.length - 1)},${y(min)}`}
                  fill={s.color}
                  opacity={0.08}
                />
              )}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {last && <circle cx={x(data.length - 1)} cy={y(last.values[s.key] ?? 0)} r={3.5} fill={s.color} />}
            </g>
          );
        })}

        <line x1={PAD.left} x2={W - PAD.right} y1={y(min)} y2={y(min)} stroke="var(--border-strong)" />

        {data.map((d, i) => (
          <text key={i} x={x(i)} y={height - 6} className={styles.xLabel}>
            {d.label}
          </text>
        ))}
      </svg>

      {!hideLegend && series.length > 1 && (
        <div className={styles.legend}>
          {series.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
