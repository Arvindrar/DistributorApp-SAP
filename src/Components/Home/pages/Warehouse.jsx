import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom"; // Import ReactDOM for portals

// --- CHANGE #1: Comment out the old CSS and import the new shared stylesheet ---
// import "./Warehouse.css";
import "../../../styles/List.css";

import { API_WAREHOUSE_ENDPOINT } from "../../../config";
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

// --- Reusable Components with Generic Class Names ---
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive) return null;
  const targetNode = document.getElementById("modal-root");
  if (!targetNode) return null;
  const buttonClassMap = {
    success: "btn-primary",
    error: "btn-danger",
    info: "btn-primary",
  };
  const buttonClassName = `btn modal-close-button ${
    buttonClassMap[type] || "btn-primary"
  }`;
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className={`modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className={buttonClassName}>
          OK
        </button>
      </div>
    </div>,
    targetNode
  );
};

const ConfirmationModal = ({ message, onConfirm, onCancel, isConfirming }) => {
  if (!message) return null;
  const targetNode = document.getElementById("modal-root");
  if (!targetNode) return null;
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="confirmation-modal-actions">
          <button
            onClick={onConfirm}
            className="btn btn-danger"
            disabled={isConfirming}
          >
            {isConfirming ? "Deleting..." : "Yes, Delete"}
          </button>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isConfirming}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    targetNode
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
  const [clientFormErrors, setClientFormErrors] = useState({});
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);

  const pagination = useDynamicPagination(warehouses, { fixedItemsPerPage: 4 });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const showModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeModal = () =>
    setModalState({ message: "", type: "info", isActive: false });

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_WAREHOUSE_ENDPOINT);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setWarehouses(data);
    } catch (e) {
      showModal(e.message || "Failed to load warehouses.", "error");
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
  };

  const validateNewWarehouse = () => {
    const errors = {};
    if (!newWarehouse.code.trim()) errors.code = "Warehouse Code is required.";
    if (!newWarehouse.name.trim()) errors.name = "Warehouse Name is required.";
    if (!newWarehouse.address.trim())
      errors.address = "Warehouse Address is required.";
    return errors;
  };

  const handleAddWarehouse = async () => {
    const validationErrors = validateNewWarehouse();
    setClientFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      showModal(Object.values(validationErrors).join("\n"), "error");
      return;
    }
    setIsSubmitting(true);
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
      if (!response.ok) {
        // Your detailed backend error handling can be simplified or kept
        const errorText = await response.text();
        throw new Error(errorText || `Request failed: ${response.status}`);
      }
      showModal("Warehouse added successfully!", "success");
      setNewWarehouse({ code: "", name: "", address: "" });
      setClientFormErrors({});
      await fetchWarehouses();
      setCurrentPage(1);
    } catch (e) {
      showModal(e.message || "An unexpected error occurred.", "error");
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
    const identifier = warehouseToDelete.code;
    if (!identifier) {
      showModal("Cannot delete: Warehouse code is missing.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_WAREHOUSE_ENDPOINT}/${identifier}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error(
          (await response.text()) || "Failed to delete warehouse."
        );
      showModal(
        `Warehouse '${warehouseToDelete.name}' deleted successfully!`,
        "success"
      );
      await fetchWarehouses();
    } catch (e) {
      showModal(e.message, "error");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setWarehouseToDelete(null);
    }
  };

  return (
    <>
      <div className="page-container">
        {/* <h1 className="page-title">Warehouses</h1> */}

        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: "80px" }}>
                  Serial No
                </th>
                <th style={{ width: "150px" }}>Warehouse Code</th>
                <th>Warehouse Name</th>
                <th>Warehouse Address</th>
                <th className="text-center" style={{ width: "100px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="loading-cell">
                    Loading warehouses...
                  </td>
                </tr>
              ) : warehouses.length > 0 ? (
                currentPageData.map((wh, index) => (
                  <tr key={wh.id}>
                    <td className="text-center">
                      {(currentPage - 1) * 4 + index + 1}
                    </td>
                    <td>{wh.code}</td>
                    <td>{wh.name}</td>
                    <td style={{ whiteSpace: "normal" }}>{wh.address}</td>
                    <td className="text-center">
                      <button
                        className="btn-icon-danger"
                        onClick={() => promptDeleteWarehouse(wh)}
                        title={`Delete ${wh.name}`}
                        disabled={isSubmitting}
                      >
                        <DeleteIcon />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data-cell">
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

        <div className="form-section">
          <h3 className="form-section-title">Create New Warehouse</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="warehouseCode" className="form-label">
                Code:<span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="warehouseCode"
                name="code"
                className={`form-input ${
                  clientFormErrors.code ? "input-error" : ""
                }`}
                value={newWarehouse.code}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-field">
              <label htmlFor="warehouseName" className="form-label">
                Name:<span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="warehouseName"
                name="name"
                className={`form-input ${
                  clientFormErrors.name ? "input-error" : ""
                }`}
                value={newWarehouse.name}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="warehouseAddress" className="form-label">
                Address:<span className="required-star">*</span>
              </label>
              <textarea
                id="warehouseAddress"
                name="address"
                className={`form-textarea ${
                  clientFormErrors.address ? "input-error" : ""
                }`}
                value={newWarehouse.address}
                onChange={handleInputChange}
                placeholder="Enter full address details"
                rows="3"
                disabled={isSubmitting}
              ></textarea>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddWarehouse}
            disabled={isSubmitting || isLoading}
            style={{ alignSelf: "flex-start" }}
          >
            {isSubmitting ? "Adding..." : "Add Warehouse"}
          </button>
        </div>
      </div>

      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      <ConfirmationModal
        message={
          warehouseToDelete
            ? `Are you sure you want to delete warehouse "${warehouseToDelete.name} (${warehouseToDelete.code})"?`
            : ""
        }
        onConfirm={handleDeleteWarehouse}
        onCancel={() => setShowDeleteConfirm(false)}
        isConfirming={isSubmitting}
      />
    </>
  );
};

export default Warehouse;
