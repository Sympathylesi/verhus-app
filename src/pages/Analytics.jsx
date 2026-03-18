import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import CameroonMap from '../components/dashboard/CameroonMap';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const { lang, selectedWeek } = useOutletContext();
  const [year] = selectedWeek.split('-W');

  const { data: entries = [] } = useQuery({
    queryKey: ['entries', year],
    queryFn: () => base44.entities.WeeklyEntry.filter({ year: parseInt(year) }),
  });

  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
  });

  // Coverage by district
  const districtData = {};
  entries.forEach(e => {
    if (!districtData[e.district]) districtData[e.district] = { children: 0, doses: 0 };
    districtData[e.district].children += (e.total_children_vaccinated || 0);
    districtData[e.district].doses += (e.total_doses_administered || 0);
  });
  const barData = Object.entries(districtData)
    .map(([name, d]) => ({ name: name?.substring(0, 15), children: d.children, doses: d.doses }))
    .sort((a, b) => b.children - a.children)
    .slice(0, 10);

  // Status distribution
  const statusCount = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
  entries.forEach(e => { if (statusCount[e.status] !== undefined) statusCount[e.status]++; });
  const pieData = Object.entries(statusCount).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {lang === 'en' ? 'Analytics & Maps' : 'Analyses & Cartes'}
      </h1>

      <CameroonMap lang={lang} healthAreas={healthAreas} entries={entries} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {lang === 'en' ? 'Coverage by District' : 'Couverture par district'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="children" fill="#0EA5E9" radius={[4, 4, 0, 0]} name={lang === 'en' ? 'Children' : 'Enfants'} />
                  <Bar dataKey="doses" fill="#10B981" radius={[4, 4, 0, 0]} name="Doses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {lang === 'en' ? 'Entry Status Distribution' : 'Répartition des statuts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  {lang === 'en' ? 'No data available' : 'Aucune donnée disponible'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}