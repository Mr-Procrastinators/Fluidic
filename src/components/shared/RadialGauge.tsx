import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface RadialGaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
}

export function RadialGauge({ value = 0, max, label, unit, color, size = 120 }: RadialGaugeProps) {
  const safeValue = Number(value) || 0;
  const pct = Math.min((safeValue / max) * 100, 100);
  const data = [{ value: pct, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <RadialBarChart
          width={size}
          height={size}
          cx={size / 2}
          cy={size / 2}
          innerRadius={size * 0.32}
          outerRadius={size * 0.45}
          data={data}
          startAngle={90}
          endAngle={-270}
          barSize={8}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={4} />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>{safeValue.toFixed(1)}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase">{unit}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase text-slate-500 mt-1">{label}</span>
    </div>
  );
}
