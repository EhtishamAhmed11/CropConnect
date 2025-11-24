import React from 'react';
import { Clock, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function AlertDetails({ alert }) {
  if (!alert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No alert data available</p>
        </div>
      </div>
    );
  }

  const getSeverityConfig = (severity) => {
    const configs = {
      critical: {
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        border: 'border-red-200',
        badge: 'bg-red-500',
        text: 'text-red-700',
        icon: AlertTriangle,
        iconColor: 'text-red-500'
      },
      high: {
        bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
        border: 'border-orange-200',
        badge: 'bg-orange-500',
        text: 'text-orange-700',
        icon: AlertTriangle,
        iconColor: 'text-orange-500'
      },
      medium: {
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
        border: 'border-yellow-200',
        badge: 'bg-yellow-500',
        text: 'text-yellow-700',
        icon: Info,
        iconColor: 'text-yellow-500'
      },
      low: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        border: 'border-blue-200',
        badge: 'bg-blue-500',
        text: 'text-blue-700',
        icon: Info,
        iconColor: 'text-blue-500'
      }
    };
    return configs[severity?.toLowerCase()] || configs.low;
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { color: 'bg-emerald-500', text: 'text-emerald-700', label: 'Active' },
      resolved: { color: 'bg-gray-400', text: 'text-gray-600', label: 'Resolved' },
      archived: { color: 'bg-gray-300', text: 'text-gray-500', label: 'Archived' }
    };
    return configs[status?.toLowerCase()] || configs.active;
  };

  const severityConfig = getSeverityConfig(alert.severity);
  const statusConfig = getStatusConfig(alert.status);
  const SeverityIcon = severityConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className={`${severityConfig.bg} ${severityConfig.border} border-2 rounded-2xl shadow-xl overflow-hidden mb-6`}>
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={`${severityConfig.badge} rounded-xl p-3 shadow-lg`}>
                  <SeverityIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                    {alert.title}
                  </h1>
                  <div className="flex flex-wrap gap-3">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${severityConfig.badge} text-white shadow-md`}>
                      {alert.severity?.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${statusConfig.color} text-white shadow-md`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/40">
              <p className="text-gray-800 leading-relaxed text-lg">
                {alert.message}
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Created At */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-2.5">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                Created At
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {new Date(alert.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(alert.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Alert Type */}
          {alert.alertType && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2.5">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Alert Type
                </h3>
              </div>
              <p className="text-xl font-bold text-gray-900 capitalize">
                {alert.alertType.replace(/_/g, ' ')}
              </p>
            </div>
          )}
        </div>

        {/* Additional Info */}
        {(alert.province || alert.district || alert.targetRoles?.length > 0) && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alert.province && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Province
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {alert.province}
                  </p>
                </div>
              )}
              {alert.district && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    District
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {alert.district}
                  </p>
                </div>
              )}
              {alert.targetRoles?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Target Roles
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {alert.targetRoles.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}