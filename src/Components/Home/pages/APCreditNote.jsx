// src/components/pages/APCreditNote.jsx (REFACTORED with List.css)

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
import "../../../styles/List.css"; // Using the shared stylesheet
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

// A custom hook to debounce input changes.
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

function APCreditNote() {
  const navigate = useNavigate();

  // State for search filters
  const [creditNoteNumberSearch, setCreditNoteNumberSearch] = useState("");
  const [vendorNameSearch, setVendorNameSearch] = useState("");

  // Debounce the search terms
  const debouncedCreditNoteSearch = useDebounce(creditNoteNumberSearch, 500);
  const debouncedVendorSearch = useDebounce(vendorNameSearch, 500);

  // State for data, loading, and errors
  const [apCreditNoteList, setApCreditNoteList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- PAGINATION HOOK ---
  // Using client-side pagination as server-side is not yet implemented for this component
  const { currentPageData, ...pagination } = useDynamicPagination(
    apCreditNoteList,
    {
      fixedItemsPerPage: 8,
    }
  );

  // --- Data Fetching Logic with Debounced Search ---
  const fetchAPCreditNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (debouncedCreditNoteSearch)
      params.append("apCreditNoteNo", debouncedCreditNoteSearch);
    if (debouncedVendorSearch)
      params.append("vendorName", debouncedVendorSearch);

    try {
      const response = await fetch(
        `${API_BASE_URL}/APCreditNotes?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data. Please try again later.");
      }
      const data = await response.json();
      setApCreditNoteList(data);
    } catch (error) {
      setError(error.message);
      setApCreditNoteList([]);
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedCreditNoteSearch, debouncedVendorSearch]);

  useEffect(() => {
    fetchAPCreditNotes();
  }, [fetchAPCreditNotes]);

  // --- Event Handlers ---
  const handleAddAPCreditNoteClick = () => {
    navigate("/apcreditnote/add");
  };

  const handleCreditNoteLinkClick = (e, creditNoteId) => {
    e.preventDefault();
    navigate(`/apcreditnote/update/${creditNoteId}`);
  };

  // --- Helper Functions ---
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString("en-GB") : "N/A";

  return (
    <div className="page-container">
      <div className="filter-controls">
        <div className="filter-item">
          <label htmlFor="creditNoteSearch" className="form-label">
            AP Credit Note No.:
          </label>
          <input
            type="text"
            id="creditNoteSearch"
            className="form-input"
            value={creditNoteNumberSearch}
            onChange={(e) => setCreditNoteNumberSearch(e.target.value)}
            placeholder="Search by Credit Note No..."
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
          />
        </div>
        <div className="filter-item" style={{ marginLeft: "auto" }}>
          <label className="form-label">Add</label>
          <button
            className="btn btn-icon"
            onClick={handleAddAPCreditNoteClick}
            title="Add New AP Credit Note"
          >
            +
          </button>
        </div>
      </div>

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>AP Credit Note No.</th>
              <th>Date</th>
              <th>Vendor Code</th>
              <th>Vendor Name</th>
              <th className="text-right">Total</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="loading-cell">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan="6"
                  className="no-data-cell"
                  style={{ color: "red" }}
                >
                  {error}
                </td>
              </tr>
            ) : currentPageData.length > 0 ? (
              currentPageData.map((apCreditNote) => (
                <tr key={apCreditNote.id}>
                  <td>
                    <a
                      href="#"
                      onClick={(e) =>
                        handleCreditNoteLinkClick(e, apCreditNote.id)
                      }
                      className="table-link"
                      title={`View details for Credit Note ${apCreditNote.apCreditNoteNo}`}
                    >
                      {apCreditNote.apCreditNoteNo}
                    </a>
                  </td>
                  <td>{formatDate(apCreditNote.apCreditNoteDate)}</td>
                  <td>{apCreditNote.vendorCode}</td>
                  <td>{apCreditNote.vendorName}</td>
                  <td className="text-right">
                    {formatCurrency(apCreditNote.apCreditNoteTotal)}
                  </td>
                  <td>{apCreditNote.apCreditNoteRemarks || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data-cell">
                  No AP Credit Notes found.
                </td>
              </tr>
            )}
          </tbody>
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

export default APCreditNote;
