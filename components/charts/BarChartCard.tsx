"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function BarChartCard({
  title,
  data,
  dataKey = "count",
  nameKey = "name",
}: {
  title: string;
  data: { name: string; count: number }[];
  dataKey?: string;
  nameKey?: string;
}) {
  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#14B8A615" />
              <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #14B8A620",
                  boxShadow: "0 2px 8px rgb(20 184 166 / 0.15)",
                }}
              />
              <Bar dataKey={dataKey} fill="#14B8A6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
