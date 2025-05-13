'use client';

import { useState } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartDataItem {
  id: string;
  title: string;
  magnitude: number;
  depth: number;
  time: Date;
  place: string;
  coordinates: [number, number];
  type: string;
  status: string;
  url: string;
}

interface ChartPanelProps {
  data: ChartDataItem[];
}

const ChartPanel: React.FC<ChartPanelProps> = ({ data }) => {
  const [activeChart, setActiveChart] = useState<'magnitude' | 'depth' | 'time' | 'distribution'>('magnitude');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const magnitudeData = () => {
    const ranges = [
      { range: '0-1', count: 0 },
      { range: '1-2', count: 0 },
      { range: '2-3', count: 0 },
      { range: '3-4', count: 0 },
      { range: '4-5', count: 0 },
      { range: '5+', count: 0 }
    ];

    data.forEach(item => {
      if (item.magnitude < 1) ranges[0].count++;
      else if (item.magnitude < 2) ranges[1].count++;
      else if (item.magnitude < 3) ranges[2].count++;
      else if (item.magnitude < 4) ranges[3].count++;
      else if (item.magnitude < 5) ranges[4].count++;
      else ranges[5].count++;
    });

    return ranges;
  };

  const depthData = () => {
    const ranges = [
      { range: '0-10', count: 0 },
      { range: '10-30', count: 0 },
      { range: '30-70', count: 0 },
      { range: '70-150', count: 0 },
      { range: '150+', count: 0 }
    ];

    data.forEach(item => {
      if (item.depth < 10) ranges[0].count++;
      else if (item.depth < 30) ranges[1].count++;
      else if (item.depth < 70) ranges[2].count++;
      else if (item.depth < 150) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges;
  };

  const timeData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      hour.setMinutes(0, 0, 0);
      return {
        hour: hour.getHours(),
        time: hour,
        count: 0
      };
    });

    data.forEach(item => {
      const itemHour = item.time.getHours();
      const currentDate = new Date().getDate();
      const itemDate = item.time.getDate();

      if (currentDate === itemDate || (currentDate - itemDate === 1 && new Date().getHours() <= itemHour)) {
        const bucketIndex = hours.findIndex(h => h.hour === itemHour);
        if (bucketIndex !== -1) {
          hours[bucketIndex].count++;
        }
      }
    });

    return hours.map(h => ({
      hour: `${h.hour}:00`,
      count: h.count
    }));
  };

  const distributionData = () => {
    const typeCounts: Record<string, number> = {};

    data.forEach(item => {
      if (!typeCounts[item.type]) {
        typeCounts[item.type] = 0;
      }
      typeCounts[item.type]++;
    });

    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const DistributionChart = () => {
    const distData = distributionData();

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={distData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {distData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex overflow-x-auto mb-4">
        <button
          className={`px-4 py-2 rounded-md mr-2 ${activeChart === 'magnitude'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveChart('magnitude')}
        >
          Magnitude
        </button>
        <button
          className={`px-4 py-2 rounded-md mr-2 ${activeChart === 'depth'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveChart('depth')}
        >
          Profundidade
        </button>
        <button
          className={`px-4 py-2 rounded-md mr-2 ${activeChart === 'time'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveChart('time')}
        >
          Tendência Temporal
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeChart === 'distribution'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveChart('distribution')}
        >
          Distribuição
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow flex-grow">
        <h3 className="text-lg font-semibold mb-4">
          {activeChart === 'magnitude' && 'Distribuição por Magnitude'}
          {activeChart === 'depth' && 'Distribuição por Profundidade (km)'}
          {activeChart === 'time' && 'Atividade nas Últimas 24 Horas'}
          {activeChart === 'distribution' && 'Distribuição por Tipo de Evento'}
        </h3>

        <div className="h-80">
          {activeChart === 'magnitude' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={magnitudeData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Quantidade" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'depth' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depthData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Quantidade" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'time' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Eventos"
                  stroke="#0088FE"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'distribution' && <DistributionChart />}
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;
