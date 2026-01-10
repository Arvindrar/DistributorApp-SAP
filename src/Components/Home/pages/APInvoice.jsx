// src/components/pages/APInvoice.jsx (REFACTORED with List.css)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../../styles/List.css"; // Using the shared stylesheet
import { API_BASE_URL } from "../../../config";

import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

function APInvoice() {
  const navigate = useNavigate();
  const location = useLocation();

  const [apInvoiceSearch, setApInvoiceSearch] = useState("");
  const [vendorNameSearch, setVendorNameSearch] = useState("");
  const [apInvoices, setApInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchDebounceRef = useRef(null);

  const pagination = useDynamicPagination(apInvoices, {
    fixedItemsPerPage: 8, // Standard number of items
  });
  const { currentPageData, setCurrentPage } = pagination;

  const fetchApInvoices = useCallback(
    async (currentInvoiceSearch, currentVendorSearch) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (currentInvoiceSearch)
          queryParams.append("apInvoiceNo", currentInvoiceSearch);
        if (currentVendorSearch)
          queryParams.append("vendorName", currentVendorSearch);

        const url = `${API_BASE_URL}/APInvoices?${queryParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setApInvoices(data);
      } catch (e) {
        console.error("Failed to fetch A/P Invoices:", e);
        setError(e.message || "Failed to load A/P Invoices.");
        setApInvoices([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [apInvoiceSearch, vendorNameSearch, setCurrentPage]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      fetchApInvoices(apInvoiceSearch, vendorNameSearch);
    }, 500);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [apInvoiceSearch, vendorNameSearch, fetchApInvoices]);

  useEffect(() => {
    if (location.state?.refreshApInvoices) {
      fetchApInvoices(apInvoiceSearch, vendorNameSearch);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    location.state,
    fetchApInvoices,
    navigate,
    location.pathname,
    apInvoiceSearch,
    vendorNameSearch,
  ]);

  const handleAddApInvoiceClick = () => {
    navigate("/apinvoice/add");
  };

  const handleApInvoiceNumberLinkClick = (e, invoiceId) => {
    e.preventDefault();
    navigate(`/apinvoice/update/${invoiceId}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(parseFloat(amount) || 0);
  };

  let tableBodyContent;
  if (isLoading) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="loading-cell">
          Loading A/P invoices...
        </td>
      </tr>
    );
  } else if (error) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="no-data-cell" style={{ color: "red" }}>
          Error: {error}
        </td>
      </tr>
    );
  } else if (currentPageData.length === 0) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="no-data-cell">
          No A/P invoices found.
        </td>
      </tr>
    );
  } else {
    tableBodyContent = currentPageData.map((invoice) => (
      <tr key={invoice.id}>
        <td>
          <a
            href="#"
            onClick={(e) => handleApInvoiceNumberLinkClick(e, invoice.id)}
            className="table-link"
            title={`View details for Invoice No. ${invoice.apInvoiceNo}`}
          >
            {invoice.apInvoiceNo || "N/A"}
          </a>
        </td>
        <td>
          {invoice.invoiceDate
            ? new Date(invoice.invoiceDate).toLocaleDateString("en-GB")
            : "N/A"}
        </td>
        <td>{invoice.vendorCode || "N/A"}</td>
        <td>{invoice.vendorName || "N/A"}</td>
        <td className="text-right">{formatCurrency(invoice.invoiceTotal)}</td>
        <td>{invoice.invoiceRemarks || "N/A"}</td>
      </tr>
    ));
  }

  return (
    <div className="page-container">
      <div className="filter-controls">
        <div className="filter-item">
          <label htmlFor="apiSearch" className="form-label">
            A/P Invoice:
          </label>
          <input
            type="text"
            id="apiSearch"
            className="form-input"
            value={apInvoiceSearch}
            onChange={(e) => setApInvoiceSearch(e.target.value)}
            placeholder="Search by Invoice No..."
            autoComplete="off"
          />
        </div>
        <div className="filter-item">
          <label htmlFor="vendorNameSearch" className="form-label">
            Vendor Name:
          </label>
          <input
            type="text"
            id="vendorNameSearch"
            className="form-input"
            value={vendorNameSearch}
            onChange={(e) => setVendorNameSearch(e.target.value)}
            placeholder="Search by Vendor Name..."
            autoComplete="off"
          />
        </div>
        <div className="filter-item" style={{ marginLeft: "auto" }}>
          <label className="form-label">Add</label>
          <button
            className="btn btn-icon"
            onClick={handleAddApInvoiceClick}
            title="Add New A/P Invoice"
          >
            +
          </button>
        </div>
      </div>

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>A/P Invoice No.</th>
              <th>A/P Invoice Date</th>
              <th>Vendor Code</th>
              <th>Vendor Name</th>
              <th className="text-right">A/P Invoice Total</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>{tableBodyContent}</tbody>
        </table>
      </div>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />
    </div>
  );
}

export default APInvoice;
