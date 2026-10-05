'use client';

import React from 'react';

export interface RadarDataPoint {
  label: string;
  subscore: string;
  score: number; // 10..160
  fullMark: number; // 160
  color: string;
}

interface SubscoresRadarChartProps {
  scores: {
    literacy: number;
    comprehension: number;
    production: number;
    conversation: number;
  };
  overall?: number;
  targetScores?: {
    literacy?: number;
    comprehension?: number;
    production?: number;
    conversation?: number;
  };
  size?: number;
  showDetails?: boolean;
}

export const SubscoresRadarChart: React.FC<SubscoresRadarChartProps> = ({
  scores,
  overall,
  targetScores,
  size = 320,
  showDetails = true,
}) => {
  const center = size / 2;
  const radius = size * 0.38;

  const axes: { key: keyof typeof scores; name: string; ruName: string; color: string; desc: string }[] = [
    { key: 'literacy', name: 'Literacy', ruName: 'Грамотность', color: '#D2F544', desc: 'Чтение + Письмо' },
    { key: 'comprehension', name: 'Comprehension', ruName: 'Понимание', color: '#10B981', desc: 'Чтение + Аудирование' },
    { key: 'production', name: 'Production', ruName: 'Продукция', color: '#F59E0B', desc: 'Письмо + Говорение' },
    { key: 'conversation', name: 'Conversation', ruName: 'Общение', color: '#3B82F6', desc: 'Аудирование + Говорение' },
  ];

  const totalAxes = axes.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Grid levels (representing 40, 80, 120, 160 points)
  const gridLevels = [40, 80, 120, 160];

  // Helper to calculate coordinates
  const getCoordinates = (value: number, index: number, maxVal = 160) => {
    const norm = Math.max(0, Math.min(1, value / maxVal));
    const r = norm * radius;
    const angle = index * angleStep - Math.PI / 2;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Build polygon path for student scores
  const userPoints = axes.map((axis, i) => getCoordinates(scores[axis.key], i));
  const userPolygonPath = userPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Optional target polygon
  let targetPolygonPath = '';
  if (targetScores) {
    const targetPoints = axes.map((axis, i) =>
      getCoordinates(targetScores[axis.key] || 120, i)
    );
    targetPolygonPath = targetPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Background web circles / diamonds */}
          {gridLevels.map((lvl) => {
            const points = axes.map((_, i) => getCoordinates(lvl, i));
            const path = points.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <g key={lvl}>
                <polygon
                  points={path}
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray={lvl === 160 ? 'none' : '2,2'}
                />
                {/* Scale label on top axis */}
                <text
                  x={center + 4}
                  y={center - (lvl / 160) * radius + 3}
                  fontSize="8"
                  fill="#71717a"
                  fontFamily="monospace"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {/* Radiating axes lines */}
          {axes.map((_, i) => {
            const end = getCoordinates(160, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="#3f3f46"
                strokeWidth="1"
              />
            );
          })}

          {/* Target Benchmark polygon (if provided) */}
          {targetPolygonPath && (
            <polygon
              points={targetPolygonPath}
              fill="rgba(147, 51, 234, 0.08)"
              stroke="#A855F7"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
          )}

          {/* Student score area polygon */}
          <polygon
            points={userPolygonPath}
            fill="rgba(210, 245, 68, 0.22)"
            stroke="#D2F544"
            strokeWidth="2.5"
          />

          {/* Points on vertices */}
          {userPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill={axes[i].color}
              stroke="#0E1012"
              strokeWidth="2"
            />
          ))}

          {/* Axis Labels outside perimeter */}
          {axes.map((axis, i) => {
            const labelPos = getCoordinates(185, i);
            return (
              <g key={axis.key}>
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#F4F4F5"
                >
                  {axis.name}
                </text>
                <text
                  x={labelPos.x}
                  y={labelPos.y + 11}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={axis.color}
                >
                  {scores[axis.key]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
          {axes.map((axis) => (
            <div
              key={axis.key}
              className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-white block">{axis.name}</span>
                <span className="text-[10px] text-neutral-400">{axis.desc}</span>
              </div>
              <span
                className="text-base font-black font-mono px-2 py-0.5 rounded-lg"
                style={{ color: axis.color, backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                {scores[axis.key]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
