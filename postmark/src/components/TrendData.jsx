import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function TrendData({ data, datakeyLine, tooltipText }) {
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 0, left: 20 }}
        >
          <XAxis
            dataKey="year"
            stroke="#888892"
            tick={{ fill: "#888892", fontSize: 12 }}
          />
          <YAxis hide={true} domain={["dataMin - 10000", "dataMax + 10000"]} />
          <Tooltip
            formatter={tooltipText}
            contentStyle={{
              background: "#222226",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#888892" }}
            itemStyle={{ color: "#F5F4F0" }}
          />
          <Line
            type="linear"
            dataKey={datakeyLine}
            stroke="#0D9488"
            strokeWidth={2}
            dot={{ fill: "#0D9488", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
