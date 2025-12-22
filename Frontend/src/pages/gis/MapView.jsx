import React, { useState } from "react";
import InteractiveMap from "./InteractiveMap";
import {
  Map,
  Filter,
  Layers,
  Maximize2,
  Info,
  Truck,
  Navigation,
  Calendar,
  ChevronDown
} from "lucide-react";

// Floating Styled Select
const FloatingSelect = ({ icon: Icon, value, onChange, options, label }) => (
  <div className="relative group">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block pl-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
        <Icon size={16} />
      </div>
      <select
        className="w-full pl-10 pr-8 py-3 bg-slate-50/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all cursor-pointer hover:bg-slate-100"
        value={value}
        onChange={onChange}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronDown size={14} />
      </div>
    </div>
  </div>
);

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
    <div className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: color }}></div>
    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</span>
  </div>
);

const MapView = () => {
  const [filter, setFilter] = useState({
    crop: "",
    year: "",
    level: "district",
  });
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-900 font-['Outfit']">

      {/* Map Container */}
      <div className="absolute inset-0 z-0">
        <InteractiveMap filter={filter} onRegionSelect={setSelectedRegion} />
        {/* Overlay Gradient for premium feel */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-900/30 to-transparent"></div>
      </div>

      {/* Floating Header */}
      <div className="absolute top-6 left-6 z-10 flex gap-4">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/20 flex flex-col gap-4 w-72 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <Map size={20} />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-800 text-lg leading-tight">GIS Command</h1>
              <p className="text-xs text-slate-500 font-medium">Regional Production Analysis</p>
            </div>
          </div>

          <div className="space-y-3">
            <FloatingSelect
              icon={Layers}
              label="Crop Layer"
              value={filter.crop}
              onChange={(e) => setFilter({ ...filter, crop: e.target.value })}
              options={[
                { value: "", label: "Select Crop..." },
                { value: "WHEAT", label: "Wheat" },
                { value: "RICE", label: "Rice" },
                { value: "COTTON", label: "Cotton" }, // Added more options
                { value: "MAIZE", label: "Maize" },
                { value: "SUGARCANE", label: "Sugarcane" },
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <FloatingSelect
                icon={Calendar}
                label="Year"
                value={filter.year}
                onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                options={[
                  { value: "", label: "Year..." },
                  { value: "2024", label: "2024-25" },
                  { value: "2023", label: "2023-24" },
                ]}
              />
              <FloatingSelect
                icon={Maximize2}
                label="View Level"
                value={filter.level}
                onChange={(e) => setFilter({ ...filter, level: e.target.value })}
                options={[
                  { value: "district", label: "District" },
                  { value: "province", label: "Province" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel (Right Side) */}
      <div className={`absolute top-6 right-6 bottom-6 w-96 z-10 transition-transform duration-300 ${selectedRegion ? 'translate-x-0' : 'translate-x-[120%]'}`}>
        {selectedRegion && (
          <div className="h-full bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-extrabold mb-1">{selectedRegion.regionName || selectedRegion.name}</h2>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-xs font-bold uppercase backdrop-blur-sm">
                    {filter.level} View
                  </span>
                  {selectedRegion.status && (
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase backdrop-blur-sm ${selectedRegion.status === 'surplus' ? 'bg-emerald-500/20 text-emerald-300' :
                        selectedRegion.status === 'deficit' ? 'bg-red-500/20 text-red-300' :
                          'bg-slate-500/20 text-slate-300'
                      }`}>
                      {selectedRegion.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Info size={80} />
              </div>
            </div>

            {/* Panel Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {selectedRegion.status ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Production</p>
                      <p className="text-xl font-extrabold text-slate-800">{selectedRegion.production?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">Tons</span></p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Consumption</p>
                      <p className="text-xl font-extrabold text-slate-800">{selectedRegion.consumption?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">Tons</span></p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-blue-500 font-bold uppercase">Net Balance</p>
                      {selectedRegion.balance < 0 ? <ArrowDownRight size={16} className="text-red-500" /> : <Navigation size={16} className="text-emerald-500 rotate-45" />}
                    </div>
                    <p className={`text-3xl font-extrabold ${selectedRegion.balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedRegion.balance > 0 ? '+' : ''}{selectedRegion.balance?.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-400 mt-1">Metric Tons</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-slate-600">
                      <span>Self-Sufficiency</span>
                      <span>{selectedRegion.selfSufficiencyRatio || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${selectedRegion.selfSufficiencyRatio >= 100 ? 'bg-emerald-500' :
                            selectedRegion.selfSufficiencyRatio >= 80 ? 'bg-yellow-500' :
                              'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(selectedRegion.selfSufficiencyRatio || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Info size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-sm">Select metrics to view detailed analysis for this region.</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setSelectedRegion(null)}
                className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-6 left-6 z-10 w-72">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/20">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Map Legend</h3>
          <div className="grid grid-cols-2 gap-2">
            <LegendItem color="#10b981" label="Surplus" />
            <LegendItem color="#f59e0b" label="Moderate Deficit" />
            <LegendItem color="#ef4444" label="Critical Deficit" />
            <LegendItem color="#64748b" label="Balanced" />
            <LegendItem color="#e2e8f0" label="No Data" />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-slate-800"></div>
              Suggested Route
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
