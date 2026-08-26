'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AdminPerformanceChartProps {
  monthlyData: { name: string; score: number }[];
}

export default function AdminPerformanceChart({ monthlyData }: AdminPerformanceChartProps) {
  if (monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 font-medium text-sm">
        ยังไม่มีการบันทึกข้อมูลคะแนนสะสมในช่วงนี้
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={monthlyData}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
        />
        <YAxis
          tickFormatter={(value) => `${value}%`}
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
          }}
          labelStyle={{ fontWeight: 'bold', color: '#1F2937' }}
          formatter={(value: number) => [`${value}%`, "คะแนนเฉลี่ยรวม"]}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#10B981"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorScore)"
          dot={{ fill: "#10B981", stroke: "#fff", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
