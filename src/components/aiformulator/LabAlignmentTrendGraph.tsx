import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HistoryPoint {
  timestamp: string;
  score: number;
  label: string;
}

interface Props {
  history: HistoryPoint[];
}

export const LabAlignmentTrendGraph: React.FC<Props> = ({ history }) => {
  const chartData = useMemo(() => {
    return history.map(point => ({
      ...point,
      displayTime: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      displayDate: new Date(point.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));
  }, [history]);

  const lastScore = history.length > 0 ? history[history.length - 1].score : 0;
  const prevScore = history.length > 1 ? history[history.length - 2].score : lastScore;
  const delta = lastScore - prevScore;

  if (history.length < 2) {
    return (
      <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 h-[300px]">
        <History className="w-10 h-10 text-slate-700" />
        <div className="space-y-1">
          <p className="text-slate-400 font-bold text-sm">Insufficient Data for Trend Analysis</p>
          <p className="text-slate-500 text-xs max-w-[200px]">
            Save your formula multiple times after adjustments to visualize the precision evolution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg h-[300px] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-tight">
            Precision Evolution Trend
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full border ${
            delta > 0 ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30' :
            delta < 0 ? 'bg-rose-950/50 text-rose-400 border-rose-500/30' :
            'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="displayTime" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155', 
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#fff'
              }}
              itemStyle={{ color: '#06b6d4' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#06b6d4" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[10px] text-slate-500 font-medium flex justify-between items-center pt-2 border-t border-slate-800/50">
        <span>Historical precision log (Last {history.length} snapshots)</span>
        <span className="text-cyan-400 font-black">Current: {lastScore}%</span>
      </div>
    </div>
  );
};
