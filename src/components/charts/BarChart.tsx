import { useId } from "react";
import styles from "./charts.module.css";

export interface BarSeries {
  key: string;
  label: string;
  color: string;
}

export interface BarDatum {
  label: string;
  values: Record<string, number>;
}

export interface BarChartProps {
  data: BarDatum[];
  series: BarSeries[];
  /** Stack the series into one bar per datum, otherwise group side by side. */
  stacked?: boolean;
  height?: number;
  formatValue?: (n: number) => string;
  /** Hide the built-in legend (render your own totals legend instead). */
  hideLegend?: boolean;
}

const W = 520;
const PAD = { top: 12, right: 8, bottom: 22, left: 46 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

export function BarChart({
  data,
  series,
  stacked = false,
  height = 200,
  formatValue = (n) => String(n),
  hideLegend = false,
}: BarChartProps) {
  const clip = useId();
  const plotW = W - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const maxRaw = Math.max(
    1,
    ...data.map((d) =>
      stacked
        ? series.reduce((s, se) => s + (d.values[se.key] ?? 0), 0)
        : Math.max(...series.map((se) => d.values[se.key] ?? 0)),
    ),
  );
  const max = niceMax(maxRaw);

  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const bandW = plotW / data.length;
  const barGroupW = bandW * 0.62;
  const barW = stacked ? barGroupW : barGroupW / series.length;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  const totals = series.map((se) => ({
    ...se,
    total: data.reduce((s, d) => s + (d.values[se.key] ?? 0), 0),
  }));

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={`Bar chart: ${series.map((s) => s.label).join(", ")} by ${data.map((d) => d.label).join(", ")}`}
      >
        <defs>
          <clipPath id={clip}>
            <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH + 1} />
          </clipPath>
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" className={styles.axisLabel}>
              {formatValue(t)}
            </text>
          </g>
        ))}

        <g clipPath={`url(#${clip})`}>
          {data.map((d, di) => {
            const cx = PAD.left + di * bandW + bandW / 2;
            if (stacked) {
              let acc = 0;
              return (
                <g key={di}>
                  {series.map((se) => {
                    const v = d.values[se.key] ?? 0;
                    const h = (v / max) * plotH;
                    const yTop = y(acc + v);
                    acc += v;
                    return v > 0 ? (
                      <rect
                        key={se.key}
                        x={cx - barW / 2}
                        y={yTop}
                        width={barW}
                        height={h}
                        fill={se.color}
                      />
                    ) : null;
                  })}
                </g>
              );
            }
            return (
              <g key={di}>
                {series.map((se, si) => {
                  const v = d.values[se.key] ?? 0;
                  const h = (v / max) * plotH;
                  const x = cx - barGroupW / 2 + si * barW;
                  return (
                    <rect key={se.key} x={x + 1} y={y(v)} width={Math.max(0, barW - 2)} height={h} rx={2} fill={se.color} />
                  );
                })}
              </g>
            );
          })}
        </g>

        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--border-strong)" />

        {data.map((d, di) => (
          <text key={di} x={PAD.left + di * bandW + bandW / 2} y={height - 6} className={styles.xLabel}>
            {d.label}
          </text>
        ))}
      </svg>

      {!hideLegend && (
        <div className={styles.legend}>
          {totals.map((t) => (
            <span key={t.key}>
              <i style={{ background: t.color }} />
              {t.label} <b>{formatValue(t.total)}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
