// src/components/pages/ARInvoice.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ARInvoice.css"; // CRITICAL: This now imports the correctly named CSS file.
import { API_BASE_URL } from "../../../config";

import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

function ARInvoice() {
  const navigate = useNavigate();
  const location = useLocation();

  const [arInvoiceSearch, setArInvoiceSearch] = useState("");
  const [customerNameSearch, setCustomerNameSearch] = useState("");
  const [arInvoices, setArInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchDebounceRef = useRef(null);

  const pagination = useDynamicPagination(arInvoices, {
    fixedItemsPerPage: 11,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const fetchArInvoices = useCallback(
    async (currentInvoiceSearch, currentCustSearch) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (currentInvoiceSearch) {
          // ASSUMPTION: Your API uses 'invoiceNo' for searching
          queryParams.append("arInvoiceNo", currentInvoiceSearch);
        }
        if (currentCustSearch) {
          queryParams.append("customerName", currentCustSearch);
        }

        // ASSUMPTION: Your API endpoint is /ARInvoices
        const url = `${API_BASE_URL}/ARInvoices?${queryParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorBody = await response.text();
          const errorMessage =
            errorBody || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setArInvoices(data);
      } catch (e) {
        console.error("Failed to fetch A/R Invoices:", e);
        setError(e.message || "Failed to load A/R Invoices. Please try again.");
        setArInvoices([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [arInvoiceSearch, customerNameSearch, setCurrentPage]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchArInvoices(arInvoiceSearch, customerNameSearch);
    }, 500);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [arInvoiceSearch, customerNameSearch, fetchArInvoices]);

  useEffect(() => {
    if (location.state && location.state.refreshArInvoices) {
      fetchArInvoices(arInvoiceSearch, customerNameSearch);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    location.state,
    fetchArInvoices,
    navigate,
    location.pathname,
    arInvoiceSearch,
    customerNameSearch,
  ]);

  const handleArInvoiceSearchChange = (event) => {
    setArInvoiceSearch(event.target.value);
  };

  const handleCustomerNameSearchChange = (event) => {
    setCustomerNameSearch(event.target.value);
  };

  const handleAddArInvoiceClick = () => {
    navigate("/arinvoice/add");
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(0);
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(numericAmount);
  };

  const handleArInvoiceNumberLinkClick = (e, invoiceId) => {
    e.preventDefault();
    navigate(`/arinvoice/update/${invoiceId}`);
  };

  let tableBodyContent;
  if (isLoading && arInvoices.length === 0) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="ari-overview__no-data-cell">
          Loading A/R invoices...
        </td>
      </tr>
    );
  } else if (error) {
    tableBodyContent = (
      <tr>
        <td
          colSpan="6"
          className="ari-overview__no-data-cell ari-overview__error-cell"
        >
          Error: {error}
        </td>
      </tr>
    );
  } else if (!isLoading && arInvoices.length === 0) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="ari-overview__no-data-cell">
          No A/R invoices found matching your criteria.
        </td>
      </tr>
    );
  } else {
    tableBodyContent = currentPageData.map((invoice) => (
      <tr key={invoice.id}>
        <td>
          <a
            href={`/arinvoice/view/${invoice.id}`}
            onClick={(e) => handleArInvoiceNumberLinkClick(e, invoice.id)}
            className="ari-overview__table-data-link"
            title={`View details for Invoice No. ${invoice.invoiceNo}`}
          >
            {invoice.arInvoiceNo || "N/A"}
          </a>
        </td>
        <td>
          {invoice.invoiceDate
            ? new Date(invoice.invoiceDate).toLocaleDateString("en-GB")
            : "N/A"}
        </td>
        <td>{invoice.customerCode || "N/A"}</td>
        <td>{invoice.customerName || "N/A"}</td>
        <td>{formatCurrency(invoice.invoiceTotal)}</td>
        <td>{invoice.invoiceRemarks || "N/A"}</td>
      </tr>
    ));
  }

  return (
    <div className="ari-overview__page-content">
      <h1>A/R Invoice Overview</h1>

      <div className="ari-overview__filter-controls">
        <div className="ari-overview__filter-item">
          <label htmlFor="ariSearch" className="ari-overview__filter-label">
            A/R Invoice :
          </label>
          <input
            type="text"
            id="ariSearch"
            name="ariSearch"
            className="ari-overview__filter-input"
            value={arInvoiceSearch}
            onChange={handleArInvoiceSearchChange}
            placeholder="Search by Invoice No..."
            autoComplete="off"
          />
        </div>
        <div className="ari-overview__filter-item">
          <label
            htmlFor="customerNameSearch"
            className="ari-overview__filter-label"
          >
            Customer Name :
          </label>
          <input
            type="text"
            id="customerNameSearch"
            name="customerNameSearch"
            className="ari-overview__filter-input"
            value={customerNameSearch}
            onChange={handleCustomerNameSearchChange}
            placeholder="Search by Customer Name..."
            autoComplete="off"
          />
        </div>
        <div className="ari-overview__add-action-group">
          <span className="ari-overview__add-label">Create</span>
          <button
            className="ari-overview__add-button"
            onClick={handleAddArInvoiceClick}
            title="Add New A/R Invoice"
          >
            +
          </button>
        </div>
      </div>

      {isLoading && arInvoices.length > 0 && (
        <div className="ari-overview__loading-indicator">Updating list...</div>
      )}

      <div className="ari-overview__table-container">
        <table className="ari-overview__data-table">
          <thead>
            <tr>
              <th>A/R Invoice No.</th>
              <th>A/R Invoice Date</th>
              <th>Customer Code</th>
              <th>Customer Name</th>
              <th>A/R Invoice Total</th>
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

export default ARInvoice;
