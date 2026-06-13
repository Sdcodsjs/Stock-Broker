
interface Props {
  history: number[];
  ticker: string;
  isUp: boolean;
  width?: number;
  height?: number;
}

export function PriceChart({ history, ticker, isUp, width = 340, height = 110 }: Props) {
  const data = history.length < 2 ? [0, 0] : history;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = { top: 10, right: 8, bottom: 22, left: 46 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;

  const xOf = (i: number) => (i / (data.length - 1)) * W;
  const yOf = (v: number) => H - ((v - min) / range) * H;

  const linePts = data.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');
  const areaPts = `${xOf(0)},${H} ${linePts} ${xOf(data.length - 1)},${H}`;

  const color = isUp ? '#10b981' : '#ef4444';

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: H - f * H,
    label: (min + f * range).toFixed(0),
  }));

  // X-axis ticks (every ~15 points)
  const step = Math.max(1, Math.floor(data.length / 4));
  const xTicks = data.map((_, i) => i).filter(i => i % step === 0 || i === data.length - 1);

  return (
    <div className="price-chart-wrap">
      <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Grid lines */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={0} y1={t.y} x2={W} y2={t.y} stroke="rgba(148,163,184,0.08)" strokeWidth={1} />
              <text x={-6} y={t.y + 4} textAnchor="end" fill="rgba(148,163,184,0.5)" fontSize={9} fontFamily="JetBrains Mono,monospace">
                {t.label}
              </text>
            </g>
          ))}
          {/* X-axis ticks */}
          {xTicks.map(i => (
            <text key={i} x={xOf(i)} y={H + 14} textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize={8} fontFamily="JetBrains Mono,monospace">
              {i === data.length - 1 ? 'now' : `-${data.length - 1 - i}s`}
            </text>
          ))}
          {/* Area */}
          <polygon points={areaPts} fill={`url(#grad-${ticker})`} />
          {/* Line */}
          <polyline points={linePts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* Last point dot */}
          <circle cx={xOf(data.length - 1)} cy={yOf(data[data.length - 1])} r={3} fill={color} />
        </g>
      </svg>
    </div>
  );
}
