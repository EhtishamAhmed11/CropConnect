import React, { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { reportAPI } from "../../api/reportAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import {
  FileText, TrendingUp, ArrowRight, Settings, CheckCircle,
  Download, BarChart3, MapPin, Wheat, Table2, ExternalLink,
  ChevronDown, ChevronUp, FileBarChart, Lightbulb, AlertTriangle,
  Truck, Target, Info, Image, CloudRain, DollarSign, History, ArrowLeft
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area, ComposedChart
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ── Chart Export Utility (Improvement #9) ─────────────────────────────────────
const ExportChartButton = ({ containerRef, fileName = "chart" }) => {
  const handleExport = useCallback(async () => {
    if (!containerRef?.current) return;
    try {
      const svg = containerRef.current.querySelector("svg");
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();
      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.error("Export failed:", e);
    }
  }, [containerRef, fileName]);

  return (
    <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 transition-colors bg-white" title="Export as PNG">
      <Image size={14} /> Export
    </button>
  );
};

// ── Reusable Chart Wrapper ────────────────────────────────────────────────────
const ChartCard = ({ title, description, children, exportName }) => {
  const ref = useRef(null);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <ExportChartButton containerRef={ref} fileName={exportName || title.toLowerCase().replace(/\s+/g, "_")} />
      </div>
      <p className="text-xs text-slate-400 mb-4">{description}</p>
      <div ref={ref}>{children}</div>
    </div>
  );
};

// ── Report Type Card ──────────────────────────────────────────────────────────
const ReportTypeCard = ({ type, title, description, icon: Icon, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group ${isSelected
        ? "border-blue-500 bg-blue-50/60 shadow-xl shadow-blue-500/10"
        : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg"
      }`}
  >
    <div className={`p-4 rounded-2xl w-fit mb-4 transition-colors ${isSelected ? "bg-blue-500 text-white" : "bg-slate-50 text-slate-500 group-hover:bg-slate-100"}`}>
      <Icon size={28} />
    </div>
    <h3 className={`font-bold text-lg mb-2 ${isSelected ? "text-blue-900" : "text-slate-800"}`}>{title}</h3>
    <p className={`text-sm leading-relaxed ${isSelected ? "text-blue-700" : "text-slate-500"}`}>{description}</p>
    {isSelected && (
      <div className="absolute top-4 right-4 text-blue-500">
        <CheckCircle size={24} className="fill-current" />
      </div>
    )}
  </button>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
    </div>
  </div>
);

// ── Insight Card ──────────────────────────────────────────────────────────────
const InsightCard = ({ insight }) => {
  const typeStyles = {
    highlight: { bg: "bg-emerald-50", border: "border-emerald-200", iconColor: "text-emerald-600", icon: Target },
    warning: { bg: "bg-amber-50", border: "border-amber-200", iconColor: "text-amber-600", icon: AlertTriangle },
    danger: { bg: "bg-red-50", border: "border-red-200", iconColor: "text-red-600", icon: AlertTriangle },
    info: { bg: "bg-blue-50", border: "border-blue-200", iconColor: "text-blue-600", icon: Info },
    action: { bg: "bg-purple-50", border: "border-purple-200", iconColor: "text-purple-600", icon: Lightbulb },
  };
  const style = typeStyles[insight.type] || typeStyles.info;
  const IconComp = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border rounded-2xl p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl bg-white shadow-sm ${style.iconColor}`}>
          <IconComp size={18} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm mb-1">{insight.icon} {insight.title}</h4>
          <p className="text-sm text-slate-600 leading-relaxed">{insight.text}</p>
        </div>
      </div>
    </div>
  );
};

