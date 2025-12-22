import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { reportAPI } from "../../api/reportAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/common/Loading";
import {
  FileText,
  Download,
  Trash2,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  File
} from "lucide-react";

// Report Card
const ReportCard = ({ report, onDelete, onDownload, onClick }) => {
  const getIcon = (format) => {
    if (format === 'excel' || format === 'csv') return <FileSpreadsheet className="text-emerald-500" size={24} />;
    if (format === 'pdf') return <FileText className="text-red-500" size={24} />;
    return <File className="text-slate-500" size={24} />;
  }

  const getStatusColor = (status) => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'generating') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status === 'failed') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <div onClick={onClick} className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
        <FileText size={80} />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">
            {getIcon(report.format)}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{report.title}</h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 mb-2 h-8">{report.description || "No description provided."}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(report.status)}`}>
                {report.status}
              </span>
              <span className="text-slate-400 text-xs font-medium">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {report.status === 'completed' && report.fileUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(report); }}
              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-500 hover:text-white transition-colors"
              title="Download"
            >
              <Download size={16} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(report._id); }}
            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-red-500 hover:text-white transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportList = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useAlert();

  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    format: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchReports();
  }, [page]); // Keep server-side pagination for all records

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportAPI.getAll({ page, limit: 100 }); // Fetch more for local filtering
      setReports(response.data.data);
      setFilteredReports(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      showError("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = reports.filter(r => {
      const titleMatch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
      const formatMatch = filters.format === 'all' || r.format === filters.format;
      const statusMatch = filters.status === 'all' || r.status === filters.status;
      return titleMatch && formatMatch && statusMatch;
    });
    setFilteredReports(filtered);
  }, [searchTerm, filters, reports]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await reportAPI.delete(id);
        showSuccess("Report deleted");
        fetchReports();
      } catch (error) {
        showError("Failed to delete report");
      }
    }
  };

  const handleDownload = (row) => {
    if (row.fileUrl) {
      window.open(row.fileUrl, "_blank");
    } else {
      showError("File not available");
    }
  }

  const handleRowClick = (row) => {
    navigate(`/reports/${row._id}`);
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="font-['Outfit'] space-y-8 p-2">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-white mb-2">Report Archives</h1>
            <p className="text-blue-200">Generate and manage official system documentation.</p>
          </div>
          <button
            onClick={() => navigate("/reports/generate")}
            className="relative z-10 bg-white hover:bg-blue-50 text-blue-900 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={20} /> Generate New
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by title..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              name="format"
              value={filters.format}
              onChange={handleFilterChange}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onClick={() => handleRowClick(report)}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <FileText className="mx-auto mb-4 opacity-20" size={48} />
            <p className="font-medium">No reports generated yet.</p>
          </div>
        )}

        <div className="flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

      </div>
    </Layout>
  );
};

export default ReportList;
