import React, { useState, useEffect, useCallback } from "react";
import "./ProductsGroup.css"; // Styles specific to this component
import { API_PRODUCT_GROUPS_ENDPOINT } from "../../../config"; // Adjust path if needed

// Step 1: Import the reusable pagination hook and component
import useDynamicPagination from "../../../hooks/useDynamicPagination"; // Assuming same path as ShippingType
import Pagination from "../../Common/Pagination"; // Assuming same path as ShippingType

// Simple Modal Component (can be shared or local)
const MessageModal = ({ message, onClose, type = "success" }) => {
  if (!message) return null;
  return (
    <div className="pg-modal-overlay">
      <div className={`pg-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="pg-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

const ProductsGroup = () => {
  const [productGroups, setProductGroups] = useState([]);
  const [newPGroupName, setNewPGroupName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Step 2: Instantiate the pagination hook with 4 items per page
  const pagination = useDynamicPagination(productGroups, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  // Fetch product groups from the backend
  const fetchProductGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_PRODUCT_GROUPS_ENDPOINT);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setProductGroups(data);
    } catch (e) {
      console.error("Failed to fetch product groups:", e);
      setError(
        e.message || "Failed to load product groups. Please try refreshing."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // useEffect to call fetchProductGroups when the component mounts
  useEffect(() => {
    fetchProductGroups();
  }, [fetchProductGroups]);

  const handleAddPGroup = async () => {
    if (newPGroupName.trim() === "") {
      setFormError("Product group name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setError(null);
    setSuccessMessage("");

    const groupData = {
      name: newPGroupName.trim(),
    };

    try {
      const response = await fetch(API_PRODUCT_GROUPS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.errors && errorData.errors.Name) {
            errorMessage = errorData.errors.Name.join(" ");
          } else if (errorData.title) {
            errorMessage = errorData.title;
          } else if (
            typeof errorData === "string" &&
            errorData.includes("already exists")
          ) {
            errorMessage = errorData;
          } else {
            errorMessage = response.statusText;
          }
        } catch (e) {
          errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
      }

      setSuccessMessage("Product Group added successfully!");
      setNewPGroupName("");
      await fetchProductGroups();
      // Step 3: Reset to page 1 after adding a new product group
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add product group:", e);
      setFormError(e.message || "Product Group Already Exists!");
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
    <div className="pg-page-content">
      <MessageModal
        message={successMessage}
        onClose={closeModal}
        type="success"
      />
      <MessageModal message={formError} onClose={closeModal} type="error" />
      {error && !formError && (
        <MessageModal message={error} onClose={closeModal} type="error" />
      )}

      <h1 className="pg-main-title">Products Group</h1>

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="pg-th-serial">Serial No</th>
              <th className="pg-th-groupname">Products Group</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="2" className="pg-loading-cell">
                  Loading product groups...
                </td>
              </tr>
            )}
            {!isLoading &&
              // Step 4: Map over the paginated data (currentPageData) instead of the full list
              currentPageData.map((group, index) => (
                <tr key={group.id}>
                  {/* Step 5: Calculate the serial number correctly based on the current page */}
                  <td className="pg-td-serial">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{group.name}</td>
                </tr>
              ))}
            {!isLoading && productGroups.length === 0 && !error && (
              <tr>
                <td colSpan="2" className="no-data-cell">
                  No product groups found. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Step 6: Add the Pagination component and pass props from the hook */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />

      <div className="pg-create-section">
        <h3 className="pg-create-title">Create New Group</h3>
        <div className="pg-form-row">
          <label htmlFor="productGroupNameInput" className="pg-label">
            Products group :
          </label>
          <input
            type="text"
            id="productGroupNameInput"
            className="pg-input"
            value={newPGroupName}
            onChange={(e) => {
              setNewPGroupName(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="Enter group name"
            disabled={isSubmitting || isLoading}
          />
        </div>
        <button
          type="button"
          className="pg-add-button"
          onClick={handleAddPGroup}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
};

export default ProductsGroup;
