import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";

const ProductionOverview = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Production List",
      description: "View and manage all production records",
      icon: "📋",
      path: "/production/",
      bgColor: "bg-blue-50",
      stats: "2,450 Records",
    },
    {
      title: "Production Analysis",
      description: "Summary of production with trends",
      icon: "📊",
      path: "/production/analysis",
      bgColor: "bg-emerald-50",
      stats: "3 Crops Tracked",
    },
    {
      title: "Production Trends",
      description: "View trends by crop and region",
      icon: "📈",
      path: "/production/trends",
      bgColor: "bg-purple-50",
      stats: "7 Year Analysis",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Production Overview
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and analyze crop production data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={() => navigate(card.path)}
              className={`${card.bgColor} rounded-xl p-6 border-2 border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 text-left group`}
            >
              <div
                className={`w-16 h-16 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}
              >
                {card.icon}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {card.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{card.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {card.stats}
                </span>
                <span className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProductionOverview;
