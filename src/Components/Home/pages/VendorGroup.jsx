import React, { useState, useEffect, useCallback } from "react";
import "./VendorGroup.css";
// Step 1: Import the reusable pagination hook and component
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

const API_BASE_URL = "https://localhost:7074/api";

// Simple Modal Component for messages
const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive || !message) return null;
  return (
    <div className="vg-modal-overlay">
      <div className={`vg-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="vg-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

const VendorGroup = () => {
  const [vendorGroups, setVendorGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  // Step 2: Instantiate the pagination hook with 4 items per page
  const pagination = useDynamicPagination(vendorGroups, {
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
      const response = await fetch(`${API_BASE_URL}/VendorGroup`);
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
      setVendorGroups(data);
    } catch (e) {
      console.error("Failed to fetch vendor groups:", e);
      showModal(
        e.message || "Failed to load vendor groups. Please try refreshing.",
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
      showModal("Vendor group name cannot be empty.", "error");
      return;
    }

    setIsSubmitting(true);
    closeModal();

    const groupData = { name: newGroupName.trim() };

    try {
      const response = await fetch(`${API_BASE_URL}/VendorGroup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        // Simplified error handling
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exist")) {
          throw new Error("Vendor Group Already Exists!");
        }
        throw new Error(
          errorText || `Request failed with status ${response.status}`
        );
      }

      showModal("Vendor Group added successfully!", "success");
      setNewGroupName("");
      await fetchGroups();
      // Step 3: Reset to page 1 after adding a new group
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add vendor group:", e);
      showModal(e.message || "Failed to add group. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vg-page-content">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      <h1 className="vg-main-title">Vendor Group Management</h1>

      <div className="vg-table-responsive-container">
        <table className="vg-data-table">
          <thead>
            <tr>
              <th className="vg-th-serial">Serial No.</th>
              <th className="vg-th-groupname">Vendor Group</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="2" className="vg-loading-cell">
                  Loading vendor groups...
                </td>
              </tr>
            )}
            {!isLoading &&
              // Step 4: Map over the paginated data
              currentPageData.map((group, index) => (
                <tr key={group.id || index}>
                  {/* Step 5: Calculate the serial number correctly */}
                  <td className="vg-td-serial">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{group.name}</td>
                </tr>
              ))}
            {!isLoading &&
              vendorGroups.length === 0 &&
              !modalState.isActive && (
                <tr>
                  <td colSpan="2" className="vg-no-data-cell">
                    No vendor groups found.
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

      <div className="vg-create-section">
        <h3 className="vg-create-title">Create New Group</h3>
        <div className="vg-form-row">
          <label htmlFor="vendorGroupNameInput" className="vg-label">
            Vendor Group :
          </label>
          <input
            type="text"
            id="vendorGroupNameInput"
            className="vg-input"
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
          className="vg-add-button"
          onClick={handleAddGroup}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
};

export default VendorGroup;
