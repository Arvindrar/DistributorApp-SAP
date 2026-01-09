import React, { useState, useEffect, useCallback } from "react";
import "../../../styles/List.css";

import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

const API_BASE_URL = "https://localhost:7074/api";

// Modal Component - UPDATED with generic class names
const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive || !message) return null;

  const buttonClassMap = {
    success: "btn-primary",
    error: "btn-danger",
    info: "btn-primary",
  };
  const buttonClassName = `btn modal-close-button ${
    buttonClassMap[type] || "btn-primary"
  }`;

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className={buttonClassName}>
          OK
        </button>
      </div>
    </div>
  );
};

const ShippingType = () => {
  const [shippingTypes, setShippingTypes] = useState([]);
  const [newShippingTypeName, setNewShippingTypeName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  const pagination = useDynamicPagination(shippingTypes, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  // ... (All your existing functions remain unchanged) ...
  const showModal = (message, type = "info") => {
    setModalState({ message, type, isActive: true });
  };
  const closeModal = () => {
    setModalState({ message: "", type: "info", isActive: false });
  };
  const fetchShippingTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ShippingType`);
      if (!response.ok) {
        let errorMsg = `Error fetching shipping types: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg =
            errorData.title ||
            errorData.detail ||
            errorData.message ||
            (typeof errorData === "string" && errorData) ||
            errorMsg;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setShippingTypes(data);
    } catch (e) {
      console.error("Failed to fetch shipping types:", e);
      showModal(
        e.message || "Failed to load shipping types. Please try refreshing.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchShippingTypes();
  }, [fetchShippingTypes]);
  const handleAddShippingType = async () => {
    if (newShippingTypeName.trim() === "") {
      showModal("Shipping Type name cannot be empty.", "error");
      return;
    }
    setIsSubmitting(true);
    closeModal();
    const shippingTypeData = { name: newShippingTypeName.trim() };
    try {
      const response = await fetch(`${API_BASE_URL}/ShippingType`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shippingTypeData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exist")) {
          throw new Error("Shipping Type with this name already exists!");
        }
        throw new Error(
          errorText || `Request failed with status ${response.status}`
        );
      }
      showModal("Shipping Type added successfully!", "success");
      setNewShippingTypeName("");
      await fetchShippingTypes();
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add shipping type:", e);
      showModal(
        e.message || "Failed to add shipping type. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATED RETURN BLOCK with all new class names
  return (
    <div className="page-container">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      {/* <h1 className="page-title">Shipping Type Management</h1> */}

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: "100px" }}>
                Serial No.
              </th>
              <th>Shipping Type Name</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="2" className="loading-cell">
                  Loading shipping types...
                </td>
              </tr>
            )}
            {!isLoading &&
              currentPageData.map((type, index) => (
                <tr key={type.id || index}>
                  <td className="text-center">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{type.name}</td>
                </tr>
              ))}
            {!isLoading &&
              shippingTypes.length === 0 &&
              !modalState.isActive && (
                <tr>
                  <td colSpan="2" className="no-data-cell">
                    No shipping types found.
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
        <h3 className="form-section-title">Add New Shipping Type</h3>
        <div className="form-row">
          <label htmlFor="shippingTypeNameInput" className="form-label">
            Shipping Type Name:
          </label>
          <input
            type="text"
            id="shippingTypeNameInput"
            className="form-input"
            style={{ width: "400px", flexGrow: 0 }}
            value={newShippingTypeName}
            onChange={(e) => setNewShippingTypeName(e.target.value)}
            placeholder="Enter shipping type name"
            disabled={isSubmitting || isLoading}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddShippingType}
          disabled={isSubmitting || isLoading}
          style={{ alignSelf: "flex-start" }}
        >
          {isSubmitting ? "Adding..." : "Add Type"}
        </button>
      </div>
    </div>
  );
};

export default ShippingType;
