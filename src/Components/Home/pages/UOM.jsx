import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

import "../../../styles/List.css";

import { API_UOM_ENDPOINT, API_UOM_GROUP_ENDPOINT } from "../../../config";
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

const LookupIcon = () => <span title="Lookup UOM Group">○</span>;

const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive) return null;
  const targetNode = document.getElementById("modal-root");
  if (!targetNode) return null; // Safety check

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

const UOMGroupLookupModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;
  const targetNode = document.getElementById("modal-root");
  if (!targetNode) return null; // Safety check

  const [uomGroups, setUomGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUomGroups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_UOM_GROUP_ENDPOINT);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        setUomGroups(data || []);
      } catch (e) {
        setError(e.message || "Failed to load groups.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUomGroups();
  }, []);

  const filteredGroups = uomGroups.filter(
    (g) => g.name && g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="lookup-modal-content">
        <div className="lookup-modal-header">
          <h2 className="lookup-modal-title">Select UOM Group</h2>
          <button className="lookup-modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="lookup-modal-body">
          <input
            type="text"
            placeholder="Search by group name..."
            className="form-input lookup-modal-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {isLoading && <p>Loading groups...</p>}
          {error && <p className="lookup-modal-error-text">Error: {error}</p>}
          {!isLoading && !error && (
            <div className="lookup-table-container">
              <table className="lookup-table">
                <thead>
                  <tr>
                    <th>UOM Group Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                      <tr key={group.id} onClick={() => onSelect(group)}>
                        <td>{group.name}</td>
                        <td>{group.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="lookup-modal-no-data">
                        No UOM Groups found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    targetNode
  );
};

const UOM = () => {
  const [uoms, setUoms] = useState([]);
  const [newUomName, setNewUomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const pagination = useDynamicPagination(uoms, { fixedItemsPerPage: 8 });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const showModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeModal = () =>
    setModalState({ message: "", type: "info", isActive: false });

  const fetchUoms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_UOM_ENDPOINT);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setUoms(data || []);
    } catch (e) {
      showModal(e.message || "Failed to load UOMs.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchUoms();
  }, [fetchUoms]);

  // Find this function in your UOM.jsx file

  const handleAddUom = async () => {
    if (newUomName.trim() === "") {
      showModal("UOM name cannot be empty.", "error");
      return;
    }
    setIsSubmitting(true);

    // --- THIS IS THE FIX ---
    // Create a new object for the payload that ONLY includes the necessary fields.
    // We are intentionally OMITTING the 'id' field.
    const payload = {
      name: newUomName.trim(),
      description: newUomName.trim(), // Optional but good practice
    };

    try {
      const response = await fetch(API_UOM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the new, clean payload without an 'id'
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Check for a specific error message from the backend
        if (errorText.toLowerCase().includes("already exists")) {
          throw new Error("A UOM with this name already exists!");
        }
        // Fallback for other errors
        throw new Error(
          errorText || `Request failed with status: ${response.status}`
        );
      }

      showModal("UOM added successfully!", "success");
      setNewUomName(""); // Clear the input field
      await fetchUoms(); // Refresh the list from the server

      // Logic to go to the last page (this part is correct)
      const newTotalItems = uoms.length + 1;
      const newTotalPages = Math.ceil(newTotalItems / 4); // Assuming 4 items per page
      setCurrentPage(newTotalPages);
    } catch (e) {
      showModal(
        e.message || "An unknown error occurred while adding the UOM.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLookupModal = () => setIsLookupModalOpen(true);
  const handleSelectUomGroupFromModal = (selectedGroup) => {
    setNewUomName(selectedGroup.name);
    setIsLookupModalOpen(false);
  };

  return (
    <>
      <div className="page-container">
        {/* <h1 className="page-title">Units of Measure (UOM)</h1> */}
        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: "100px" }}>
                  Serial No
                </th>
                <th>UOM Name</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="2" className="loading-cell">
                    Loading UOMs...
                  </td>
                </tr>
              )}
              {!isLoading &&
                currentPageData.map((uom, index) => (
                  <tr key={uom.id}>
                    <td className="text-center">
                      {(currentPage - 1) * 4 + index + 1}
                    </td>
                    <td>{uom.name}</td>
                  </tr>
                ))}
              {!isLoading && uoms.length === 0 && (
                <tr>
                  <td colSpan="2" className="no-data-cell">
                    No UOMs found. Add one below.
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
          <h3 className="form-section-title">Create New UOM</h3>
          <div className="form-row">
            <label htmlFor="uomNameInput" className="form-label">
              UOM Name:
            </label>
            <div className="input-wrapper" style={{ maxWidth: "500px" }}>
              <input
                type="text"
                id="uomNameInput"
                className="form-input form-input-with-icon"
                value={newUomName}
                placeholder="e.g., Kilogram, Box, or click icon to lookup groups"
                onChange={(e) => setNewUomName(e.target.value)}
                disabled={isSubmitting}
              /> */}
        {/* <button
                type="button"
                className="lookup-button"
                onClick={openLookupModal}
              >
                <LookupIcon />
              </button> */}
        {/* </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddUom}
            disabled={isSubmitting || isLoading}
            style={{ alignSelf: "flex-start" }}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </button>
        </div> */}
      </div>
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      {/* <UOMGroupLookupModal
        isOpen={isLookupModalOpen}
        onClose={() => setIsLookupModalOpen(false)}
        onSelect={handleSelectUomGroupFromModal}
      /> */}
    </>
  );
};

export default UOM;
