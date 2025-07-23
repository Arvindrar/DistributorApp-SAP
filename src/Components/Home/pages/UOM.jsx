import React, { useState, useEffect, useCallback } from "react";
import "./UOM.css"; // Styles specific to this component
import { API_UOM_ENDPOINT, API_UOM_GROUP_ENDPOINT } from "../../../config"; // Import BOTH endpoints

// Step 1: Import the reusable pagination hook and component
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

// --- Reusable Icon Component ---
const LookupIcon = () => (
  <span className="uom-lookup-icon" title="Lookup UOM Group">
    ○
  </span>
);

// Simple Message Modal Component
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
  // State for the main UOM list
  const [uoms, setUoms] = useState([]);
  const [newUomName, setNewUomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // --- NEW: State for UOM Group Lookup ---
  const [uomGroups, setUomGroups] = useState([]);
  const [isLoadingUomGroups, setIsLoadingUomGroups] = useState(false);
  const [uomGroupsError, setUomGroupsError] = useState(null);
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [searchTermModal, setSearchTermModal] = useState("");

  // Step 2: Instantiate the pagination hook for the main UOM list, with 4 items per page
  const pagination = useDynamicPagination(uoms, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  // Fetch UOMs (for the main table)
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
      setUoms(data);
    } catch (e) {
      console.error("Failed to fetch UOMs:", e);
      setError(e.message || "Failed to load UOMs. Please try refreshing.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Fetch UOM Groups for the lookup modal ---
  const fetchUomGroups = useCallback(async () => {
    setIsLoadingUomGroups(true);
    setUomGroupsError(null);
    try {
      const response = await fetch(API_UOM_GROUP_ENDPOINT);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`UOM Group API Error: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setUomGroups(data);
    } catch (e) {
      console.error("Failed to fetch UOM Groups:", e);
      setUomGroupsError(e.message || "Failed to load UOM Groups for lookup.");
    } finally {
      setIsLoadingUomGroups(false);
    }
  }, []);

  useEffect(() => {
    fetchUoms();
    fetchUomGroups();
  }, [fetchUoms, fetchUomGroups]);

  const handleAddUom = async () => {
    if (newUomName.trim() === "") {
      setFormError("UOM name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setError(null);
    setSuccessMessage("");

    const uomData = {
      name: newUomName.trim(),
    };

    try {
      const response = await fetch(API_UOM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uomData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exists")) {
          throw new Error("UOM already exists!");
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

      // Step 3: Reset to page 1 after adding a new UOM
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

  // --- Handlers for UOM Group Lookup Modal (Unchanged) ---
  const openLookupModal = () => {
    setSearchTermModal("");
    setIsLookupModalOpen(true);
  };

  const handleSelectUomGroupFromModal = (selectedGroup) => {
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
        {!isLoading && error && !formError && (
          <p className="uom-fetch-error-message">{error}</p>
        )}

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
                // Step 4: Map over the paginated data (currentPageData)
                currentPageData.map((uom, index) => (
                  <tr key={uom.id}>
                    {/* Step 5: Calculate the serial number correctly */}
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

        {/* Step 6: Add the Pagination component */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onNext={pagination.nextPage}
          onPrevious={pagination.prevPage}
        />

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

      {/* --- UOM Group Lookup Modal (Unchanged) --- */}
      {isLookupModalOpen && (
        <div className="uom-lookup-modal-overlay">
          <div className="uom-lookup-modal-content">
            <div className="uom-lookup-modal-header">
              <h2>Select UOM Group</h2>
              <button
                className="uom-lookup-modal-close-btn"
                onClick={() => setIsLookupModalOpen(false)}
              >
                ×
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
