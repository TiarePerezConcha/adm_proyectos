import React, { useState } from 'react';
import { Search, RotateCw, ArrowUpDown, Globe, TrendingUp } from 'lucide-react';
import { AppState } from '../../utils/storage';

interface SeoRankingViewProps {
  state: AppState;
}

export const SeoRankingView: React.FC<SeoRankingViewProps> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'clicks' | 'impressions' | 'ctr' | 'position'>('clicks');
  const [timeRange, setTimeRange] = useState('28d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const keywords = [...state.seoKeywords];

  const filtered = keywords
    .filter((k) => k.query.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'position') return a.position - b.position;
      return b[sortBy] - a[sortBy];
    });

  const totalClicks = keywords.reduce((sum, k) => sum + k.clicks, 0);
  const totalImpressions = keywords.reduce((sum, k) => sum + k.impressions, 0);
  const avgCtr = (totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0).toFixed(1);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Title & Description */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 font-mono">
          <Search className="w-5 h-5 text-emerald-400" />
          SEO Ranking
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Tracking de posición en Google Search Console para palabras clave en Chile.
        </p>
      </div>

      {/* KPI Top Cards (Exact dark layout from screenshots) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl">
          <div className="text-xs font-mono text-slate-400">Queries GSC</div>
          <div className="text-3xl font-mono font-bold text-white mt-2">{keywords.length}</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl">
          <div className="text-xs font-mono text-slate-400">Clicks totales</div>
          <div className="text-3xl font-mono font-bold text-white mt-2">{totalClicks}</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl">
          <div className="text-xs font-mono text-slate-400">Impresiones</div>
          <div className="text-3xl font-mono font-bold text-white mt-2">{totalImpressions}</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl">
          <div className="text-xs font-mono text-slate-400">CTR prom.</div>
          <div className="text-3xl font-mono font-bold text-white mt-2">{avgCtr}%</div>
        </div>
      </div>

      {/* Filter and Refresh Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[#12151C] border border-[#202634] text-xs font-mono text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="28d">Últimos 28 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#12151C] border border-[#202634] px-3 py-2 rounded-lg">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Search Console: Chile (.cl)</span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-[#12151C] border border-[#202634] hover:border-emerald-500/50 text-xs font-mono text-slate-200 rounded-lg transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#12151C] border border-[#202634] p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar query..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0A0C10] border border-[#202634] text-xs font-mono text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="clicks">Clicks</option>
            <option value="impressions">Impresiones</option>
            <option value="ctr">CTR</option>
            <option value="position">Mejor Posición</option>
          </select>
        </div>
      </div>

      {/* Queries Table */}
      <div className="bg-[#12151C] border border-[#202634] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0E1117] border-b border-[#202634] text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Query</th>
                <th className="py-3 px-4 font-semibold text-right">Clicks</th>
                <th className="py-3 px-4 font-semibold text-right">Impr.</th>
                <th className="py-3 px-4 font-semibold text-right">CTR</th>
                <th className="py-3 px-4 font-semibold text-right">Posición</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b202c]">
              {filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#161a24] transition-colors">
                  <td className="py-3 px-4 text-white font-medium flex items-center gap-2">
                    <span>{item.query}</span>
                    {item.trend === 'up' && (
                      <span title="Posición en alza">
                        <TrendingUp className="w-3 h-3 text-emerald-400 inline" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300 font-bold">{item.clicks}</td>
                  <td className="py-3 px-4 text-right text-slate-400">{item.impressions}</td>
                  <td className="py-3 px-4 text-right text-slate-400">{item.ctr.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-bold ${
                        item.position <= 3
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : item.position <= 10
                          ? 'bg-sky-950 text-sky-400 border border-sky-800/50'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      #{item.position.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-[#0E1117] border-t border-[#202634] flex items-center justify-between text-xs font-mono text-slate-500">
          <span>1-{filtered.length} de {keywords.length}</span>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 rounded bg-[#161a24] text-slate-300 hover:text-white">&lt;</button>
            <span>1 / 1</span>
            <button className="px-2 py-1 rounded bg-[#161a24] text-slate-300 hover:text-white">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};
