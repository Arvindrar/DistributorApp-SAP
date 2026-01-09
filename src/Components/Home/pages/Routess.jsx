import React, { useState, useEffect, useCallback } from "react";
import "../../../styles/List.css";

import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination"; // Please double-check this path

const API_BASE_URL = "https://localhost:7074/api";

// Modal Component - UPDATED with generic class names
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

  const pagination = useDynamicPagination(routes, { fixedItemsPerPage: 4 });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const showModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeModal = () =>
    setModalState({ message: "", type: "info", isActive: false });

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Route`);
      if (!response.ok) {
        throw new Error(`Error fetching routes: ${response.status}`);
      }
      const data = await response.json();
      setRoutes(data.value || []);
    } catch (e) {
      console.error("Failed to fetch routes:", e);
      showModal(e.message || "Failed to load routes.", "error");
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

    const routeData = { name: newRouteName.trim() };
    try {
      const response = await fetch(`${API_BASE_URL}/Route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `Request failed with status ${response.status}`
        );
      }
      showModal("Route added successfully!", "success");
      setNewRouteName("");
      await fetchRoutes();
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to add route:", e);
      showModal(e.message || "Failed to add route.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      {/* <h1 className="page-title">Route Management</h1> */}

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: "100px" }}>
                Serial No.
              </th>
              <th>Route Name</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="2" className="loading-cell">
                  Loading routes...
                </td>
              </tr>
            )}
            {!isLoading &&
              currentPageData.map((route, index) => (
                <tr key={route.id || index}>
                  <td className="text-center">
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

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />

      <div className="form-section">
        <h3 className="form-section-title">Create New Route</h3>
        <div className="form-row">
          <label htmlFor="routeNameInput" className="form-label">
            Route Name:
          </label>
          <input
            type="text"
            id="routeNameInput"
            className="form-input"
            style={{ width: "400px", flexGrow: 0 }}
            value={newRouteName}
            onChange={(e) => setNewRouteName(e.target.value)}
            placeholder="Enter route name"
            disabled={isSubmitting || isLoading}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddRoute}
          disabled={isSubmitting || isLoading}
          style={{ alignSelf: "flex-start" }}
        >
          {isSubmitting ? "Adding..." : "Add Route"}
        </button>
      </div>
    </div>
  );
};

export default Routess;
