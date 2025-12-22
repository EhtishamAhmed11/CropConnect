import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import {
  Target,
  Zap,
  Truck,
  ArrowRight,
  Calculator,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const SurplusDeficitOverview = () => {
  const infoCards = [
    {
      title: "Regional Balance",
      description: "Understand supply-demand gaps across districts for better planning.",
      icon: <Target className="text-blue-600" size={24} />,
      bg: "bg-blue-50",
    },
    {
      title: "Strategic Impact",
      description: "Data-driven insights to reduce wastage and hunger effectively.",
      icon: <Zap className="text-emerald-600" size={24} />,
      bg: "bg-emerald-50",
    },
    {
      title: "Optimization Tools",
      description: "Algorithms to suggest optimal redistribution routes.",
      icon: <Truck className="text-indigo-600" size={24} />,
      bg: "bg-indigo-50",
    },
  ];

  const featureCards = [
    {
      title: "Calculator",
      description: "Compute surplus or deficit using production vs consumption data.",
      icon: <Calculator size={20} />,
      path: "/surplus-deficit/calculate",
      color: "blue",
    },
    {
      title: "Surplus Zones",
      description: "Identify regions with excess production capacity.",
      icon: <TrendingUp size={20} />,
      path: "/surplus-deficit/surplus-regions",
      color: "emerald",
    },
    {
      title: "Deficit Zones",
      description: "Map areas facing shortages requiring intervention.",
      icon: <TrendingDown size={20} />,
      path: "/surplus-deficit/deficit-regions",
      color: "red",
    },
    {
      title: "Redistribution",
      description: "Generate logistical plans to move food efficiently.",
      icon: <Truck size={20} />,
      path: "/surplus-deficit/redistribution",
      color: "indigo",
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 font-sans">

        {/* Simple Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Surplus & Deficit Analysis
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-3xl">
            Master regional food supply. Identify shortages, manage abundance, and orchestrate logistics with data-driven insights.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/surplus-deficit/calculate"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              Start Analysis <ArrowRight size={18} />
            </Link>
            <Link
              to="/surplus-deficit/redistribution"
              className="px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              View Logistics
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {infoCards.map((card, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center mb-4`}>
                {card.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{card.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Modules Grid */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Tools & Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((card, index) => (
              <Link
                key={index}
                to={card.path}
                className="block bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all group"
              >
                <div className={`w-10 h-10 rounded-full bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center mb-4 group-hover:bg-${card.color}-600 group-hover:text-white transition-colors`}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{card.title}</h3>
                <p className="text-slate-500 text-sm mb-4 min-h-[40px]">{card.description}</p>
                <div className="flex items-center text-indigo-600 text-sm font-medium">
                  Open Tool <ArrowRight size={16} className="ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default SurplusDeficitOverview;
