import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { reportAPI } from "../../api/reportAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Table from "../../components/common/Table";
import Pagination from "../../components/common/Pagination";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";

const ReportList = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useAlert();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [page]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportAPI.getAll({ page, limit: 20 });
      setReports(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      showError("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
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

  const handleRowClick = (row) => {
    navigate(`/reports/${row._id}`);
  };

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Type", accessor: "reportType" },
    { header: "Format", accessor: "format" },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${row.status === "completed"
              ? "bg-green-100 text-green-800"
              : row.status === "generating"
                ? "bg-yellow-100 text-yellow-800"
                : row.status === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reports/${row._id}`);
            }}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-medium"
          >
            View Details
          </button>
          {row.status === "completed" && row.fileUrl && (
            <a
              href={row.fileUrl}
              download
              className="px-3 py-1 text-sm text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50 transition"
            >
              Download
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row._id);
            }}
            className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading)
    return (
      <Layout>
        <Loading />
      </Layout>
    );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
          <Button onClick={() => navigate("/reports/generate")}>
            Generate New Report
          </Button>
        </div>

        {/* Reports Table */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <Table
            columns={columns}
            data={reports}
            onRowClick={handleRowClick} // make row clickable
          />
          <div className="p-4 border-t border-gray-200">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportList;
