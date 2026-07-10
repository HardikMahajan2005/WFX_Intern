import { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, revenueRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/revenue-by-month"),
      ]);

      setStats(statsRes.data?.data);
      setRevenueData(revenueRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.error?.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDashboardData();
    });
  }, []);

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val) => {
    if (val === undefined || val === null) return "0";
    return new Intl.NumberFormat("en-US").format(val);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel rounded-3xl p-10 text-center space-y-5">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <h3 className="text-2xl font-display font-semibold text-stone-100">Failed to load dashboard</h3>
          <p className="text-sm text-stone-400 mt-2 max-w-md mx-auto">{error}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue),
      subtitle: "Paid invoices",
      icon: DollarSign,
      accent: "text-amber-400",
      tint: "bg-amber-500/10",
    },
    {
      title: "Finished Goods",
      value: formatNumber(stats?.totalFinishedGoods),
      subtitle: "Styles in catalog",
      icon: Package,
      accent: "text-blue-400",
      tint: "bg-blue-500/10",
    },
    {
      title: "Sales Orders",
      value: formatNumber(stats?.totalOrders),
      subtitle: "Total placed orders",
      icon: ShoppingCart,
      accent: "text-emerald-400",
      tint: "bg-emerald-500/10",
    },
    {
      title: "Suppliers",
      value: formatNumber(stats?.totalSuppliers),
      subtitle: "Active vendors",
      icon: Users,
      accent: "text-rose-400",
      tint: "bg-rose-500/10",
    },
    {
      title: "Buyers",
      value: formatNumber(stats?.totalBuyers),
      subtitle: "B2B clients",
      icon: Users,
      accent: "text-violet-400",
      tint: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="space-y-3">
          <span className="text-eyebrow">Overview</span>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-stone-100 tracking-tight">
            Apparel production,{" "}
            <span className="italic text-amber-400">at a glance.</span>
          </h2>
          <p className="text-stone-400 text-sm max-w-md">
            Real-time billing, inventory, and supplier metrics aggregated across the WFX ERP system.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn-ghost self-start md:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-panel glow-card rounded-2xl p-6 relative group flex flex-col justify-between min-h-[150px]"
            >
              <div className="flex justify-end items-start">
                <div className={`p-2.5 rounded-lg ${card.tint} border border-white/5`}>
                  <Icon className={`h-4 w-4 ${card.accent}`} strokeWidth={2.2} />
                </div>
              </div>

              <div className="space-y-1.5 mt-4">
                <div className="text-3xl font-display font-semibold text-stone-100 text-numeral leading-none">
                  {card.value}
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-semibold text-stone-300 tracking-wide">
                    {card.title}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {card.subtitle}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="px-7 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-eyebrow">Trend</span>
              <span className="chip-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Live
              </span>
            </div>
            <h3 className="text-2xl font-display font-semibold text-stone-100 tracking-tight">
              Monthly Revenue
            </h3>
            <p className="text-xs text-stone-500 max-w-md">
              Total billings aggregated across the calendar year, broken down by month.
            </p>
          </div>
        </div>

        <div className="p-7">
          <div className="h-80 w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorRevenueStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f5b800" />
                    </linearGradient>
                    <linearGradient id="colorRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="50%" stopColor="#ec4899" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#f5b800" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#57534e"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    fontWeight={500}
                    tickFormatter={(val) => {
                      if (!val) return "";
                      const [year, month] = val.split("-");
                      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
                      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                    }}
                  />
                  <YAxis
                    stroke="#57534e"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val / 1000}k`}
                    fontWeight={500}
                    width={65}
                  />
                  <Tooltip
                    cursor={{ stroke: "#ec4899", strokeWidth: 1, strokeDasharray: "3 3" }}
                    content={<CustomTooltip />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="url(#colorRevenueStroke)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenueFill)"
                    activeDot={{
                      r: 6,
                      fill: "#ec4899",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-500 text-sm font-medium">
                No revenue data available for trend chart.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const monthStr = payload[0].payload.month;
    let formattedMonth = monthStr;
    if (monthStr) {
      const [year, month] = monthStr.split("-");
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      formattedMonth = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    
    return (
      <div className="px-4 py-3 space-y-1">
        <span className="text-eyebrow-muted block">
          {formattedMonth}
        </span>
        <div className="text-xl font-display font-semibold text-amber-400 text-numeral">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
        <div className="h-12 w-80 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-96 bg-white/5 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="glass-panel rounded-2xl p-6 h-[150px] flex flex-col justify-between animate-pulse"
          >
            <div className="flex justify-between">
              <div className="h-3 w-6 bg-white/5 rounded" />
              <div className="h-9 w-9 bg-white/5 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-24 bg-white/10 rounded" />
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-3xl p-7 h-96 space-y-5 animate-pulse">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-white/5 rounded" />
          <div className="h-7 w-48 bg-white/10 rounded" />
        </div>
        <div className="h-64 bg-white/[0.03] rounded-2xl" />
      </div>
    </div>
  );
}
