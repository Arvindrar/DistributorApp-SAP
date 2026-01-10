import React, { useState, useEffect, useCallback } from "react";
import "../../styles/List.css";

import useDynamicPagination from "../../hooks/useDynamicPagination";
import Pagination from "../Common/Pagination"; // Check this path

const API_BASE_URL = "https://localhost:7074/api";

// Modal Component - UPDATED with new class names
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

const CustomerGroup = () => {
  const [customerGroups, setCustomerGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  const pagination = useDynamicPagination(customerGroups, {
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
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/CustomerGroup`);
      if (!response.ok) {
        let errorMsg = `Error fetching groups: ${response.status} ${response.statusText}`;
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
      setCustomerGroups(data);
    } catch (e) {
      console.error("Failed to fetch customer groups:", e);
      showModal(
        e.message || "Failed to load customer groups. Please try refreshing.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);
  const handleAddGroup = async () => {
    if (newGroupName.trim() === "") {
      showModal("Customer group name cannot be empty.", "error");
      return;
    }
    setIsSubmitting(true);
    closeModal();
    const groupData = { name: newGroupName.trim() };
    try {
      const response = await fetch(`${API_BASE_URL}/CustomerGroup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exist")) {
          throw new Error("Customer Group Already Exists!");
        }
        throw new Error(
          errorText || `Request failed with status ${response.status}`
        );
      }
      showModal("Customer Group added successfully!", "success");
      setNewGroupName("");
      await fetchGroups();
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add customer group:", e);
      showModal(e.message || "Failed to add group. Please try again.", "error");
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

      {/* <h1 className="page-title">Customer Group Management</h1> */}

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: "100px" }}>
                Serial No.
              </th>
              <th>Customer Group</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="2" className="loading-cell">
                  Loading customer groups...
                </td>
              </tr>
            )}
            {!isLoading &&
              currentPageData.map((group, index) => (
                <tr key={group.id || index}>
                  <td className="text-center">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{group.name}</td>
                </tr>
              ))}
            {!isLoading &&
              customerGroups.length === 0 &&
              !modalState.isActive && (
                <tr>
                  <td colSpan="2" className="no-data-cell">
                    No customer groups found.
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
          <label htmlFor="customerGroupNameInput" className="form-label">
            Customer Group Name:
          </label>
          <input
            type="text"
            id="customerGroupNameInput"
            className="form-input"
            style={{ width: "400px", flexGrow: 0 }}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter group name"
            disabled={isSubmitting || isLoading}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddGroup}
          disabled={isSubmitting || isLoading}
          style={{ alignSelf: "flex-start" }}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div> */}
    </div>
  );
};

export default CustomerGroup;
