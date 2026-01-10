// FILE: src/Components/Sales/pages/Sales.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
//import "./Sales.css";
import { API_BASE_URL } from "../../../config";
import "../../../styles/List.css";

import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

function Sales() {
  const navigate = useNavigate();
  const location = useLocation();

  // State for search filters, sales order data, and UI control
  const [salesOrderSearch, setSalesOrderSearch] = useState("");
  const [customerNameSearch, setCustomerNameSearch] = useState(""); // Keep this for future filtering
  const [salesOrders, setSalesOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize the pagination hook
  const { currentPageData, ...pagination } = useDynamicPagination(salesOrders, {
    fixedItemsPerPage: 9,
  });

  const fetchSalesOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // NOTE: Your current SAP controller doesn't support server-side filtering yet.
      // This fetch call will get ALL sales orders. Filtering is done on the client by the pagination hook.
      const url = `${API_BASE_URL}/SalesOrders`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // ==========================================================
      // THE FIX IS HERE
      // We set the state with the array from data.value, not the whole object.
      // The `|| []` is a safety net in case 'value' is missing.
      // ==========================================================
      setSalesOrders(data.value || []);
    } catch (e) {
      console.error("Failed to fetch sales orders:", e);
      setError(e.message || "Failed to load sales orders.");
      setSalesOrders([]); // Ensure salesOrders is an array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when the component mounts
  useEffect(() => {
    fetchSalesOrders();
  }, [fetchSalesOrders]);

  // Refetch data if we are navigated back after a successful creation
  useEffect(() => {
    if (location.state?.refreshSalesOrders) {
      fetchSalesOrders();
      // Clear the state to prevent re-fetching on other navigation events
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, fetchSalesOrders, navigate, location.pathname]);

  const handleAddSalesOrderClick = () => {
    navigate("/salesorder/add");
  };

  // Helper to format currency, assuming INR for this example
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  // --- RENDER LOGIC ---

  let tableBodyContent;
  if (isLoading) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="so-overview__no-data-cell">
          Loading sales orders...
        </td>
      </tr>
    );
  } else if (error) {
    tableBodyContent = (
      <tr>
        <td
          colSpan="6"
          className="so-overview__no-data-cell so-overview__error-cell"
        >
          Error: {error}
        </td>
      </tr>
    );
  } else if (salesOrders.length === 0) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="so-overview__no-data-cell">
          No sales orders found.
        </td>
      </tr>
    );
  } else {
    // ==========================================================
    // DATA MAPPING FIXES
    // Map the SAP field names (DocNum, DocDate, etc.) to the table columns.
    // The unique ID for navigation is 'DocEntry'.
    // ==========================================================
    tableBodyContent = currentPageData.map((so) => (
      <tr key={so.DocEntry}>
        <td>
          {/* Link to view the specific Sales Order */}
          <a
            href={`/salesorder/update/${so.DocEntry}`}
            className="table-link"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/salesorder/update/${so.DocEntry}`);
            }}
          >
            {so.DocNum}
          </a>
        </td>
        <td>{new Date(so.DocDate).toLocaleDateString("en-GB")}</td>
        <td>{so.CardCode}</td>
        <td>{so.CardName}</td>
        <td>{formatCurrency(so.DocTotal)}</td>
        <td>{so.Comments || "N/A"}</td>
      </tr>
    ));
  }

  return (
    <div className="page-container">
      <div className="filter-controls">
        <div className="filter-item">
          <label htmlFor="soSearch" className="form-label">
            S.O Number:
          </label>
          <input
            type="text"
            id="soSearch"
            className="form-input"
            placeholder="Search by S.O number..."
            onChange={(e) => pagination.setSearchTerm(e.target.value, "DocNum")}
          />
        </div>
        <div className="filter-item">
          <label htmlFor="customerNameSearch" className="form-label">
            Customer Name:
          </label>
          <input
            type="text"
            id="customerNameSearch"
            className="form-input"
            placeholder="Search by customer name..."
            onChange={(e) =>
              pagination.setSearchTerm(e.target.value, "CardName")
            }
          />
        </div>

        <div className="filter-item" style={{ marginLeft: "auto" }}>
          <label className="form-label">Add</label>
          <button
            className="btn btn-icon"
            onClick={handleAddSalesOrderClick}
            title="Add New Sales Order"
          >
            +
          </button>
        </div>
      </div>

      {isLoading || error ? (
        // Render loading/error messages outside the main table structure for clarity
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          {isLoading && <p>Loading sales orders...</p>}
          {error && (
            <p className="error-message" style={{ color: "red" }}>
              Error: {error}
            </p>
          )}
        </div>
      ) : (
        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>S.O Number</th>
                <th>S.O Date</th>
                <th>Customer Code</th>
                <th>Customer Name</th>
                <th className="text-right">S.O Total</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>{tableBodyContent}</tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
        goToPage={pagination.goToPage}
      />
    </div>
  );
}

export default Sales;
