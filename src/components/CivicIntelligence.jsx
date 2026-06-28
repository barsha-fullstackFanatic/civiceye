import React, { useMemo, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { AlertTriangle, TrendingUp, CheckCircle, Activity, Lightbulb, Map } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];
const SEVERITY_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#b91c1c'
};

export default function CivicIntelligence({ reports }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let id;
    id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const analytics = useMemo(() => {
    if (!reports || !Array.isArray(reports)) return null;
    
    const totalReports = reports.length;
    if (totalReports === 0) return null;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Group by Hotspots (rounding coords to ~1km precision)
    const hotspotsMap = {};
    const categoryCounts = {};
    const severityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    
    let resolvedCount = 0;
    let pendingCount = 0;
    let verifiedReports = 0;
    
    let todayCount = 0;
    let thisWeekCount = 0;
    let lastWeekCount = 0;
    let thisMonthCount = 0;

    const categoryByWeek = {}; // { category: { thisWeek: 0, lastWeek: 0 } }

    reports.forEach(r => {
      // Status
      if (r.status === 'RESOLVED') resolvedCount++;
      else if (r.status === 'PENDING') pendingCount++;
      
      // Verifications
      if (r.verificationCount > 0) verifiedReports++;

      // Severities
      if (severityCounts[r.severity] !== undefined) {
        severityCounts[r.severity]++;
      }

      // Categories
      const cat = r.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      
      if (!categoryByWeek[cat]) {
        categoryByWeek[cat] = { thisWeek: 0, lastWeek: 0 };
      }

      // Time based
      const createdAt = r.createdAt?.toMillis ? r.createdAt.toMillis() : now;
      const diffDays = (now - createdAt) / oneDay;
      
      if (diffDays <= 1) todayCount++;
      if (diffDays <= 7) {
        thisWeekCount++;
        categoryByWeek[cat].thisWeek++;
      } else if (diffDays <= 14) {
        lastWeekCount++;
        categoryByWeek[cat].lastWeek++;
      }
      if (diffDays <= 30) thisMonthCount++;

      // Hotspots
      if (r.latitude !== undefined && r.longitude !== undefined && r.latitude !== null && r.longitude !== null) {
        // ~1km grid
        const lat = Number(r.latitude);
        const lng = Number(r.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
          if (!hotspotsMap[key]) hotspotsMap[key] = { count: 0, categories: {}, reports: [] };
          hotspotsMap[key].count += 1;
          hotspotsMap[key].categories[cat] = (hotspotsMap[key].categories[cat] || 0) + 1;
          hotspotsMap[key].reports.push(r);
        }
      }
    });

    // Process Hotspots
    const topHotspots = Object.keys(hotspotsMap)
      .map(k => {
        const h = hotspotsMap[k];
        const domCat = Object.keys(h.categories).reduce((a, b) => h.categories[a] > h.categories[b] ? a : b);
        return { loc: k, count: h.count, dominant: domCat, reports: h.reports };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Categories array for charts
    const categoryData = Object.keys(categoryCounts)
      .map(k => ({ name: k, value: categoryCounts[k] }))
      .sort((a, b) => b.value - a.value);

    // Severity array for pie chart
    const severityData = [
      { name: 'Low', value: severityCounts.LOW, color: SEVERITY_COLORS.LOW },
      { name: 'Medium', value: severityCounts.MEDIUM, color: SEVERITY_COLORS.MEDIUM },
      { name: 'High', value: severityCounts.HIGH, color: SEVERITY_COLORS.HIGH },
      { name: 'Critical', value: severityCounts.CRITICAL, color: SEVERITY_COLORS.CRITICAL }
    ].filter(d => d.value > 0);

    // Predictive Insights
    const insights = [];
    
    // Growth trend insight
    if (thisWeekCount > lastWeekCount && lastWeekCount > 0) {
      const g = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
      insights.push(`Overall report volume has increased by ${g}% compared to last week.`);
    }

    // Category trends
    Object.keys(categoryByWeek).forEach(cat => {
      const t = categoryByWeek[cat].thisWeek;
      const l = categoryByWeek[cat].lastWeek;
      if (t > l && l > 0 && t >= 3) {
        insights.push(`${cat} issues are multiplying, up from ${l} to ${t} this week.`);
      }
    });

    if (topHotspots.length > 0 && topHotspots[0].count >= 3) {
      insights.push(`Zone ${topHotspots[0].loc} has become a high-risk hotspot primarily for ${topHotspots[0].dominant}.`);
    }

    if (pendingCount > resolvedCount * 2) {
      insights.push(`Backlog warning: Pending issues (${pendingCount}) significantly outpace resolutions.`);
    }

    // Averages
    const avgResolutionRate = ((resolvedCount / totalReports) * 100).toFixed(1);
    const participationRate = ((verifiedReports / totalReports) * 100).toFixed(1);
    const highSeverityRate = (((severityCounts.HIGH + severityCounts.CRITICAL) / totalReports) * 100).toFixed(1);

    return {
      totalReports, todayCount, thisWeekCount, thisMonthCount,
      topHotspots, categoryData, severityData, insights,
      avgResolutionRate, pendingCount, resolvedCount, participationRate, highSeverityRate
    };

  }, [reports]);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        <Activity className="w-5 h-5 mr-2 opacity-50" />
        Insufficient data to generate civic intelligence.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Top Value Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] p-5 rounded-2xl hover:border-neutral-700/80 transition-all duration-200">
          <div className="text-[11px] text-neutral-400 mb-2 font-semibold tracking-widest uppercase drop-shadow-sm">New This Week</div>
          <div className="text-4xl font-bold tracking-tight text-white border-b border-neutral-800/80 pb-3 mb-3">{analytics.thisWeekCount}</div>
          <div className="text-xs text-neutral-500 font-medium">{analytics.todayCount} today • {analytics.thisMonthCount} this month</div>
        </div>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] p-5 rounded-2xl hover:border-neutral-700/80 transition-all duration-200">
          <div className="text-[11px] text-neutral-400 mb-2 font-semibold tracking-widest uppercase flex items-center gap-1.5 drop-shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Resolution Rate
          </div>
          <div className="text-4xl font-bold tracking-tight text-emerald-400 border-b border-neutral-800/80 pb-3 mb-3">{analytics.avgResolutionRate}%</div>
          <div className="text-xs text-neutral-500 font-medium">{analytics.resolvedCount} Resolved / {analytics.pendingCount} Pending</div>
        </div>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] p-5 rounded-2xl hover:border-neutral-700/80 transition-all duration-200">
          <div className="text-[11px] text-neutral-400 mb-2 font-semibold tracking-widest uppercase flex items-center gap-1.5 drop-shadow-sm">
            <AlertTriangle className="w-4 h-4 text-red-500" /> High Severity
          </div>
          <div className="text-4xl font-bold tracking-tight text-red-400 border-b border-neutral-800/80 pb-3 mb-3">{analytics.highSeverityRate}%</div>
          <div className="text-xs text-neutral-500 font-medium">Critical & High priority volume</div>
        </div>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] p-5 rounded-2xl hover:border-neutral-700/80 transition-all duration-200">
          <div className="text-[11px] text-neutral-400 mb-2 font-semibold tracking-widest uppercase flex items-center gap-1.5 drop-shadow-sm">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Civic Engagement
          </div>
          <div className="text-4xl font-bold tracking-tight text-indigo-400 border-b border-neutral-800/80 pb-3 mb-3">{analytics.participationRate}%</div>
          <div className="text-xs text-neutral-500 font-medium">Reports with community verification</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Insights */}
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] rounded-2xl p-6 w-full flex flex-col">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-neutral-100 tracking-tight">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Predictive Risk Insights
          </h2>
          <div className="flex-1 space-y-3">
            {analytics.insights.length > 0 ? (
              analytics.insights.map((insight, idx) => (
                <div key={idx} className="bg-neutral-950/80 border border-neutral-800/60 p-4 rounded-xl text-sm text-neutral-300 leading-relaxed flex gap-3 items-start shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] hover:border-neutral-700 transition-colors duration-200">
                  <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full flex-none shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  {insight}
                </div>
              ))
            ) : (
              <div className="text-sm text-neutral-500 py-4 text-center">Stable conditions. No significant anomalies detected.</div>
            )}
          </div>
        </div>

        {/* Top Hotspots */}
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] rounded-2xl p-6 w-full">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-neutral-100 tracking-tight">
            <Map className="w-5 h-5 text-blue-400" />
            Top Hotspots (1km zones)
          </h2>
          <div className="space-y-3">
            {analytics.topHotspots.map((hotspot, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800/60 hover:border-neutral-700/80 transition-colors duration-200 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] hover:bg-neutral-900/50 cursor-pointer"
                onClick={() => {
                  const casesStr = hotspot.reports.slice(0, 3).map(r => (r.title || r.category).replace('Demo: ', '')).join(' • ');
                  toast.custom((t) => (
                    <div className={`${t.visible ? 'animate-in fade-in zoom-in duration-300' : 'animate-out fade-out zoom-out duration-200'} max-w-sm w-full bg-[#0E0620]/95 backdrop-blur-xl shadow-lg rounded-xl border border-blue-500/30 p-4 flex flex-col gap-2`}>
                      <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-blue-400" />
                        <h4 className="font-bold text-white text-sm">Zone {hotspot.loc}</h4>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Contains {hotspot.count} cases. Recent reports include: {casesStr}{hotspot.count > 3 ? '...' : '.'}
                      </p>
                    </div>
                  ), { duration: 4000 });
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-neutral-800/80 flex items-center justify-center text-xs font-bold text-neutral-400 border border-neutral-700/50 shadow-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-200 tracking-tight">Zone {hotspot.loc}</div>
                    <div className="text-xs text-neutral-500 font-medium mt-0.5 tracking-wide">Dominant: {hotspot.dominant}</div>
                  </div>
                </div>
                <div className="text-sm font-bold bg-neutral-800/80 border border-neutral-700/50 px-3 py-1 rounded-lg text-neutral-300 shadow-sm">
                  {hotspot.count} cases
                </div>
              </div>
            ))}
            {analytics.topHotspots.length === 0 && (
              <div className="text-sm text-neutral-500 py-4 text-center">No location clusters identified yet.</div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Distribution Chart */}
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] rounded-2xl p-6 w-full h-[320px] min-h-[320px] min-w-0 flex flex-col hover:border-neutral-700/80 transition-colors duration-200">
          <h2 className="text-[11px] font-bold text-neutral-400 mb-4 uppercase tracking-widest drop-shadow-sm">Category Distribution</h2>
          <div className="flex-1 min-h-[200px] w-full min-w-0 relative">
            {mounted && analytics.categoryData.length > 0 ? (
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={analytics.categoryData.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12, fontWeight: 500 }} width={120} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#e5e5e5' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-500">No category data available</div>
            )}
          </div>
        </div>

        {/* Severity Intelligence */}
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] rounded-2xl p-6 w-full h-[320px] min-h-[320px] min-w-0 flex flex-col hover:border-neutral-700/80 transition-colors duration-200">
          <h2 className="text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-widest drop-shadow-sm">Severity Profile</h2>
          <div className="flex-1 min-h-[200px] w-full min-w-0 relative flex items-center justify-center">
            {mounted && analytics.severityData.length > 0 ? (
              <>
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={analytics.severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {analytics.severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-3 z-10 pointer-events-none">
                  {analytics.severityData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></div>
                      <div className="text-xs text-neutral-300 w-16 drop-shadow-md">{d.name}</div>
                      <div className="text-xs font-bold text-neutral-400 drop-shadow-md">{d.value}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-neutral-500">No severity data available</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
