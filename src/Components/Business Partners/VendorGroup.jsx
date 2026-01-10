import React, { useState, useEffect, useCallback } from "react";
import "../../styles/List.css";
import useDynamicPagination from "../../hooks/useDynamicPagination";
import Pagination from "../Common/Pagination"; // Check this path

const API_BASE_URL = "https://localhost:7074/api";

// Modal Component - UPDATED to be more dynamic and use new classes
const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive || !message) return null;

  // Dynamically choose button class based on modal type
  const buttonClassMap = {
    success: "btn-primary",
    error: "btn-danger",
    info: "btn-primary", // or create a btn-info
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

  const pagination = useDynamicPagination(vendorGroups, {
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
      const response = await fetch(`${API_BASE_URL}/VendorGroup`);
      if (!response.ok) {
        throw new Error(`Error fetching groups: ${response.status}`);
      }
      const data = await response.json();
      const sortedData = data.sort((a, b) => a.Name.localeCompare(b.Name));
      setVendorGroups(sortedData);
    } catch (e) {
      console.error("Failed to fetch vendor groups:", e);
      showModal(
        "Failed to load vendor groups. Please try refreshing.",
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
    const groupData = { name: newGroupName.trim() };
    try {
      const response = await fetch(`${API_BASE_URL}/VendorGroup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Request failed: ${response.status}`
        );
      }
      showModal("Vendor Group added successfully!", "success");
      setNewGroupName("");
      await fetchGroups();
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add vendor group:", e);
      showModal(e.message || "Failed to add group. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupCode, groupName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the group "${groupName}"?`
      )
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/VendorGroup/${groupCode}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to delete: ${response.status}`
        );
      }
      showModal(`Group "${groupName}" deleted successfully.`, "success");
      await fetchGroups();
    } catch (e) {
      console.error("Failed to delete group:", e);
      showModal(e.message, "error");
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
      {/* <h1 className="page-title">Vendor Group Management</h1> */}

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: "100px" }}>
                Serial No.
              </th>
              <th>Vendor Group</th>
              {/* <th className="text-center" style={{ width: "120px" }}>
                Actions
              </th> */}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="3" className="loading-cell">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading &&
              currentPageData.map((group, index) => (
                <tr key={group.Code}>
                  <td className="text-center">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{group.Name}</td>
                  {/* <td className="text-center">
                    {group.Code > 0 ? (
                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          handleDeleteGroup(group.Code, group.Name)
                        }
                        disabled={isSubmitting}
                        title="Delete Group"
                      >
                        Delete
                      </button>
                    ) : (
                      <span title="System groups cannot be deleted.">
                        System Group
                      </span>
                    )}
                  </td> */}
                </tr>
              ))}
            {!isLoading && vendorGroups.length === 0 && (
              <tr>
                <td colSpan="3" className="no-data-cell">
                  No groups found.
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
          <label htmlFor="vendorGroupNameInput" className="form-label">
            Vendor Group Name:
          </label>
          <input
            type="text"
            id="vendorGroupNameInput"
            className="form-input"
            style={{ width: "400px", flexGrow: 0 }} // Keep input from stretching full width
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
          style={{ alignSelf: "flex-start" }} // Keep button from stretching full width
        >
          {isSubmitting ? "Saving..." : "Add Group"}
        </button>
      </div> */}
    </div>
  );
};

export default VendorGroup;
