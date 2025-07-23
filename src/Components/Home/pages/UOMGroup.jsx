import React, { useState, useEffect, useCallback } from "react";
import "./UOMGroup.css"; // Styles specific to this component
import { API_UOM_GROUP_ENDPOINT } from "../../../config"; // Adjust path and ensure this endpoint exists in config.js

// Step 1: Import the reusable pagination hook and component
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

// Simple Modal Component
const MessageModal = ({ message, onClose, type = "success" }) => {
  if (!message) return null;
  return (
    <div className="uomg-modal-overlay">
      <div className={`uomg-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="uomg-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

const UOMGroup = () => {
  const [uomGroups, setUomGroups] = useState([]);
  const [newUomGroupName, setNewUomGroupName] = useState("");
  const [newUomGroupDescription, setNewUomGroupDescription] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Step 2: Instantiate the pagination hook with 4 items per page
  const pagination = useDynamicPagination(uomGroups, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  // Fetch UOM Groups from the backend
  const fetchUomGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_UOM_GROUP_ENDPOINT);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setUomGroups(data);
    } catch (e) {
      console.error("Failed to fetch UOM Groups:", e);
      setError(
        e.message || "Failed to load UOM Groups. Please try refreshing."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUomGroups();
  }, [fetchUomGroups]);

  const handleAddUomGroup = async () => {
    if (newUomGroupName.trim() === "") {
      setFormError("UOM Group name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setError(null);
    setSuccessMessage("");

    const uomGroupData = {
      name: newUomGroupName.trim(),
      description: newUomGroupDescription.trim(),
    };

    try {
      const response = await fetch(API_UOM_GROUP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uomGroupData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exists")) {
          throw new Error("UOM Group already exists!");
        }
        // Fallback for other errors
        let detailedError = `Request failed: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          detailedError = errorData.title || errorText;
        } catch {
          detailedError = errorText || detailedError;
        }
        throw new Error(detailedError);
      }

      setSuccessMessage("UOM Group added successfully!");
      setNewUomGroupName("");
      setNewUomGroupDescription("");
      await fetchUomGroups();

      // Step 3: Reset to page 1 after adding a new UOM group
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add UOM Group:", e);
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

  return (
    <div className="uomg-page-content">
      <MessageModal
        message={successMessage}
        onClose={closeModal}
        type="success"
      />
      <MessageModal message={formError} onClose={closeModal} type="error" />
      {error && !formError && (
        <MessageModal message={error} onClose={closeModal} type="error" />
      )}
      <h1 className="uomg-main-title">UOM Groups</h1>

      {isLoading && (
        <p className="uomg-loading-message">Loading UOM Groups...</p>
      )}
      {!isLoading && error && !formError && (
        <p className="uomg-fetch-error-message">{error}</p>
      )}

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="uomg-th-serial">Serial No</th>
              <th className="uomg-th-groupname">UOM Group Name</th>
              <th className="uomg-th-description">Description</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
              uomGroups.length > 0 &&
              // Step 4: Map over the paginated data (currentPageData)
              currentPageData.map((group, index) => (
                <tr key={group.id}>
                  {/* Step 5: Calculate the serial number correctly */}
                  <td className="uomg-td-serial">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{group.name}</td>
                  <td className="uomg-td-description">{group.description}</td>
                </tr>
              ))}
            {!isLoading && uomGroups.length === 0 && !error && (
              <tr>
                <td colSpan="3" className="no-data-cell">
                  No UOM Groups found. Add one below.
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

      <div className="uomg-create-section">
        <h3 className="uomg-create-title">Create New UOM Group</h3>
        <div className="uomg-form-row">
          <label htmlFor="uomGroupNameInput" className="uomg-label">
            UOM Group Name :
          </label>
          <input
            type="text"
            id="uomGroupNameInput"
            className="uomg-input"
            value={newUomGroupName}
            onChange={(e) => {
              setNewUomGroupName(e.target.value);
              if (formError) setFormError(null);
            }}
            disabled={isSubmitting}
          />
        </div>

        <div className="uomg-form-row">
          <label htmlFor="uomGroupDescInput" className="uomg-label">
            Description :
          </label>
          <textarea
            id="uomGroupDescInput"
            className="uomg-textarea"
            rows="3"
            value={newUomGroupDescription}
            onChange={(e) => setNewUomGroupDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <button
          type="button"
          className="uomg-add-button"
          onClick={handleAddUomGroup}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
};

export default UOMGroup;
