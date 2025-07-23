import React, { useState, useEffect, useCallback } from "react";
import "./Routess.css";

// Step 1: Import the reusable pagination hook and component
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

const API_BASE_URL = "https://localhost:7074/api";

// Simple Modal Component for messages
const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive || !message) return null;
  return (
    <div className="rt-modal-overlay">
      <div className={`rt-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="rt-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

const Routess = () => {
  const [routes, setRoutes] = useState([]);
  const [newRouteName, setNewRouteName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  // Step 2: Instantiate the pagination hook with 4 items per page
  const pagination = useDynamicPagination(routes, { fixedItemsPerPage: 4 });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const showModal = (message, type = "info") => {
    setModalState({ message, type, isActive: true });
  };

  const closeModal = () => {
    setModalState({ message: "", type: "info", isActive: false });
  };

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Routes`);
      if (!response.ok) {
        let errorMsg = `Error fetching routes: ${response.status} ${response.statusText}`;
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
      setRoutes(data);
    } catch (e) {
      console.error("Failed to fetch routes:", e);
      showModal(
        e.message || "Failed to load routes. Please try refreshing.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleAddRoute = async () => {
    if (newRouteName.trim() === "") {
      showModal("Route name cannot be empty.", "error");
      return;
    }

    setIsSubmitting(true);
    closeModal();

    const routeData = {
      name: newRouteName.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/Routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeData),
      });

      if (!response.ok) {
        // Simplified error handling
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exist")) {
          throw new Error("Route Already Exists!");
        }
        throw new Error(
          errorText || `Request failed with status ${response.status}`
        );
      }

      showModal("Route added successfully!", "success");
      setNewRouteName("");
      await fetchRoutes();
      // Step 3: Reset to page 1 after adding a new route
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add route:", e);
      showModal(e.message || "Failed to add route. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rt-page-content">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      <h1 className="rt-main-title">Route Management</h1>

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="rt-th-serial">Serial No.</th>
              <th className="rt-th-routename">Route Name</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="2" className="rt-loading-cell">
                  Loading routes...
                </td>
              </tr>
            )}
            {!isLoading &&
              // Step 4: Map over the paginated data
              currentPageData.map((route, index) => (
                <tr key={route.id || index}>
                  {/* Step 5: Calculate the serial number correctly */}
                  <td className="rt-td-serial">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{route.name}</td>
                </tr>
              ))}
            {!isLoading && routes.length === 0 && !modalState.isActive && (
              <tr>
                <td colSpan="2" className="no-data-cell">
                  No routes found.
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

      <div className="rt-create-section">
        <h3 className="rt-create-title">Create New Route</h3>
        <div className="rt-form-row">
          <label htmlFor="routeNameInput" className="rt-label">
            Route Name :
          </label>
          <input
            type="text"
            id="routeNameInput"
            className="rt-input"
            value={newRouteName}
            onChange={(e) => {
              setNewRouteName(e.target.value);
            }}
            placeholder="Enter route name"
            disabled={isSubmitting || isLoading}
          />
        </div>
        <button
          type="button"
          className="rt-add-button"
          onClick={handleAddRoute}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Adding..." : "Add Route"}
        </button>
      </div>
    </div>
  );
};

export default Routess;
