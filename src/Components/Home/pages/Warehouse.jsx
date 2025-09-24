import React, { useState, useEffect, useCallback } from "react";
import "./Warehouse.css"; // Styles specific to this component
import { API_WAREHOUSE_ENDPOINT } from "../../../config";

// Import the reusable pagination hook and component
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

// --- Icons ---
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className="wh-delete-icon"
    viewBox="0 0 16 16"
    title="Delete Warehouse"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

// Simple Modal Component
const MessageModal = ({ message, onClose, type = "success" }) => {
  if (!message) return null;
  return (
    <div className="wh-modal-overlay">
      <div className={`wh-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="wh-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

// Confirmation Modal for Delete
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  if (!message) return null;
  return (
    <div className="wh-modal-overlay wh-confirmation-modal-overlay">
      <div className="wh-modal-content wh-confirmation-modal-content">
        <p>{message}</p>
        <div className="wh-confirmation-modal-actions">
          <button
            onClick={onConfirm}
            className="wh-confirmation-button wh-confirm"
          >
            Yes, Delete
          </button>
          <button
            onClick={onCancel}
            className="wh-confirmation-button wh-cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const Warehouse = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [newWarehouse, setNewWarehouse] = useState({
    code: "",
    name: "",
    address: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formSubmissionError, setFormSubmissionError] = useState(null);
  const [clientFormErrors, setClientFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);

  // Instantiate the pagination hook with 4 items per page
  const pagination = useDynamicPagination(warehouses, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_WAREHOUSE_ENDPOINT);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error fetching warehouses! Status: ${response.status} ${errorText}`
        );
      }
      const data = await response.json();
      setWarehouses(data);
    } catch (e) {
      console.error("Failed to fetch warehouses:", e);
      setError(
        e.message || "Failed to load warehouses. Please try refreshing."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWarehouse((prev) => ({ ...prev, [name]: value }));
    if (clientFormErrors[name]) {
      setClientFormErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
    if (formSubmissionError) setFormSubmissionError(null);
  };

  // CORRECTED: This function now directly returns the errors object.
  const validateNewWarehouse = () => {
    const errors = {};
    if (!newWarehouse.code.trim()) errors.code = "Warehouse Code is required.";
    if (!newWarehouse.name.trim()) errors.name = "Warehouse Name is required.";
    if (!newWarehouse.address.trim())
      errors.address = "Warehouse Address is required.";
    return errors;
  };

  const handleAddWarehouse = async () => {
    // CORRECTED: The validation logic is now synchronous.
    const validationErrors = validateNewWarehouse();
    setClientFormErrors(validationErrors); // Set state for inline error messages

    // Check if the returned errors object has any keys
    if (Object.keys(validationErrors).length > 0) {
      const errorModalMessages = Object.values(validationErrors).join("\n");
      setFormSubmissionError(errorModalMessages); // This will now show the specific errors
      return; // Stop the function
    }

    setFormSubmissionError(null); // Clear any previous submission errors
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage("");

    const warehouseData = {
      code: newWarehouse.code.trim(),
      name: newWarehouse.name.trim(),
      address: newWarehouse.address.trim(),
    };

    try {
      const response = await fetch(API_WAREHOUSE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(warehouseData),
      });

      // Your original, detailed backend error handling is preserved here
      if (!response.ok) {
        let userFriendlyErrorMessage = `Error ${response.status}: An error occurred.`;
        const tempClientErrors = {};
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData === "object") {
            userFriendlyErrorMessage = "";
            for (const key in errorData) {
              if (
                Object.prototype.hasOwnProperty.call(errorData, key) &&
                Array.isArray(errorData[key])
              ) {
                const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
                tempClientErrors[fieldName] = errorData[key].join(" ");
                userFriendlyErrorMessage += `${key}: ${tempClientErrors[fieldName]}\n`;
              }
            }
            if (!userFriendlyErrorMessage)
              userFriendlyErrorMessage =
                errorData.title || JSON.stringify(errorData);
          }
        } catch {
          userFriendlyErrorMessage =
            (await response.text()) ||
            `Request failed with status ${response.status}`;
        }
        setClientFormErrors(tempClientErrors);
        throw new Error(userFriendlyErrorMessage.trim());
      }

      setSuccessMessage("Warehouse added successfully!");
      setNewWarehouse({ code: "", name: "", address: "" });
      setClientFormErrors({});
      await fetchWarehouses();
      setCurrentPage(1); // Reset to page 1 on successful addition
    } catch (e) {
      console.error("Error in handleAddWarehouse submission:", e);
      setFormSubmissionError(e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDeleteWarehouse = (warehouse) => {
    setWarehouseToDelete(warehouse);
    setShowDeleteConfirm(true);
  };

  const handleDeleteWarehouse = async () => {
    if (!warehouseToDelete) return;

    // --- THIS IS THE CRITICAL CHANGE ---
    // Instead of using warehouseToDelete.id, we use warehouseToDelete.code
    // This works for BOTH SAP (e.g., "L101") and SQL (e.g., "101", if your codes are numeric)
    const identifier = warehouseToDelete.code;

    // Safety check in case the code is missing
    if (!identifier) {
      setError("Cannot delete: Warehouse code is missing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // The URL now uses the identifier (which is the code)
      const response = await fetch(`${API_WAREHOUSE_ENDPOINT}/${identifier}`, {
        method: "DELETE",
      });
      // ... (the rest of the function is the same) ...
      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.title || JSON.stringify(errorData);
        } catch {
          errorMessage = (await response.text()) || errorMessage;
        }
        throw new Error(errorMessage);
      }
      setSuccessMessage(
        `Warehouse '${warehouseToDelete.name}' deleted successfully!`
      );
      await fetchWarehouses();
    } catch (e) {
      setError(e.message || "Failed to delete warehouse.");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setWarehouseToDelete(null);
    }
  };

  const closeModal = () => {
    setSuccessMessage("");
    setError("");
    setFormSubmissionError("");
  };

  return (
    <div className="wh-page-content">
      {/* All modals remain unchanged and fully functional */}
      <MessageModal
        message={successMessage}
        onClose={closeModal}
        type="success"
      />
      <MessageModal
        message={formSubmissionError}
        onClose={closeModal}
        type="error"
      />
      {error && !formSubmissionError && (
        <MessageModal message={error} onClose={closeModal} type="error" />
      )}
      {showDeleteConfirm && warehouseToDelete && (
        <ConfirmationModal
          message={`Are you sure you want to delete warehouse "${warehouseToDelete.name} (${warehouseToDelete.code})"?`}
          onConfirm={handleDeleteWarehouse}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <h1 className="wh-main-title">Warehouses</h1>

      {isLoading && <p className="wh-loading-message">Loading warehouses...</p>}

      <div className="wh-table-responsive-container">
        <table className="wh-data-table">
          <thead>
            <tr>
              <th className="wh-th-serial">Serial No</th>
              <th className="wh-th-code">Warehouse Code</th>
              <th className="wh-th-name">Warehouse Name</th>
              <th className="wh-th-address">Warehouse Address</th>
              {/* <th className="wh-th-actions">Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
              currentPageData.map((wh, index) => (
                <tr key={wh.id}>
                  <td className="wh-td-serial">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td className="wh-td-code">{wh.code}</td>
                  <td className="wh-td-name">{wh.name}</td>
                  <td className="wh-td-address">{wh.address}</td>
                  {/* <td className="wh-td-actions">
                    <button
                      className="wh-delete-button-icon"
                      onClick={() => promptDeleteWarehouse(wh)}
                      title={`Delete ${wh.name}`}
                      disabled={isSubmitting}
                    >
                      <DeleteIcon />
                    </button>
                  </td> */}
                </tr>
              ))}
            {!isLoading && warehouses.length === 0 && !error && (
              <tr>
                <td colSpan="5" className="wh-no-data-cell">
                  No warehouses found.
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

      <div className="wh-create-section">
        <h3 className="wh-create-title">Create New Warehouse</h3>
        <div className="wh-form-column">
          <div className="wh-form-row">
            <label htmlFor="warehouseCode" className="wh-label">
              Code:
            </label>
            <input
              type="text"
              id="warehouseCode"
              name="code"
              className={`wh-input ${
                clientFormErrors.code ? "wh-input-error" : ""
              }`}
              value={newWarehouse.code}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
          {clientFormErrors.code && (
            <span className="wh-form-error-text">{clientFormErrors.code}</span>
          )}
          <div className="wh-form-row">
            <label htmlFor="warehouseName" className="wh-label">
              Name:
            </label>
            <input
              type="text"
              id="warehouseName"
              name="name"
              className={`wh-input ${
                clientFormErrors.name ? "wh-input-error" : ""
              }`}
              value={newWarehouse.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
          {clientFormErrors.name && (
            <span className="wh-form-error-text">{clientFormErrors.name}</span>
          )}
          <div className="wh-form-row wh-form-row-address">
            <label htmlFor="warehouseAddress" className="wh-label">
              Address:
            </label>
            <textarea
              id="warehouseAddress"
              name="address"
              className={`wh-textarea ${
                clientFormErrors.address ? "wh-input-error" : ""
              }`}
              value={newWarehouse.address}
              onChange={handleInputChange}
              placeholder="Enter full address details"
              rows="3"
              disabled={isSubmitting}
            />
          </div>
          {clientFormErrors.address && (
            <span className="wh-form-error-text">
              {clientFormErrors.address}
            </span>
          )}
        </div>
        <button
          type="button"
          className="wh-add-button"
          onClick={handleAddWarehouse}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Adding..." : "Add Warehouse"}
        </button>
      </div>
    </div>
  );
};

export default Warehouse;
