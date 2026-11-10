import React, { useMemo } from 'react';

const WIDTH = 760;
const HEIGHT = 300;
const PADDING = { top: 20, right: 24, bottom: 48, left: 64 };

const money = (value) => `₹ ${(Number(value) || 0).toFixed(2)}`;

const compactMoney = (value) => {
  const num = Number(value) || 0;
  if (Math.abs(num) >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${num.toFixed(0)}`;
};

const parseDate = (value) => {
  const text = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const shortDate = (value) => {
  const date = parseDate(value);
  if (!date) return String(value || '');
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const fullDate = (value) => {
  const date = parseDate(value);
  if (!date) return String(value || '');
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Responsive SVG line chart comparing the GST-inclusive purchase rate with the
 * printed MRP for one medicine over time. No chart library is needed.
 */
const MedicinePriceChart = ({ points = [] }) => {
  const data = useMemo(
    () => (Array.isArray(points) ? points.filter((point) => point && point.date) : []),
    [points],
  );

  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const values = data
      .flatMap((point) => [Number(point.unitPriceWithGst), Number(point.mrp)])
      .filter((value) => Number.isFinite(value));

    if (values.length === 0) return null;

    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const span = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.1, 1);
    const yMin = Math.max(0, rawMin - span * 0.15);
    const yMax = rawMax + span * 0.15;

    const plotWidth = WIDTH - PADDING.left - PADDING.right;
    const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

    // Space points by their actual purchase date when every date is valid.
    // Falling back to even spacing keeps the chart usable for legacy rows with
    // unusual date strings.
    const times = data.map((point) => parseDate(point.date)?.getTime() ?? null);
    const hasTimeScale =
      times.every((time) => Number.isFinite(time)) && new Set(times).size > 1;
    const minTime = hasTimeScale ? Math.min(...times) : 0;
    const maxTime = hasTimeScale ? Math.max(...times) : 0;

    const xAt = (index) => {
      if (!hasTimeScale) {
        return (
          PADDING.left +
          (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth)
        );
      }

      const ratio = (times[index] - minTime) / (maxTime - minTime);
      return PADDING.left + ratio * plotWidth;
    };
    const yAt = (value) =>
      PADDING.top + ((yMax - Number(value)) / (yMax - yMin)) * plotHeight;

    const linePath = (key) =>
      data
        .map((point, index) => {
          const prefix = index === 0 ? 'M' : 'L';
          return `${prefix} ${xAt(index).toFixed(2)} ${yAt(point[key]).toFixed(2)}`;
        })
        .join(' ');

    const ticks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);

    const labelCount = Math.min(data.length, 6);
    const labelIndices = [
      ...new Set(
        Array.from({ length: labelCount }, (_, index) =>
          Math.round((index / Math.max(1, labelCount - 1)) * (data.length - 1)),
        ),
      ),
    ];

    return { xAt, yAt, linePath, ticks, labelIndices };
  }, [data]);

  if (!chart) return null;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          Unit price + GST
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          MRP
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full text-slate-400 dark:text-slate-500"
        role="img"
        aria-label="Medicine unit price plus GST and MRP history chart"
      >
        {chart.ticks.map((tick, index) => {
          const y = chart.yAt(tick);

          return (
            <g key={`tick-${index}`}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeDasharray={index === 0 ? undefined : '4 4'}
              />
              <text
                x={PADDING.left - 10}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="currentColor"
              >
                {compactMoney(tick)}
              </text>
            </g>
          );
        })}

        <path
          d={chart.linePath('unitPriceWithGst')}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={chart.linePath('mrp')}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((point, index) => (
          <g key={`${point.date}-${index}`}>
            <circle
              cx={chart.xAt(index)}
              cy={chart.yAt(point.unitPriceWithGst)}
              r="3.5"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <title>
                {`${fullDate(point.date)} · Unit price + GST: ${money(point.unitPriceWithGst)} · MRP: ${money(point.mrp)}${point.supplierName ? ` · ${point.supplierName}` : ''}`}
              </title>
            </circle>
            <circle
              cx={chart.xAt(index)}
              cy={chart.yAt(point.mrp)}
              r="3.5"
              fill="#7c3aed"
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <title>
                {`${fullDate(point.date)} · MRP: ${money(point.mrp)} · Unit price + GST: ${money(point.unitPriceWithGst)}${point.supplierName ? ` · ${point.supplierName}` : ''}`}
              </title>
            </circle>
          </g>
        ))}

        {chart.labelIndices.map((index) => (
          <text
            key={`label-${index}`}
            x={chart.xAt(index)}
            y={HEIGHT - 18}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
          >
            {shortDate(data[index].date)}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default MedicinePriceChart;