// ── Production Charts (with drill-down #10) ───────────────────────────────────
const ProductionCharts = ({ chartData }) => {
  const [drillProvince, setDrillProvince] = useState(null);

  if (!chartData) return null;

  return (
    <div className="space-y-6">
      {/* Production by Province (clickable for drill-down) */}
      {chartData.productionByProvince?.length > 0 && (
        <ChartCard title={drillProvince ? `${drillProvince} — District Details` : "Production by Province"} description={drillProvince ? "Click 'Back' to return to province view" : "Click a bar to drill down into district-level data"} exportName="production_by_province">
          {drillProvince && (
            <button onClick={() => setDrillProvince(null)} className="flex items-center gap-1.5 mb-3 text-sm font-bold text-blue-600 hover:text-blue-700">
              <ArrowLeft size={16} /> Back to Provinces
            </button>
          )}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.productionByProvince}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                onClick={(e) => {
                  if (e?.activeLabel && !drillProvince) setDrillProvince(e.activeLabel);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} tonnes`, 'Production']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} cursor={!drillProvince ? { fill: 'rgba(59, 130, 246, 0.1)' } : undefined} />
                <Bar dataKey="production" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Yield Comparison */}
      {chartData.yieldComparison?.length > 0 && (
        <ChartCard title="Yield Efficiency Comparison" description="Crop yield in tonnes per hectare — higher is better" exportName="yield_comparison">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.yieldComparison} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(value) => [`${value} t/ha`, 'Yield']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="yield" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Historical Trends (Improvement #6) */}
      {chartData.historicalTrends?.length > 1 && (
        <ChartCard title="Historical Production Trends" description="Multi-year production and area cultivated trend lines" exportName="historical_trends">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.historicalTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="production" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" name="Production (t)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="yield" stroke="#8b5cf6" name="Yield (t/ha)" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Weather Overview (Improvement #4) */}
      {chartData.weatherOverview?.length > 0 && (
        <ChartCard title="Weather Conditions Across Districts" description="Current temperature and rainfall levels by district" exportName="weather_overview">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.weatherOverview} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "°C", position: "insideTopLeft", offset: -5 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "mm", position: "insideTopRight", offset: -5 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar yAxisId="right" dataKey="rainfall" fill="rgba(59, 130, 246, 0.6)" name="Rainfall (mm)" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature (°C)" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Market Prices (Improvement #5) */}
      {chartData.marketPrices?.length > 0 && (
        <ChartCard title="Average Market Prices by Crop" description="Current wholesale market average prices (PKR)" exportName="market_prices">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.marketPrices} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
                <Tooltip formatter={(value) => [`PKR ${value.toLocaleString()}`, 'Avg Price']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="avgPrice" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  );
};

// ── Surplus/Deficit Charts ────────────────────────────────────────────────────
const SurplusDeficitCharts = ({ chartData }) => {
  if (!chartData) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        {chartData.statusBreakdown?.length > 0 && (
          <ChartCard title="Status Breakdown" description="Proportion of surplus vs deficit regions" exportName="status_breakdown">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.statusBreakdown.filter(s => s.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                    {chartData.statusBreakdown.filter(s => s.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
        {/* Severity */}
        {chartData.severityBreakdown?.length > 0 && (
          <ChartCard title="Severity Distribution" description="How serious are the deficit regions?" exportName="severity_breakdown">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.severityBreakdown.filter(s => s.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                    {chartData.severityBreakdown.filter(s => s.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>

      {/* Balance by Province */}
      {chartData.balanceByProvince?.length > 0 && (
        <ChartCard title="Surplus vs Deficit by Province" description="Green = food available, Red = food shortage (tonnes)" exportName="balance_by_province">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.balanceByProvince}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [`${value.toLocaleString()} t`, name === 'surplus' ? 'Surplus' : 'Deficit']} />
                <Legend />
                <Bar dataKey="surplus" fill="#10b981" name="Surplus" radius={[6, 6, 0, 0]} barSize={30} />
                <Bar dataKey="deficit" fill="#ef4444" name="Deficit" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Top Deficits */}
      {chartData.topDeficits?.length > 0 && (
        <ChartCard title="Most Critical Deficit Zones" description="Districts with the largest food shortages (tonnes needed)" exportName="top_deficits">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.topDeficits} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={75} />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} t`, 'Deficit']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="deficit" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Historical Trends for Surplus/Deficit */}
      {chartData.historicalTrends?.length > 1 && (
        <ChartCard title="Historical Surplus/Deficit Trends" description="Multi-year net food balance comparison" exportName="sd_historical">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.historicalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="surplus" fill="#10b981" name="Surplus (t)" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="deficit" fill="#ef4444" name="Deficit (t)" radius={[4, 4, 0, 0]} barSize={24} />
                <Line type="monotone" dataKey="netBalance" stroke="#3b82f6" name="Net Balance" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Weather for Deficit Zones */}
      {chartData.weatherOverview?.length > 0 && (
        <ChartCard title="Weather in Report Regions" description="Current conditions across districts" exportName="sd_weather">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.weatherOverview}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar yAxisId="right" dataKey="rainfall" fill="rgba(59, 130, 246, 0.6)" name="Rainfall (mm)" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" name="Temp (°C)" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  );
};

// ── Data Preview Table ────────────────────────────────────────────────────────
const DataPreviewTable = ({ data, reportType }) => {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? data : data.slice(0, 8);

  if (!data || data.length === 0) return null;
  const isProduction = reportType === "production_analysis";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Table2 size={18} className="text-slate-500" />
          <span className="font-bold text-slate-700">Data Preview</span>
          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">{data.length} records</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Crop</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">District</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Province</th>
              {isProduction ? (
                <>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Production</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Area</th>
                </>
              ) : (
                <>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Balance</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3 text-slate-400 font-medium">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{item.cropType?.name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{item.district?.name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{item.province?.name || "—"}</td>
                {isProduction ? (
                  <>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{item.production?.value?.toLocaleString()} {item.production?.unit}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{item.areaCultivated?.value?.toLocaleString()} {item.areaCultivated?.unit}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${item.status === "surplus" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{item.status}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${item.balance >= 0 ? "text-emerald-700" : "text-red-600"}`}>{item.balance >= 0 ? "+" : ""}{item.balance?.toLocaleString()}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 8 && (
        <div className="border-t border-slate-100 px-6 py-3 flex justify-center">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-bold transition-colors">
            {expanded ? <><ChevronUp size={16} /> Show less</> : <><ChevronDown size={16} /> Show all {data.length} records</>}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Report Preview Panel ──────────────────────────────────────────────────────
const ReportPreview = ({ reportType, result, onDownload, downloading, previewRef }) => {
  const { report, data = [], summary, insights = [], chartData } = result;
  const isProduction = reportType === "production_analysis";
  const isSurplus = reportType === "surplus_deficit";

  const stats = isProduction
    ? [
      { label: "Total Records", value: summary?.totalRecords?.toLocaleString() || data.length.toLocaleString(), icon: BarChart3, color: "bg-blue-500" },
      { label: "Total Production", value: `${Math.round(summary?.totalProduction || 0).toLocaleString()} tons`, icon: TrendingUp, color: "bg-emerald-500" },
      { label: "Area Cultivated", value: `${Math.round(summary?.totalArea || 0).toLocaleString()} ha`, icon: MapPin, color: "bg-purple-500" },
    ]
    : [
      { label: "Total Regions", value: summary?.totalRegions?.toLocaleString() || data.length.toLocaleString(), icon: MapPin, color: "bg-blue-500" },
      { label: "Surplus Regions", value: summary?.surplusRegions?.toLocaleString() || "0", icon: TrendingUp, color: "bg-emerald-500" },
      { label: "Deficit Regions", value: summary?.deficitRegions?.toLocaleString() || "0", icon: BarChart3, color: "bg-red-500" },
      { label: "Critical", value: summary?.criticalDeficits?.toLocaleString() || "0", icon: FileText, color: "bg-orange-500" },
    ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div ref={previewRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={18} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Report Generated Successfully</h3>
          <p className="text-sm text-slate-500">
            {report?.title} · {report?.format?.toUpperCase()} · {new Date(report?.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-2 ${stats.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4`}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts */}
      {isProduction && chartData && <ProductionCharts chartData={chartData} />}
      {isSurplus && chartData && <SurplusDeficitCharts chartData={chartData} />}

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
              <Lightbulb size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Decision Support & Insights</h3>
              <p className="text-xs text-slate-500">Actionable recommendations from data, weather, and market analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataPreviewTable data={data} reportType={reportType} />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button onClick={onDownload} disabled={downloading} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-60">
          {downloading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
          {downloading ? "Downloading..." : `Download ${report?.format?.toUpperCase()}`}
        </button>
        <Link to="/reports" className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
          <ExternalLink size={18} /> View All Reports
        </Link>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const GenerateReport = () => {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef(null);
  const [reportType, setReportType] = useState("production_analysis");
  const [generatedResult, setGeneratedResult] = useState(null);

  const [formData, setFormData] = useState({
    title: "", description: "", format: "pdf",
    year: "2024-25", compareYear: "",
    crops: "", provinces: "",
    emailRecipients: "", isScheduled: false, scheduleFrequency: "none",
  });

  const reportTypes = [
    { type: "production_analysis", title: "Production Analysis", description: "Comprehensive yield and output metrics with weather correlation and market insights.", icon: TrendingUp },
    { type: "surplus_deficit", title: "Surplus & Deficit", description: "Critical food security analysis with redistribution routes and risk alerts.", icon: FileBarChart },
    { type: "custom", title: "Custom Report", description: "Generate bespoke reports with specific parameters.", icon: Settings },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleTypeChange = (type) => { setReportType(type); setGeneratedResult(null); };

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedResult(null);
    try {
      let response;
      const crops = formData.crops ? formData.crops.split(",").map((c) => c.trim()) : [];
      const provinces = formData.provinces ? formData.provinces.split(",").map((p) => p.trim()) : [];

      if (reportType === "production_analysis") {
        response = await reportAPI.generateProductionAnalysis({ year: formData.year, crops, provinces, format: formData.format });
      } else if (reportType === "surplus_deficit") {
        response = await reportAPI.generateSurplusDeficit({ year: formData.year, crops, format: formData.format });
      } else {
        response = await reportAPI.generate({
          title: formData.title || `Custom Report - ${formData.year}`,
          description: formData.description || "Custom generated report",
          reportType: "custom",
          parameters: { year: formData.year, crops, provinces },
          format: formData.format,
          isScheduled: formData.isScheduled,
          scheduleFrequency: formData.scheduleFrequency,
        });
      }

      showSuccess("Report generated! Preview is ready below.");
      setGeneratedResult(response.data?.data || response.data);
    } catch (error) {
      showError(error.response?.data?.message || error.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedResult?.report) return;
    setDownloading(true);
    try {
      // Use backend download for ALL formats (PDF, Excel, CSV)
      // This is more reliable and avoids client-side CSS parsing errors (like oklch)
      const res = await reportAPI.downloadReport(generatedResult.report._id);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generatedResult.report.fileName || `report.${formData.format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      showError("Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-extrabold text-slate-800">Generate Report</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Create detailed insights from platform data. Reports include <strong>visual charts</strong>, <strong>weather correlation</strong>, <strong>market analysis</strong>, and <strong>decision support</strong>.
          </p>
        </div>

        {/* Step 1: Type */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">1</div>
            <h3 className="text-base font-bold text-slate-700">Choose Report Type</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reportTypes.map((type) => (
              <ReportTypeCard key={type.type} {...type} isSelected={reportType === type.type} onClick={() => handleTypeChange(type.type)} />
            ))}
          </div>
        </div>

        {/* Step 2: Config */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="text-xl font-bold text-slate-800">Configure Parameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              {reportType === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Report Title</label>
                  <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Q3 Performance Summary" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Data Year</label>
                  <input name="year" value={formData.year} onChange={handleChange} placeholder="2024-25" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Format</label>
                  <select name="format" value={formData.format} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white">
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV Data</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Filter Crops <span className="text-slate-400 font-normal">(optional)</span></label>
                <input name="crops" value={formData.crops} onChange={handleChange} placeholder="e.g. Wheat, Rice" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                <p className="text-xs text-slate-400">Comma-separated values</p>
              </div>
            </div>

            <div className="space-y-5">
              {reportType === "production_analysis" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Provinces <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input name="provinces" value={formData.provinces} onChange={handleChange} placeholder="e.g. Punjab, Sindh" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
              )}
              {reportType === "custom" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Email Recipients</label>
                    <input name="emailRecipients" value={formData.emailRecipients} onChange={handleChange} placeholder="email@example.com" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="isScheduled" checked={formData.isScheduled} onChange={handleChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                      <span className="font-bold text-slate-700">Schedule Recurring</span>
                    </label>
                    {formData.isScheduled && (
                      <select name="scheduleFrequency" value={formData.scheduleFrequency} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200">
                        <option value="none">Select Frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-blue-500/20 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight size={20} />}
              {loading ? "Generating..." : "Generate & Preview"}
            </button>
          </div>
        </div>

        {/* Step 3: Preview */}
        {generatedResult && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="text-xl font-bold text-slate-800">Report Preview & Insights</h3>
            </div>
            <ReportPreview reportType={reportType} result={generatedResult} onDownload={handleDownload} downloading={downloading} previewRef={previewRef} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GenerateReport;
