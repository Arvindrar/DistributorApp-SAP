import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sales.css"; // CRITICAL: Ensure Sales.css has ALL necessary styles
import { API_BASE_URL } from "../../../config";

import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

function Sales() {
  const navigate = useNavigate();
  const location = useLocation();

  const [salesOrderSearch, setSalesOrderSearch] = useState("");
  const [customerNameSearch, setCustomerNameSearch] = useState("");
  const [salesOrders, setSalesOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchDebounceRef = useRef(null);

  const pagination = useDynamicPagination(salesOrders, {
    fixedItemsPerPage: 11,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const fetchSalesOrders = useCallback(
    async (currentSoSearch, currentCustSearch) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (currentSoSearch) {
          queryParams.append("salesOrderNo", currentSoSearch);
        }
        if (currentCustSearch) {
          queryParams.append("customerName", currentCustSearch);
        }

        const url = `${API_BASE_URL}/SalesOrders?${queryParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          let errorText = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorText += ` - ${
              errorData.message || errorData.title || JSON.stringify(errorData)
            }`;
          } catch (jsonError) {
            const plainErrorText = await response.text();
            errorText += ` - ${
              plainErrorText || "No further details available."
            }`;
          }
          throw new Error(errorText);
        }
        const data = await response.json();
        setSalesOrders(data);
      } catch (e) {
        console.error("Failed to fetch sales orders:", e);
        setError(e.message || "Failed to load sales orders. Please try again.");
        setSalesOrders([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // When filters change, always go back to the first page of results.
    setCurrentPage(1);
  }, [salesOrderSearch, customerNameSearch, setCurrentPage]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchSalesOrders(salesOrderSearch, customerNameSearch);
    }, 500);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [salesOrderSearch, customerNameSearch, fetchSalesOrders]);

  useEffect(() => {
    if (location.state && location.state.refreshSalesOrders) {
      fetchSalesOrders(salesOrderSearch, customerNameSearch);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    location.state,
    fetchSalesOrders,
    navigate,
    location.pathname,
    salesOrderSearch,
    customerNameSearch,
  ]);

  const handleSalesOrderSearchChange = (event) => {
    setSalesOrderSearch(event.target.value);
  };

  const handleCustomerNameSearchChange = (event) => {
    setCustomerNameSearch(event.target.value);
  };

  const handleAddSalesOrderClick = () => {
    navigate("/salesorder/add");
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

  // REMOVED: handleRowClick function is no longer needed if rows aren't clickable for update.
  // const handleRowClick = (soId) => {
  //   navigate(`/salesorder/update/${soId}`);
  // };

  // This function correctly handles navigation for the S.O. Number link
  const handleSalesOrderNumberLinkClick = (e, soId) => {
    e.preventDefault();
    // e.stopPropagation(); // Not strictly needed anymore if <tr> has no onClick, but harmless
    navigate(`/salesorder/view/${soId}`);
  };

  let tableBodyContent;
  if (isLoading && salesOrders.length === 0) {
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
  } else if (!isLoading && salesOrders.length === 0) {
    tableBodyContent = (
      <tr>
        <td colSpan="6" className="so-overview__no-data-cell">
          No sales orders found matching your criteria.
        </td>
      </tr>
    );
  } else {
    tableBodyContent = currentPageData.map((so) => (
      // MODIFIED: Removed onClick from <tr> and adjusted className if it implied clickability
      <tr
        key={so.id}
        // onClick={() => handleRowClick(so.id)} // <<<< REMOVED THIS LINE
        // className="so-overview__clickable-row" // <<<< Consider renaming or removing if it solely implies clickability
        // Keeping for now as it might affect other styling, but be aware.
        // If you want hover effects, keep it. If not, remove if it's purely for click.
      >
        <td>
          <a
            href={`/salesorder/view/${so.id}`}
            onClick={(e) => handleSalesOrderNumberLinkClick(e, so.id)}
            className="so-overview__table-data-link"
            title={`View details for S.O. ${so.salesOrderNo}`}
          >
            {so.salesOrderNo || "N/A"}
          </a>
        </td>
        <td>
          {so.soDate ? new Date(so.soDate).toLocaleDateString("en-GB") : "N/A"}
        </td>
        <td>{so.customerCode || "N/A"}</td>
        <td>{so.customerName || "N/A"}</td>
        <td>{formatCurrency(so.orderTotal)}</td>
        <td>{so.salesRemarks || "N/A"}</td>
      </tr>
    ));
  }

  return (
    <div className="so-overview__page-content">
      <h1>Sales Order Overview</h1>

      <div className="so-overview__filter-controls">
        <div className="so-overview__filter-item">
          <label htmlFor="soSearch" className="so-overview__filter-label">
            Sales Order :
          </label>
          <input
            type="text"
            id="soSearch"
            name="soSearch"
            className="so-overview__filter-input"
            value={salesOrderSearch}
            onChange={handleSalesOrderSearchChange}
            placeholder="Search by SO Number..."
            autoComplete="off"
          />
        </div>
        <div className="so-overview__filter-item">
          <label
            htmlFor="customerNameSearch"
            className="so-overview__filter-label"
          >
            Customer Name :
          </label>
          <input
            type="text"
            id="customerNameSearch"
            name="customerNameSearch"
            className="so-overview__filter-input"
            value={customerNameSearch}
            onChange={handleCustomerNameSearchChange}
            placeholder="Search by Customer Name..."
            autoComplete="off"
          />
        </div>
        <div className="so-overview__add-action-group">
          <span className="so-overview__add-label">Create</span>
          <button
            className="so-overview__add-button"
            onClick={handleAddSalesOrderClick}
            title="Add New Sales Order"
          >
            +
          </button>
        </div>
      </div>

      {isLoading && salesOrders.length > 0 && (
        <div className="so-overview__loading-indicator">Updating list...</div>
      )}

      <div className="so-overview__table-container">
        <table className="so-overview__data-table">
          <thead>
            <tr>
              <th>S.O Number</th>
              <th>S.O Date</th>
              <th>Customer Code</th>
              <th>Customer Name</th>
              <th>S.O Total</th>
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

export default Sales;
