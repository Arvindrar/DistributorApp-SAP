import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config"; // Make sure this path is correct
//import "./Purchase.css";
import "../../../styles/List.css";
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

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

// SVG Icon for the delete button
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3 0a.5.5 0 0 0-1 0v8.5a.5.5 0 0 0 1 0zM8 5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5.5A.5.5 0 0 1 8 5" />
  </svg>
);

// --- NEW: Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, poNumber }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // We can reuse the modal styles from PurchaseAdd.css for consistency
    <div className="po-add-modal-overlay" onClick={onClose}>
      <div
        className="po-add-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Confirm Deletion</h3>
        <p>
          Are you sure you want to delete Purchase Order:{" "}
          <strong>{poNumber}</strong>?<br />
          This action cannot be undone.
        </p>
        <div className="po-overview__modal-actions">
          <button className="po-overview__modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="po-overview__modal-btn confirm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

function Purchase() {
  const navigate = useNavigate();

  // State for the search inputs
  const [purchaseOrderSearch, setPurchaseOrderSearch] = useState("");
  const [vendorNameSearch, setVendorNameSearch] = useState("");

  // Debounce the search terms
  const debouncedPoSearch = useDebounce(purchaseOrderSearch, 500);
  const debouncedVendorSearch = useDebounce(vendorNameSearch, 500);

  // State for API data
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- NEW: State for the confirmation modal ---
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemToDelete: null,
  });

  const { currentPageData, ...pagination } = useDynamicPagination(
    purchaseOrders,
    {
      fixedItemsPerPage: 8, // You can adjust this number
    }
  );

  // --- Data Fetching Logic ---
  const fetchPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (debouncedPoSearch) params.append("purchaseOrderNo", debouncedPoSearch);
    if (debouncedVendorSearch)
      params.append("vendorName", debouncedVendorSearch);

    try {
      const response = await fetch(
        `${API_BASE_URL}/PurchaseOrders?${params.toString()}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setPurchaseOrders(data);
    } catch (e) {
      console.error("Failed to fetch purchase orders:", e);
      setError("Failed to load data. Please try again.");
      setPurchaseOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedPoSearch, debouncedVendorSearch]);

  // useEffect to trigger data fetch
  // useEffect(() => {
  //   fetchPurchaseOrders();
  // }, [fetchPurchaseOrders]);

  // --- Handlers ---
  const handleAddPurchaseOrderClick = () => {
    navigate("/purchaseorder/add");
  };

  const handlePurchaseOrderNumberLinkClick = (e, poId) => {
    e.preventDefault();
    navigate(`/purchaseorder/update/${poId}`);
  };

  // --- MODIFIED: Logic to handle delete confirmation ---
  const openConfirmationModal = (id, number) => {
    setConfirmationModal({
      isOpen: true,
      itemToDelete: { id, number },
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      itemToDelete: null,
    });
  };

  const handleConfirmDelete = async () => {
    const { id } = confirmationModal.itemToDelete;
    if (!id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/PurchaseOrders/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Failed to delete purchase order. Status: ${response.status}`
        );
      }

      // On success, refetch the list
      fetchPurchaseOrders();
    } catch (e) {
      console.error("Failed to delete purchase order:", e);
      setError(e.message || "Failed to delete. Please try again.");
    } finally {
      // Always close the modal
      closeConfirmationModal();
    }
  };

  // --- Helper Functions ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  return (
    <div className="page-container">
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmDelete}
        poNumber={confirmationModal.itemToDelete?.number}
      />

      <div className="filter-controls">
        <div className="filter-item">
          <label htmlFor="poSearch" className="form-label">
            Purchase Order:
          </label>
          <input
            type="text"
            id="poSearch"
            className="form-input"
            value={purchaseOrderSearch}
            onChange={(e) => setPurchaseOrderSearch(e.target.value)}
            placeholder="Search by PO Number..."
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
            onClick={handleAddPurchaseOrderClick}
            title="Add New Purchase Order"
          >
            +
          </button>
        </div>
      </div>

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>P.O Number</th>
              <th>P.O Date</th>
              <th>Vendor Code</th>
              <th>Vendor Name</th>
              <th className="text-right">Net Total</th>
              <th>Remarks</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="loading-cell">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-data-cell"
                  style={{ color: "red" }}
                >
                  {error}
                </td>
              </tr>
            ) : currentPageData.length > 0 ? (
              // --- RENDER currentPageData FROM PAGINATION ---
              currentPageData.map((po) => (
                <tr key={po.id}>
                  <td>
                    <a
                      href="#"
                      onClick={(e) =>
                        handlePurchaseOrderNumberLinkClick(e, po.id)
                      }
                      className="table-link"
                    >
                      {po.poNumber}
                    </a>
                  </td>
                  <td>{formatDate(po.poDate)}</td>
                  <td>{po.vendorCode}</td>
                  <td>{po.vendorName}</td>
                  <td className="text-right">{formatCurrency(po.netTotal)}</td>
                  <td>{po.remark || "N/A"}</td>
                  <td className="text-center">
                    <button
                      className="btn-icon-danger"
                      onClick={() => openConfirmationModal(po.id, po.poNumber)}
                      title={`Delete P.O. ${po.poNumber}`}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data-cell">
                  No purchase orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- RENDER THE PAGINATION COMPONENT --- */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />
    </div>
  );
}

export default Purchase;
