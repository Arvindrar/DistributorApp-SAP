import React, { useState, useEffect, useCallback } from "react";
import "./CustomerGroup.css";

// Step 1: Import the reusable pagination hook and component
import useDynamicPagination from "../../hooks/useDynamicPagination";
import Pagination from "../Common/Pagination";

const API_BASE_URL = "https://localhost:7074/api";

// Simple Modal Component for messages
const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive || !message) return null;
  return (
    <div className="cg-modal-overlay">
      <div className={`cg-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="cg-modal-close-button">
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

  // Step 2: Instantiate the pagination hook with 4 items per page
  const pagination = useDynamicPagination(customerGroups, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

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
          /* ignore parse error */
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

    const groupData = {
      name: newGroupName.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/CustomerGroup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        // Simplified error handling
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
      // Step 3: Reset to page 1 after adding a new group
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add customer group:", e);
      showModal(e.message || "Failed to add group. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cg-page-content">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />

      <h1 className="cg-main-title">Customer Group Management</h1>

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="cg-th-serial">Serial No.</th>
              <th className="cg-th-groupname">Customer Group</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="2" className="cg-loading-cell">
                  Loading customer groups...
                </td>
              </tr>
            )}
            {!isLoading &&
              // Step 4: Map over the paginated data
              currentPageData.map((group, index) => (
                <tr key={group.id || index}>
                  {/* Step 5: Calculate the serial number correctly */}
                  <td className="cg-td-serial">
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

      {/* Step 6: Add the Pagination component */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />

      <div className="cg-create-section">
        <h3 className="cg-create-title">Create New Group</h3>
        <div className="cg-form-row">
          <label htmlFor="customerGroupNameInput" className="cg-label">
            Customer Group :
          </label>
          <input
            type="text"
            id="customerGroupNameInput"
            className="cg-input"
            value={newGroupName}
            onChange={(e) => {
              setNewGroupName(e.target.value);
            }}
            placeholder="Enter group name"
            disabled={isSubmitting || isLoading}
          />
        </div>
        <button
          type="button"
          className="cg-add-button"
          onClick={handleAddGroup}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
};

export default CustomerGroup;
