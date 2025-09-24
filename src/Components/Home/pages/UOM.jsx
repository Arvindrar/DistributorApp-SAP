import React, { useState, useEffect, useCallback } from "react";
import "./UOM.css";
import { API_UOM_ENDPOINT, API_UOM_GROUP_ENDPOINT } from "../../../config";
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

// --- Reusable Icon and Modal Components (No changes needed here) ---
const LookupIcon = () => (
  <span className="uom-lookup-icon" title="Lookup UOM Group">
    ○
  </span>
);

const MessageModal = ({ message, onClose, type = "success" }) => {
  if (!message) return null;
  return (
    <div className="uom-modal-overlay">
      <div className={`uom-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="uom-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

const UOM = () => {
  const [uoms, setUoms] = useState([]);
  const [newUomName, setNewUomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [uomGroups, setUomGroups] = useState([]);
  const [isLoadingUomGroups, setIsLoadingUomGroups] = useState(false);
  const [uomGroupsError, setUomGroupsError] = useState(null);
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [searchTermModal, setSearchTermModal] = useState("");

  const pagination = useDynamicPagination(uoms, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  // *** LOGIC CORRECTION #1: Separate the two fetch functions properly ***

  // Fetches the main list of individual UOMs for the table
  const fetchUoms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_UOM_ENDPOINT);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setUoms(data || []);
    } catch (e) {
      console.error("Failed to fetch UOMs:", e);
      setError(e.message || "Failed to load UOMs. Please try refreshing.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetches the list of UOM Groups ONLY for the lookup modal
  const fetchUomGroupsForModal = useCallback(async () => {
    setIsLoadingUomGroups(true);
    setUomGroupsError(null);
    try {
      const response = await fetch(API_UOM_GROUP_ENDPOINT);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`UOM Group API Error: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setUomGroups(data || []);
    } catch (e) {
      console.error("Failed to fetch UOM Groups for modal:", e);
      setUomGroupsError(e.message || "Failed to load groups for lookup.");
    } finally {
      setIsLoadingUomGroups(false);
    }
  }, []);

  useEffect(() => {
    fetchUoms(); // Fetch the main list on initial component load
  }, [fetchUoms]);

  // *** LOGIC CORRECTION #2: The handleAddUom function is updated ***
  const handleAddUom = async () => {
    if (newUomName.trim() === "") {
      setFormError("UOM name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setError(null);
    setSuccessMessage("");

    // The payload for creating a new UOM is simple.
    // It sends a request to the /api/UOMs endpoint.
    const uomData = {
      name: newUomName.trim(),
      description: newUomName.trim(), // Optional, but good practice
    };

    try {
      const response = await fetch(API_UOM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uomData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exists")) {
          throw new Error("A UOM with this name already exists!");
        }
        let detailedError = `Request failed: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          detailedError = errorData.title || errorText;
        } catch {
          detailedError = errorText || detailedError;
        }
        throw new Error(detailedError);
      }

      setSuccessMessage("UOM added successfully!");
      setNewUomName("");
      await fetchUoms(); // Refresh the main UOM list
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add UOM:", e);
      setFormError(e.message || "An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setSuccessMessage("");
    setFormError("");
    setError("");
  };

  const openLookupModal = () => {
    setSearchTermModal("");
    // Fetch the groups only when the modal is opened, to ensure fresh data
    fetchUomGroupsForModal();
    setIsLookupModalOpen(true);
  };

  const handleSelectUomGroupFromModal = (selectedGroup) => {
    // This action simply populates the input field.
    // It does NOT create anything.
    setNewUomName(selectedGroup.name);
    setIsLookupModalOpen(false);
  };

  const filteredModalUomGroups = uomGroups.filter((group) => {
    const term = searchTermModal.toLowerCase();
    return group.name && group.name.toLowerCase().includes(term);
  });

  return (
    <>
      <div className="uom-page-content">
        <MessageModal
          message={successMessage}
          onClose={closeModal}
          type="success"
        />
        <MessageModal message={formError} onClose={closeModal} type="error" />
        {error && !formError && (
          <MessageModal message={error} onClose={closeModal} type="error" />
        )}

        <h1 className="uom-main-title">Units of Measure (UOM)</h1>

        {isLoading && <p className="uom-loading-message">Loading UOMs...</p>}

        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="uom-th-serial">Serial No</th>
                <th className="uom-th-uomname">UOM Name</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading &&
                uoms.length > 0 &&
                currentPageData.map((uom, index) => (
                  <tr key={uom.id}>
                    <td className="uom-td-serial">
                      {(currentPage - 1) * 4 + index + 1}
                    </td>
                    <td>{uom.name}</td>
                  </tr>
                ))}
              {!isLoading && uoms.length === 0 && !error && (
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

        {/* --- LOGIC CORRECTION #3: The form is now a simple text input with a lookup helper --- */}
        <div className="uom-create-section">
          <h3 className="uom-create-title">Create New UOM</h3>
          <div className="uom-form-row">
            <label htmlFor="uomNameInput" className="uom-label">
              UOM Name :
            </label>
            <div className="uom-input-wrapper">
              <input
                type="text"
                id="uomNameInput"
                className="uom-input uom-input-with-icon"
                value={newUomName}
                placeholder="e.g., Kilogram, Box, or click icon to lookup groups"
                onChange={(e) => {
                  setNewUomName(e.target.value);
                  if (formError) setFormError(null);
                }}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="uom-lookup-indicator"
                onClick={openLookupModal}
                disabled={isLoadingUomGroups}
              >
                <LookupIcon />
              </button>
            </div>
          </div>
          <button
            type="button"
            className="uom-add-button"
            onClick={handleAddUom}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {/* --- UOM Group Lookup Modal (No changes needed here) --- */}
      {isLookupModalOpen && (
        <div className="uom-lookup-modal-overlay">
          <div className="uom-lookup-modal-content">
            <div className="uom-lookup-modal-header">
              <h2>Select UOM Group</h2>
              <button
                className="uom-lookup-modal-close-btn"
                onClick={() => setIsLookupModalOpen(false)}
              >
                {" "}
                ×{" "}
              </button>
            </div>
            <div className="uom-lookup-modal-body">
              <input
                type="text"
                placeholder="Search by group name..."
                className="uom-lookup-modal-search-input"
                value={searchTermModal}
                onChange={(e) => setSearchTermModal(e.target.value)}
                autoFocus
              />
              {isLoadingUomGroups && <p>Loading groups...</p>}
              {uomGroupsError && (
                <p className="uom-lookup-modal-error-text">
                  Error: {uomGroupsError}
                </p>
              )}
              {!isLoadingUomGroups && !uomGroupsError && (
                <div className="uom-lookup-table-container">
                  <table className="uom-lookup-table">
                    <thead>
                      <tr>
                        <th>UOM Group Name</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModalUomGroups.length > 0 ? (
                        filteredModalUomGroups.map((group) => (
                          <tr
                            key={group.id}
                            onClick={() => handleSelectUomGroupFromModal(group)}
                          >
                            <td>{group.name}</td>
                            <td>{group.description}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="uom-lookup-modal-no-data">
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
        </div>
      )}
    </>
  );
};

export default UOM;
