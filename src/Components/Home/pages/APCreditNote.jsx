import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config"; // Make sure this path is correct
import "./APCreditNote.css"; // Use the APCreditNote-specific CSS

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

function APCreditNote() {
  const navigate = useNavigate();

  // State for search filters
  const [creditNoteNumberSearch, setCreditNoteNumberSearch] = useState("");
  const [vendorNameSearch, setVendorNameSearch] = useState("");
  const [invoiceNumberSearch, setInvoiceNumberSearch] = useState(""); // Kept for structure, currently commented out

  // Debounce the search terms
  const debouncedCreditNoteSearch = useDebounce(creditNoteNumberSearch, 500);
  const debouncedVendorSearch = useDebounce(vendorNameSearch, 500);
  const debouncedInvoiceSearch = useDebounce(invoiceNumberSearch, 500); // Kept for structure

  // State for data, loading, and errors
  const [apCreditNoteList, setApCreditNoteList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching Logic with Debounced Search ---
  const fetchAPCreditNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Build query parameters based on debounced search terms
    const params = new URLSearchParams();
    if (debouncedCreditNoteSearch)
      params.append("apCreditNoteNo", debouncedCreditNoteSearch);
    if (debouncedVendorSearch)
      params.append("vendorName", debouncedVendorSearch);
    if (debouncedInvoiceSearch)
      params.append("invoiceNo", debouncedInvoiceSearch); // Example parameter

    try {
      // Use the new API endpoint for AP Credit Notes
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
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedCreditNoteSearch,
    debouncedVendorSearch,
    debouncedInvoiceSearch,
  ]);

  useEffect(() => {
    fetchAPCreditNotes();
  }, [fetchAPCreditNotes]);

  // --- Event Handlers ---
  const handleAddAPCreditNoteClick = () => {
    navigate("/apcreditnote/add"); // Navigate to add page
  };

  const handleCreditNoteLinkClick = (e, creditNoteId) => {
    e.preventDefault();
    // Navigate to an edit/view page for the specific credit note
    navigate(`/ap-credit-note/update/${creditNoteId}`);
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
    <div className="ap-credit-note-overview__page-content">
      <h1>AP Credit Note Overview</h1>
      <div className="ap-credit-note-overview__filter-controls">
        <div className="ap-credit-note-overview__filter-item">
          <label
            htmlFor="creditNoteSearch"
            className="ap-credit-note-overview__filter-label"
          >
            AP Credit Note No.:
          </label>
          <input
            type="text"
            id="creditNoteSearch"
            className="ap-credit-note-overview__filter-input"
            value={creditNoteNumberSearch}
            onChange={(e) => setCreditNoteNumberSearch(e.target.value)}
            placeholder="Search by Credit Note No...."
          />
        </div>
        <div className="ap-credit-note-overview__filter-item">
          <label
            htmlFor="vendorNameSearch"
            className="ap-credit-note-overview__filter-label"
          >
            Vendor Name:
          </label>
          <input
            type="text"
            id="vendorNameSearch"
            className="ap-credit-note-overview__filter-input"
            value={vendorNameSearch}
            onChange={(e) => setVendorNameSearch(e.target.value)}
            placeholder="Search by Vendor Name..."
          />
        </div>
        {/* <div className="ap-credit-note-overview__filter-item">
          <label
            htmlFor="invoiceNumberSearch"
            className="ap-credit-note-overview__filter-label"
          >
            Invoice No.:
          </label>
          <input
            type="text"
            id="invoiceNumberSearch"
            className="ap-credit-note-overview__filter-input"
            value={invoiceNumberSearch}
            onChange={(e) => setInvoiceNumberSearch(e.target.value)}
            placeholder="Search by original Invoice No. ..."
          />
        </div> */}
        <div className="ap-credit-note-overview__add-action-group">
          <span className="ap-credit-note-overview__add-label">Create</span>
          <button
            className="ap-credit-note-overview__add-button"
            onClick={handleAddAPCreditNoteClick}
            title="Add New AP Credit Note"
          >
            +
          </button>
        </div>
      </div>

      <div className="ap-credit-note-overview__table-container">
        <table className="ap-credit-note-overview__data-table">
          <thead>
            <tr>
              <th>AP Credit Note No.</th>
              <th>AP Credit Note Date</th>
              {/* <th>Invoice No.</th> */}
              <th>Vendor Code</th>
              <th>Vendor Name</th>
              <th>AP Credit Note Total</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan="6"
                  className="ap-credit-note-overview__no-data-cell"
                >
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="ap-credit-note-overview__error-cell">
                  {error}
                </td>
              </tr>
            ) : apCreditNoteList.length > 0 ? (
              apCreditNoteList.map((apCreditNote) => (
                <tr key={apCreditNote.id}>
                  <td>
                    <a
                      href={`/ap-credit-note/update/${apCreditNote.id}`}
                      onClick={(e) =>
                        handleCreditNoteLinkClick(e, apCreditNote.id)
                      }
                      className="ap-credit-note-overview__table-data-link"
                      title={`View details for Credit Note ${apCreditNote.apCreditNoteNo}`}
                    >
                      {apCreditNote.apCreditNoteNo}
                    </a>
                  </td>
                  <td>{formatDate(apCreditNote.apCreditNoteDate)}</td>
                  {/* <td>{apCreditNote.invoiceNo}</td> */}
                  <td>{apCreditNote.vendorCode}</td>
                  <td>{apCreditNote.vendorName}</td>
                  <td>{formatCurrency(apCreditNote.apCreditNoteTotal)}</td>
                  <td>{apCreditNote.apCreditNoteRemarks}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="ap-credit-note-overview__no-data-cell"
                >
                  No AP Credit Notes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default APCreditNote;
