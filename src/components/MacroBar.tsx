import React from 'react';

const COLORS: Record<string, string> = {
  protein: '#3b82f6',
  carbs: '#f59e0b',
  fat: '#ef4444',
};

/** 单个宏量营养素进度条（蛋白/碳水/脂肪）。 */
export default function MacroBar({
  label,
  kind,
  value,
  target,
}: {
  label: string;
  kind: 'protein' | 'carbs' | 'fat';
  value: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#5c6b64',
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(value)} / {Math.round(target)} g
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: '#eef2f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            background: COLORS[kind],
            transition: 'width 0.4s',
          }}
        />
      </div>
    </div>
  );
}
