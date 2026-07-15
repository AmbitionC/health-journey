import React from 'react';

/**
 * 热量环：今日摄入 vs 预算。纯 SVG，超出预算时环变橙红。
 */
export default function KcalRing({
  consumed,
  budget,
  size = 150,
}: {
  consumed: number;
  budget: number;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = budget > 0 ? Math.min(consumed / budget, 1) : 0;
  const over = budget > 0 && consumed > budget;
  const remaining = budget - consumed;
  const color = over ? '#f97316' : '#10b981';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#eef2f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * ratio} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.5s' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: over ? '#f97316' : '#1c2b25',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.abs(Math.round(remaining))}
        </div>
        <div style={{ fontSize: 12, color: '#8d9992' }}>
          {over ? 'kcal 超出' : 'kcal 剩余'}
        </div>
      </div>
    </div>
  );
}
