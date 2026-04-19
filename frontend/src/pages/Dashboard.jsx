import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, Banknote, ShieldCheck, Sparkles, PlusCircle, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [portfolio, setPortfolio] = useState({ liquid_cash: 0, holdings: [], watchlist: [], investment_plan: null });
  const [projections, setProjections] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projYears, setProjYears] = useState(25);

  // Fetch portfolio
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      try {
        const [portRes, marketRes] = await Promise.all([
          fetch(`http://localhost:5001/api/portfolio/${user.id}`),
          fetch('http://localhost:8000/api/market-data')
        ]);
        
        if (portRes.ok) {
          const data = await portRes.json();
          setPortfolio(data);
        }
        if (marketRes.ok) {
          const mdata = await marketRes.json();
          setMarketData(mdata);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  // Fetch growth projections
  useEffect(() => {
    const principal = parseFloat(portfolio.liquid_cash) || 100000;
    const fetchProjections = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/growth-projection?principal=${principal}&monthly=10000&annual_return=12`);
        if (res.ok) {
          const data = await res.json();
          setProjections(data.projections);
        }
      } catch (err) {
        // Fallback: calculate locally
        const r = 0.12 / 12;
        const results = [];
        for (const y of [1,2,3,4,5,6,7,8,9,10,15,25]) {
          let val = principal;
          for (let m = 0; m < y * 12; m++) val = val * (1 + r) + 10000;
          results.push({ year: y, value: Math.round(val), total_invested: Math.round(principal + 10000 * y * 12), gains: Math.round(val - principal - 10000 * y * 12) });
        }
        setProjections(results);
      }
    };
    fetchProjections();
  }, [portfolio.liquid_cash]);

  const totalWealth = (parseFloat(portfolio.liquid_cash) || 0) +
    portfolio.holdings.reduce((sum, h) => sum + (h.shares * h.average_price), 0);

  const allocationData = portfolio.investment_plan?.allocation
    ? Object.entries(portfolio.investment_plan.allocation).map(([name, value]) => ({ name, value }))
    : [];

  // Group market data by category
  const groupedMarket = {};
  marketData.forEach(d => {
    if (!groupedMarket[d.category]) groupedMarket[d.category] = [];
    groupedMarket[d.category].push(d);
  });

  const categoryLabels = {
    INDEX: "Market Indices", STOCK: "Stocks", GOLD: "Precious Metals",
    COMMODITY: "Commodities", BOND: "Bonds & Treasuries", MUTUAL_FUND: "Mutual Funds",
    REAL_ESTATE: "Real Estate", FD: "Fixed Deposits"
  };

  const filteredProjections = projections.filter(p => p.year <= projYears);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse text-lg">Loading your wealth dashboard...</div>;

  return (
    <div className="p-6 md:p-8 pb-24 max-w-7xl mx-auto space-y-8">

      {/* ─── Survey CTA or AI Plan ───────────────────────────── */}
      {!portfolio.investment_plan ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#10b981]/20 via-[#111]/80 to-[#3b82f6]/20 border border-white/10 rounded-[28px] p-10 text-center">
          <div className="relative z-10 max-w-xl mx-auto space-y-5">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border border-white/20">
              <Sparkles className="text-[#10b981] w-7 h-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Build Your AI Financial Plan</h1>
            <p className="text-gray-400 text-base leading-relaxed">
              Take a 3-question survey so our AI can craft a personalized 25-year wealth strategy — covering Gold, Real Estate, Bonds, Mutual Funds, and more.
            </p>
            <button
              onClick={() => navigate('/survey')}
              className="bg-[#10b981] text-black px-8 py-3.5 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg"
            >
              Take the Survey →
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Plan Summary */}
          <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-[28px] p-8 space-y-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-5"><ShieldCheck size={100} /></div>
            <div className="flex items-center gap-2 text-[#10b981]">
              <Sparkles size={16} />
              <span className="font-bold uppercase tracking-widest text-[10px]">AI Investment Plan</span>
            </div>
            <h2 className="text-xl font-bold text-white">Your Long-Term Strategy</h2>
            <p className="text-gray-400 leading-relaxed italic">"{portfolio.investment_plan.plan_summary}"</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {portfolio.investment_plan.advice && Object.entries(portfolio.investment_plan.advice).map(([period, tip], i) => (
                <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[#10b981] text-[10px] font-bold mb-1 uppercase">{period}</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{typeof tip === 'string' ? tip : JSON.stringify(tip)}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Allocation Pie */}
          <div className="bg-[#111] border border-white/5 rounded-[28px] p-6 flex flex-col items-center justify-center">
            <h3 className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Asset Allocation</h3>
            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                    {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
              {allocationData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[10px] text-gray-400">{d.name} ({d.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Net Worth" amount={`₹${totalWealth.toLocaleString('en-IN')}`} icon={Wallet} />
        <StatCard title="Liquid Cash" amount={`₹${(parseFloat(portfolio.liquid_cash) || 0).toLocaleString('en-IN')}`} icon={Banknote} />
        <StatCard title="25Y Projected" amount={projections.length > 0 ? `₹${projections[projections.length - 1].value.toLocaleString('en-IN')}` : "—"} icon={TrendingUp} />
        <StatCard title="Holdings" amount={`${portfolio.holdings.length} assets`} icon={BarChart3} />
      </div>

      {/* ─── Growth Projection Chart ─────────────────────────── */}
      <div className="bg-[#111] border border-white/5 rounded-[28px] p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Wealth Growth Projection</h2>
            <p className="text-gray-500 text-xs">Estimated growth over time (12% avg annual return, ₹10K/mo SIP)</p>
          </div>
          <div className="flex gap-1.5">
            {[5, 10, 15, 25].map(y => (
              <button key={y} onClick={() => setProjYears(y)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${projYears === y ? 'bg-[#10b981] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >{y}Y</button>
            ))}
          </div>
        </div>

        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredProjections}>
              <defs>
                <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="year" stroke="#555" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}Y`} />
              <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                labelFormatter={l => `Year ${l}`}
              />
              <Area type="monotone" dataKey="total_invested" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" name="Invested" />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWealth)" name="Total Value" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gains Breakdown */}
        {filteredProjections.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {filteredProjections.slice(-6).map((p, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-[10px] font-bold uppercase">{p.year} Year{p.year > 1 ? 's' : ''}</p>
                <p className="text-white font-bold text-sm">₹{(p.value / 100000).toFixed(1)}L</p>
                <p className="text-[#10b981] text-[10px]">+₹{(p.gains / 100000).toFixed(1)}L gains</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Market Overview ─────────────────────────────────── */}
      <div className="bg-[#111] border border-white/5 rounded-[28px] p-8 space-y-6">
        <h2 className="text-xl font-bold text-white">Market Overview</h2>

        {Object.entries(groupedMarket).map(([cat, items]) => (
          <div key={cat} className="space-y-3">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{categoryLabels[cat] || cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item, i) => {
                const isPositive = item.change_percent >= 0;
                return (
                  <div key={i} onClick={() => navigate(`/stocks/${item.symbol}`)}
                    className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl p-4 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-gray-500 text-[10px]">{item.symbol}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-white font-bold text-sm">${item.price?.toLocaleString()}</p>
                      <p className={`text-[11px] font-bold ${isPositive ? 'text-[#10b981]' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{item.change_percent?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {marketData.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-8">Market data is loading... (the data service may be fetching prices)</p>
        )}
      </div>

      {/* ─── Your Holdings ───────────────────────────────────── */}
      <div className="bg-[#111] border border-white/5 rounded-[28px] p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Your Holdings</h2>
          <button onClick={() => navigate('/stocks')}
            className="px-4 py-2 bg-[#10b981] text-black font-bold rounded-xl text-xs flex items-center gap-1.5 hover:scale-105 transition-transform"
          >
            <PlusCircle size={14} /> Add Asset
          </button>
        </div>
        
        {portfolio.holdings.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-8 border border-dashed border-white/10 text-center space-y-4">
            <p className="text-gray-500 text-sm">You haven't invested yet. Start diversifying!</p>
            <div className="flex justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold text-xs">Au</div>
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs">RE</div>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center font-bold text-xs">MF</div>
              <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-xs">FD</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {portfolio.holdings.map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div>
                  <p className="text-white font-semibold text-sm">{h.symbol}</p>
                  <p className="text-gray-500 text-[10px] uppercase">{h.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{h.shares} shares</p>
                  <p className="text-gray-400 text-[11px]">avg ₹{parseFloat(h.average_price).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
