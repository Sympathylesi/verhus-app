import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function WeeklyTrendChart({ lang, entries }) {
  // Group by week
  const weekMap = {};
  (entries || []).forEach(e => {
    const key = `W${e.week_number}`;
    if (!weekMap[key]) weekMap[key] = { week: key, children: 0, doses: 0 };
    weekMap[key].children += (e.total_children_vaccinated || 0);
    weekMap[key].doses += (e.total_doses_administered || 0);
  });
  const lineData = Object.values(weekMap).sort((a, b) => {
    const aw = parseInt(a.week.slice(1));
    const bw = parseInt(b.week.slice(1));
    return aw - bw;
  }).slice(-12);

  // Top/bottom health areas
  const areaMap = {};
  (entries || []).forEach(e => {
    if (!areaMap[e.health_area_name]) areaMap[e.health_area_name] = 0;
    areaMap[e.health_area_name] += (e.total_children_vaccinated || 0);
  });
  const sorted = Object.entries(areaMap).sort((a, b) => b[1] - a[1]);
  const top5 = sorted.slice(0, 5).map(([name, value]) => ({ name: name?.substring(0, 12), value }));
  const bottom5 = sorted.slice(-5).reverse().map(([name, value]) => ({ name: name?.substring(0, 12), value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {lang === 'en' ? 'Weekly Trend' : 'Tendance hebdomadaire'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="children" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 3 }} name={lang === 'en' ? 'Children' : 'Enfants'} />
                <Line type="monotone" dataKey="doses" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Doses" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {lang === 'en' ? 'Top & Bottom Health Areas' : 'Meilleures & pires aires de santé'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...top5, ...bottom5]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0EA5E9" radius={[0, 4, 4, 0]} name={lang === 'en' ? 'Children' : 'Enfants'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}