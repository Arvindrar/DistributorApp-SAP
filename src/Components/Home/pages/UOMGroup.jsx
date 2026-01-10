import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom"; // Import ReactDOM for portals

// --- CHANGE #1: Comment out the old CSS and import the new shared stylesheet ---
// import "./UOMGroup.css";
import "../../../styles/List.css";

import { API_UOM_GROUP_ENDPOINT } from "../../../config";
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

// Modal component using GENERIC classes and PORTAL
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

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className={`modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className={buttonClassName}>
          OK
        </button>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

const UOMGroup = () => {
  const [uomGroups, setUomGroups] = useState([]);
  const [newUomGroupCode, setNewUomGroupCode] = useState("");
  const [newUomGroupName, setNewUomGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CHANGE #2: Simplified modal state management ---
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  const pagination = useDynamicPagination(uomGroups, {
    fixedItemsPerPage: 8,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  // --- CHANGE #3: Simplified modal helper functions ---
  const showModal = (message, type = "info") => {
    setModalState({ message, type, isActive: true });
  };
  const closeModal = () => {
    setModalState({ message: "", type: "info", isActive: false });
  };

  const fetchUomGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_UOM_GROUP_ENDPOINT);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setUomGroups(data || []);
    } catch (e) {
      console.error("Failed to fetch UOM Groups:", e);
      showModal(e.message || "Failed to load UOM Groups.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUomGroups();
  }, [fetchUomGroups]);

  const handleAddUomGroup = async () => {
    if (newUomGroupCode.trim() === "" || newUomGroupName.trim() === "") {
      showModal("UOM Group Code and Name cannot be empty.", "error");
      return;
    }
    setIsSubmitting(true);
    const uomGroupData = {
      code: newUomGroupCode.trim(),
      name: newUomGroupName.trim(),
      description: newUomGroupName.trim(),
    };
    try {
      const response = await fetch(API_UOM_GROUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uomGroupData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let detailedError = `Request failed: ${response.status}.`;
        try {
          const errorJson = JSON.parse(errorText);
          detailedError =
            errorJson?.error?.message?.value || JSON.stringify(errorJson);
        } catch {
          detailedError = errorText.trim() || detailedError;
        }
        throw new Error(detailedError);
      }
      showModal("UOM Group added successfully!", "success");
      setNewUomGroupCode("");
      setNewUomGroupName("");
      await fetchUomGroups();
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add UOM Group:", e);
      showModal(e.message || "An unknown error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-container">
        {/* <h1 className="page-title">UOM Groups</h1> */}

        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: "100px" }}>
                  Serial No
                </th>
                <th>UOM Group Code</th>
                <th>Name / Description</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="3" className="loading-cell">
                    Loading...
                  </td>
                </tr>
              ) : uomGroups.length > 0 ? (
                currentPageData.map((group, index) => (
                  <tr key={group.id}>
                    <td className="text-center">
                      {(currentPage - 1) * 4 + index + 1}
                    </td>
                    <td>{group.code}</td>
                    <td>{group.name}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="no-data-cell">
                    No UOM Groups found.
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
          <h3 className="form-section-title">Create New UOM Group</h3>
          <div className="form-field">
            <label htmlFor="uomGroupCodeInput" className="form-label">
              UOM Group Code:
            </label>
            <input
              type="text"
              id="uomGroupCodeInput"
              className="form-input"
              style={{ maxWidth: "500px" }}
              value={newUomGroupCode}
              placeholder="e.g., PKT20, COIL100"
              onChange={(e) => setNewUomGroupCode(e.target.value.toUpperCase())}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-field">
            <label htmlFor="uomGroupNameInput" className="form-label">
              UOM Group Name / Description:
            </label>
            <input
              type="text"
              id="uomGroupNameInput"
              className="form-input"
              style={{ maxWidth: "500px" }}
              value={newUomGroupName}
              placeholder="e.g., Packet - 20 Pieces, Coil - 100 Metres"
              onChange={(e) => setNewUomGroupName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddUomGroup}
            disabled={isSubmitting || isLoading}
            style={{ alignSelf: "flex-start" }}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </button>
        </div> */}
      </div>

      {/* The modal is now outside the main container and uses the portal */}
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
    </>
  );
};

export default UOMGroup;
