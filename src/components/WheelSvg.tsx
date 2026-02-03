import { useMemo } from "react";
import { buildSlices } from "../lib/wheelMath.ts";
import type { Entry } from "../types/models.ts";

const RADIUS = 200;
const CX = 220;
const CY = 220;
const LABEL_R = RADIUS * 0.7;

function toSvgAngle(rad: number): number {
  return rad + Math.PI / 2;
}

function polarToXY(angle: number, r: number): { x: number; y: number } {
  const a = toSvgAngle(angle);
  return {
    x: CX + r * Math.cos(a),
    y: CY - r * Math.sin(a),
  };
}

const SLICE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#6366f1",
  "#84cc16",
];

type WheelSvgProps = {
  entries: Entry[];
  rotationRad: number;
  onSpin?: () => void;
};

export function WheelSvg({ entries, rotationRad, onSpin }: WheelSvgProps) {
  const slices = useMemo(() => buildSlices(entries), [entries]);
  const clickable = !!onSpin;

  if (slices.length === 0) {
    return (
      <svg width={440} height={440} className="mx-auto block" aria-hidden="true">
        <circle cx={CX} cy={CY} r={RADIUS} fill="#374151" stroke="#4b5563" strokeWidth={2} />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fill="#9ca3af" fontSize={14}>
          No entries
        </text>
      </svg>
    );
  }

  return (
    <svg
      width={440}
      height={440}
      className={`mx-auto block ${clickable ? "cursor-pointer" : ""}`}
      viewBox="0 0 440 440"
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onSpin : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSpin?.();
              }
            }
          : undefined
      }
      aria-label={clickable ? "Spin the wheel" : undefined}
    >
      <g transform={`rotate(${(rotationRad * 180) / Math.PI} ${CX} ${CY})`}>
        {slices.map((slice, i) => {
          const start = polarToXY(slice.startAngle, RADIUS);
          const end = polarToXY(slice.endAngle, RADIUS);
          const large = slice.endAngle - slice.startAngle > Math.PI ? 1 : 0;
          const path = `M ${CX} ${CY} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${large} 0 ${end.x} ${end.y} Z`;
          const color = SLICE_COLORS[i % SLICE_COLORS.length];
          const labelPos = polarToXY(slice.centerAngle, LABEL_R);
          return (
            <g key={slice.entry.id}>
              <path d={path} fill={color} stroke="#1f2937" strokeWidth={1} />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={12}
                fontWeight="600"
                style={{ pointerEvents: "none" }}
              >
                {slice.entry.name}
              </text>
            </g>
          );
        })}
      </g>
      {/* Pointer on right (3 o'clock), pointing toward center like wheelofnames.com */}
      <polygon
        points={`${CX + RADIUS - 20},${CY} ${CX + RADIUS + 14},${CY - 14} ${CX + RADIUS + 14},${CY + 14}`}
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth={2}
      />
    </svg>
  );
}
