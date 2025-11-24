import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { reportAPI } from "../../api/reportAPI";
import { useAlert } from "../../context/AlertContext";
import ReportDetails from "./ReportDetails";
import Loading from "../../components/common/Loading";

export default function ReportDetailsWrapper() {
    const { id } = useParams();
    const { showError } = useAlert();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const response = await reportAPI.getById(id);
                setReport(response.data);
            } catch (err) {
                showError("Failed to fetch report details");
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [id]);

    if (loading) return <Loading />;

    return <ReportDetails report={report} />;
}
