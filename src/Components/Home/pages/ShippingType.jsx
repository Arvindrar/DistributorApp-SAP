import React, { useState, useEffect, useCallback } from "react";
import "./ShippingType.css";

// Step 1: Import the reusable pagination hook and component
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

const API_BASE_URL = "https://localhost:7074/api";

// Simple Modal Component for messages
const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive || !message) return null;
  return (
    <div className="st-modal-overlay">
      <div className={`st-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="st-modal-close-button">
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

  // Step 2: Instantiate the pagination hook with 4 items per page
  const pagination = useDynamicPagination(shippingTypes, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

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
          /* ignore parse error */
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

    const shippingTypeData = {
      name: newShippingTypeName.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/ShippingType`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shippingTypeData),
      });

      if (!response.ok) {
        // Simplified error handling
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
      // Step 3: Reset to page 1 after adding a new shipping type
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

  return (
    <div className="st-page-content">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      <h1 className="st-main-title">Shipping Type Management</h1>

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="st-th-serial">Serial No.</th>
              <th className="st-th-typename">Shipping Type Name</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="2" className="st-loading-cell">
                  Loading shipping types...
                </td>
              </tr>
            )}
            {!isLoading &&
              // Step 4: Map over the paginated data
              currentPageData.map((type, index) => (
                <tr key={type.id || index}>
                  {/* Step 5: Calculate the serial number correctly */}
                  <td className="st-td-serial">
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

      {/* Step 6: Add the Pagination component */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />

      <div className="st-create-section">
        <h3 className="st-create-title">Add New Shipping Type</h3>
        <div className="st-form-row">
          <label htmlFor="shippingTypeNameInput" className="st-label">
            Shipping Type Name :
          </label>
          <input
            type="text"
            id="shippingTypeNameInput"
            className="st-input"
            value={newShippingTypeName}
            onChange={(e) => setNewShippingTypeName(e.target.value)}
            placeholder="Enter shipping type name"
            disabled={isSubmitting || isLoading}
          />
        </div>
        <button
          type="button"
          className="st-add-button"
          onClick={handleAddShippingType}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Adding..." : "Add Type"}
        </button>
      </div>
    </div>
  );
};

export default ShippingType;
