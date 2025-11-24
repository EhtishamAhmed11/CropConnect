import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";

const SurplusDeficitOverview = () => {
  const infoCards = [
    {
      title: "What is Surplus/Deficit?",
      description:
        "Analyze food production balance across regions to determine shortages, surpluses, and required redistribution to maintain food security.",
      icon: "📊",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Why It Matters",
      description:
        "Helps policymakers, NGOs, and distributors understand supply-demand gaps and optimize transportation and resource planning.",
      icon: "💡",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Available Tools",
      description:
        "Calculate balance, view surplus regions, identify deficit areas, and generate redistribution suggestions.",
      icon: "⚙️",
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  const featureCards = [
    {
      title: "Calculate",
      description: "Enter crop + region data to compute surplus or deficit",
      icon: "📊",
      path: "/surplus-deficit/calculate",
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Surplus Regions",
      description: "View regions with strong production and available excess",
      icon: "🟢",
      path: "/surplus-deficit/surplus-regions",
      gradient: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Deficit Regions",
      description: "View areas facing shortages or low production",
      icon: "🔴",
      path: "/surplus-deficit/deficit-regions",
      gradient: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Redistribution",
      description:
        "Generate optimized redistribution plans using surplus regions",
      icon: "🔄",
      path: "/surplus-deficit/redistribution",
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Surplus / Deficit Analysis
          </h1>
          <p className="text-gray-500 mt-1">
            Regional food security and distribution planning
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {infoCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center text-2xl mb-4`}
              >
                {card.icon}
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {card.title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((card, index) => (
              <Link
                key={index}
                to={card.path}
                className={`${card.bgColor} rounded-xl p-6 border-2 border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 group`}
              >
                <div
                  className={`w-16 h-16 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {card.description}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700">
                  <span>Learn more</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
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
