import React, { useState, useEffect, useCallback } from "react";
import "./UOMGroup.css";
import { API_UOM_GROUP_ENDPOINT } from "../../../config";
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

// This modal component is fine as-is.
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
  // State for the new group name that the user types
  const [newUomGroupCode, setNewUomGroupCode] = useState("");
  const [newUomGroupName, setNewUomGroupName] = useState("");
  // Description is optional and will be sent to the backend
  const [newUomGroupDescription, setNewUomGroupDescription] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const pagination = useDynamicPagination(uomGroups, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

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
      // This is now correct: the backend sends a simple array.
      setUomGroups(data || []);
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

  // *** LOGIC CORRECTION #1: The handleAddUomGroup function is updated. ***
  const handleAddUomGroup = async () => {
    if (newUomGroupCode.trim() === "" || newUomGroupName.trim() === "") {
      setFormError("UOM Group Code and Name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setError(null);
    setSuccessMessage("");

    // This is the correct, simple payload to send to your backend service.
    // The backend will handle the complex two-step SAP creation process.
    const uomGroupData = {
      code: newUomGroupCode.trim(),
      name: newUomGroupName.trim(),
      description: newUomGroupName.trim(), // Send description, or use name if it's empty
    };

    try {
      const response = await fetch(API_UOM_GROUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uomGroupData),
      });

      // +++ THIS IS THE NEW, CORRECTED CODE +++
      if (!response.ok) {
        // Read the response body ONCE as text.
        const errorText = await response.text();
        let detailedError = `Request failed with status ${response.status}.`;

        try {
          // Try to parse the text as JSON.
          const errorJson = JSON.parse(errorText);
          // Extract the specific SAP error message if it exists
          if (errorJson?.error?.message?.value) {
            detailedError = errorJson.error.message.value;
          } else if (typeof errorJson === "object" && errorJson !== null) {
            // If not, show the whole JSON object.
            detailedError = JSON.stringify(errorJson);
          } else {
            // If it wasn't JSON, use the raw text.
            detailedError = errorText;
          }
        } catch (e) {
          // If parsing fails, the response was not JSON. Use the raw text.
          detailedError = errorText.trim() !== "" ? errorText : detailedError;
        }

        throw new Error(detailedError);
      }

      setSuccessMessage("UOM Group added successfully!");
      setNewUomGroupCode("");
      setNewUomGroupName("");
      //setNewUomGroupDescription("");
      await fetchUomGroups();
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

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="uomg-th-serial">Serial No</th>
              <th className="uomg-th-groupcode">UOM Group Code</th>
              <th className="uomg-th-description">Name / Description</th>
            </tr>
          </thead>
          <tbody>
            {/* *** THIS IS THE IMPROVED LOGIC *** */}
            {isLoading ? (
              <tr>
                <td colSpan="3" className="uomg-table-message">
                  Loading...
                </td>
              </tr>
            ) : uomGroups.length > 0 ? (
              currentPageData.map((group, index) => (
                <tr key={group.id}>
                  <td className="uomg-td-serial">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{group.code}</td>
                  <td>{group.name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="uomg-table-message">
                  {error ? "Error loading data." : "No UOM Groups found."}
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

      {/* *** LOGIC CORRECTION #2: The form is now just simple text inputs. *** */}
      <div className="uomg-create-section">
        <h3 className="uomg-create-title">Create New UOM Group</h3>
        <div className="uomg-form-row">
          <label htmlFor="uomGroupCodeInput" className="uomg-label">
            UOM Group Code:
          </label>
          <input
            type="text"
            id="uomGroupCodeInput"
            className="uomg-input"
            value={newUomGroupCode}
            placeholder="e.g., PKT20, COIL100"
            onChange={(e) => setNewUomGroupCode(e.target.value.toUpperCase())} // Good practice to force uppercase
            disabled={isSubmitting}
          />
        </div>
        <div className="uomg-form-row">
          <label htmlFor="uomGroupNameInput" className="uomg-label">
            UOM Group Name / Description:
          </label>
          <input
            type="text"
            id="uomGroupNameInput"
            className="uomg-input"
            value={newUomGroupName}
            placeholder="e.g., Packet - 20 Pieces, Coil - 100 Metres"
            onChange={(e) => setNewUomGroupName(e.target.value)}
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
