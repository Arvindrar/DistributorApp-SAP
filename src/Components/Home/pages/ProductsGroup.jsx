import React, { useState, useEffect, useCallback } from "react";
import "../../../styles/List.css";
import { API_PRODUCT_GROUPS_ENDPOINT } from "../../../config"; // Assuming this is correct

import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

// REFACTORED Modal Component to use a single state object and generic classes
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

const ProductsGroup = () => {
  const [productGroups, setProductGroups] = useState([]);
  const [newPGroupName, setNewPGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // REFACTORED state management to use a single modal state object
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  const pagination = useDynamicPagination(productGroups, {
    fixedItemsPerPage: 7,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  // REFACTORED modal helper functions
  const showModal = (message, type = "info") => {
    setModalState({ message, type, isActive: true });
  };
  const closeModal = () => {
    setModalState({ message: "", type: "info", isActive: false });
  };

  const fetchProductGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_PRODUCT_GROUPS_ENDPOINT);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setProductGroups(data);
    } catch (e) {
      console.error("Failed to fetch product groups:", e);
      showModal(
        e.message || "Failed to load product groups. Please try refreshing.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductGroups();
  }, [fetchProductGroups]);

  const handleAddPGroup = async () => {
    if (newPGroupName.trim() === "") {
      showModal("Product group name cannot be empty.", "error");
      return;
    }
    setIsSubmitting(true);
    const groupData = { name: newPGroupName.trim() };

    try {
      const response = await fetch(API_PRODUCT_GROUPS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });
      if (!response.ok) {
        // Simplified error handling
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exist")) {
          throw new Error("Product Group with this name already exists!");
        }
        throw new Error(
          errorText || `Request failed with status ${response.status}`
        );
      }
      showModal("Product Group added successfully!", "success");
      setNewPGroupName("");
      await fetchProductGroups();
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add product group:", e);
      showModal(e.message || "Failed to add group.", "error");
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

      {/* <h1 className="page-title">Products Group</h1> */}

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: "100px" }}>
                Serial No
              </th>
              <th>Products Group</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="2" className="loading-cell">
                  Loading product groups...
                </td>
              </tr>
            )}
            {!isLoading &&
              currentPageData.map((group, index) => (
                <tr key={group.id}>
                  <td className="text-center">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{group.name}</td>
                </tr>
              ))}
            {!isLoading && productGroups.length === 0 && (
              <tr>
                <td colSpan="2" className="no-data-cell">
                  No product groups found. Add one below.
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

      {/* <div className="form-section">
        <h3 className="form-section-title">Create New Group</h3>
        <div className="form-row">
          <label htmlFor="productGroupNameInput" className="form-label">
            Products Group Name:
          </label>
          <input
            type="text"
            id="productGroupNameInput"
            className="form-input"
            style={{ width: "400px", flexGrow: 0 }}
            value={newPGroupName}
            onChange={(e) => setNewPGroupName(e.target.value)}
            placeholder="Enter group name"
            disabled={isSubmitting || isLoading}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddPGroup}
          disabled={isSubmitting || isLoading}
          style={{ alignSelf: "flex-start" }}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div> */}
    </div>
  );
};

export default ProductsGroup;
