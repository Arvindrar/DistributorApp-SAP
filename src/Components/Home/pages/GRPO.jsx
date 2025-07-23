import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config"; // Make sure this path is correct
import "./GRPO.css"; // Use the GRPO-specific CSS

// A custom hook to debounce input changes. This prevents API calls on every keystroke.
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

function GRPO() {
  const navigate = useNavigate();

  // State for search filters
  const [grpoNumberSearch, setGrpoNumberSearch] = useState("");
  const [vendorNameSearch, setVendorNameSearch] = useState("");
  const [poNumberSearch, setPoNumberSearch] = useState("");

  // Debounce the search terms
  const debouncedGrpoSearch = useDebounce(grpoNumberSearch, 500);
  const debouncedVendorSearch = useDebounce(vendorNameSearch, 500);
  const debouncedPoSearch = useDebounce(poNumberSearch, 500);

  // State for data, loading, and errors
  const [grpoList, setGrpoList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching Logic with Debounced Search ---
  const fetchGRPOs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Build query parameters based on debounced search terms
    const params = new URLSearchParams();
    if (debouncedGrpoSearch) params.append("grpoNo", debouncedGrpoSearch);
    if (debouncedVendorSearch)
      params.append("vendorName", debouncedVendorSearch);
    if (debouncedPoSearch) params.append("purchaseOrderNo", debouncedPoSearch);

    try {
      const response = await fetch(
        `${API_BASE_URL}/GRPOs?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data. Please try again later.");
      }
      const data = await response.json();
      setGrpoList(data);
    } catch (error) {
      setError(error.message);
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedGrpoSearch, debouncedVendorSearch, debouncedPoSearch]);

  useEffect(() => {
    fetchGRPOs();
  }, [fetchGRPOs]);

  // --- Event Handlers ---
  const handleAddGRPOClick = () => {
    navigate("/grpo/add");
  };

  const handleGrpoLinkClick = (e, grpoId) => {
    e.preventDefault();
    // In the future, this will navigate to an edit/view page
    navigate(`/grpo/update/${grpoId}`);
  };

  // --- Helper Functions ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  return (
    <div className="grpo-overview__page-content">
      <h1>Goods Receipt PO (GRPO) Overview</h1>
      <div className="grpo-overview__filter-controls">
        <div className="grpo-overview__filter-item">
          <label htmlFor="grpoSearch" className="grpo-overview__filter-label">
            GRPO Number:
          </label>
          <input
            type="text"
            id="grpoSearch"
            className="grpo-overview__filter-input"
            value={grpoNumberSearch}
            onChange={(e) => setGrpoNumberSearch(e.target.value)}
            placeholder="Search by GRPO Number..."
          />
        </div>
        <div className="grpo-overview__filter-item">
          <label
            htmlFor="vendorNameSearch"
            className="grpo-overview__filter-label"
          >
            Vendor Name:
          </label>
          <input
            type="text"
            id="vendorNameSearch"
            className="grpo-overview__filter-input"
            value={vendorNameSearch}
            onChange={(e) => setVendorNameSearch(e.target.value)}
            placeholder="Search by Vendor Name..."
          />
        </div>
        {/* <div className="grpo-overview__filter-item">
          <label
            htmlFor="poNumberSearch"
            className="grpo-overview__filter-label"
          >
            P.O. Number:
          </label>
          <input
            type="text"
            id="poNumberSearch"
            className="grpo-overview__filter-input"
            value={poNumberSearch}
            onChange={(e) => setPoNumberSearch(e.target.value)}
            placeholder="Search by original P.O. ..."
          />
        </div> */}
        <div className="grpo-overview__add-action-group">
          <span className="grpo-overview__add-label">Create</span>
          <button
            className="grpo-overview__add-button"
            onClick={handleAddGRPOClick}
            title="Add New GRPO"
          >
            +
          </button>
        </div>
      </div>

      <div className="grpo-overview__table-container">
        <table className="grpo-overview__data-table">
          <thead>
            <tr>
              <th>GRPO Number</th>
              <th>GRPO Date</th>
              {/* <th>P.O. Number</th> */}
              <th>Vendor Code</th>
              <th>Vendor Name</th>
              <th>GRPO Total</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="grpo-overview__no-data-cell">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="grpo-overview__error-cell">
                  {error}
                </td>
              </tr>
            ) : grpoList.length > 0 ? (
              grpoList.map((grpo) => (
                <tr key={grpo.id}>
                  <td>
                    <a
                      href={`/grpo/update/${grpo.id}`}
                      onClick={(e) => handleGrpoLinkClick(e, grpo.id)}
                      className="grpo-overview__table-data-link"
                      title={`View details for GRPO ${grpo.grpoNo}`}
                    >
                      {grpo.grpoNo}
                    </a>
                  </td>
                  <td>{formatDate(grpo.grpoDate)}</td>
                  {/* <td>{grpo.purchaseOrderNo}</td> */}
                  <td>{grpo.vendorCode}</td>
                  <td>{grpo.vendorName}</td>
                  <td>{formatCurrency(grpo.grpoTotal)}</td>
                  <td>{grpo.grpoRemarks}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="grpo-overview__no-data-cell">
                  No GRPOs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GRPO;
