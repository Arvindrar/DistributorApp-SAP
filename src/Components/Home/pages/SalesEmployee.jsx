// src/pages/Sales/SalesEmployee/SalesEmployee.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./SalesEmployee.css";
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

const API_BASE_URL = "https://localhost:7074/api";

// --- Components (can be shared or local) ---
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className="se-action-icon"
    viewBox="0 0 16 16"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive || !message) return null;
  return (
    <div className="se-modal-overlay">
      <div className={`se-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="se-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ message, onConfirm, onCancel, isConfirming }) => {
  if (!message) return null;
  return (
    <div className="se-modal-overlay se-confirmation-modal-overlay">
      <div className="se-modal-content se-confirmation-modal-content">
        <p>{message}</p>
        <div className="se-confirmation-modal-actions">
          <button
            onClick={onConfirm}
            className="se-confirmation-button se-confirm"
            disabled={isConfirming}
          >
            {isConfirming ? "Deleting..." : "Yes, Delete"}
          </button>
          <button
            onClick={onCancel}
            className="se-confirmation-button se-cancel"
            disabled={isConfirming}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SalesEmployee = () => {
  const navigate = useNavigate();
  const initialFormState = {
    code: "",
    name: "",
    jobTitle: "",
    position: "",
    department: "",
    contactNumber: "",
    email: "",
    address: "",
    remarks: "",
  };

  const [salesEmployees, setSalesEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const pagination = useDynamicPagination(salesEmployees, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const showModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeModal = () =>
    setModalState({ message: "", type: "info", isActive: false });

  const fetchSalesEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/SalesEmployee`);
      if (!response.ok)
        throw new Error(`Error fetching data: ${response.statusText}`);
      const data = await response.json();
      setSalesEmployees(data);
    } catch (e) {
      showModal(e.message || "Failed to load sales employees.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesEmployees();
  }, [fetchSalesEmployees]);

  const validateForm = (dataToValidate) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|in|[a-z]{2,})$/i;
    if (!dataToValidate.code.trim()) errors.code = "Employee Code is required.";
    if (!dataToValidate.name.trim()) errors.name = "Employee Name is required.";
    if (!dataToValidate.contactNumber.trim())
      errors.contactNumber = "Contact Number is required.";
    else if (!/^\d{10}$/.test(dataToValidate.contactNumber))
      errors.contactNumber = "Contact Number must be exactly 10 digits.";
    if (dataToValidate.email.trim() && !emailRegex.test(dataToValidate.email))
      errors.email = "The email format is invalid.";
    setFormErrors(errors);
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "contactNumber" && value && !/^\d*$/.test(value)) return;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleEditClick = (employeeId) => {
    navigate(`/salesemployee/update/${employeeId}`);
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(newEmployee);
    if (Object.keys(validationErrors).length > 0) {
      const errorMessages = Object.values(validationErrors).filter(Boolean);
      showModal(
        `Please correct the following fields:\n• ${errorMessages.join("\n• ")}`,
        "error"
      );
      return;
    }
    setIsSubmitting(true);
    closeModal();
    const employeeData = {
      ...newEmployee,
      contactNumber: `+91${newEmployee.contactNumber.trim()}`,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/SalesEmployee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exist"))
          throw new Error(
            "Sales Employee Already Exists! (Code or Name must be unique)."
          );
        throw new Error(
          errorText || `Request failed with status ${response.status}`
        );
      }
      showModal("Sales Employee added successfully!", "success");
      setNewEmployee(initialFormState);
      setFormErrors({});
      fetchSalesEmployees();
    } catch (e) {
      showModal(e.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDeleteEmployee = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/SalesEmployee/${employeeToDelete.id}`,
        { method: "DELETE" }
      );
      if (!response.ok)
        throw new Error(
          (await response.text()) || `Failed to delete employee.`
        );
      showModal(
        `Employee '${employeeToDelete.name}' deleted successfully!`,
        "success"
      );
      fetchSalesEmployees();
    } catch (e) {
      showModal(e.message, "error");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="se-page-content">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      <ConfirmationModal
        message={
          employeeToDelete
            ? `Are you sure you want to delete "${employeeToDelete.name}"?`
            : ""
        }
        onConfirm={handleDeleteEmployee}
        onCancel={() => setShowDeleteConfirm(false)}
        isConfirming={isSubmitting}
      />

      <h1 className="se-main-title">Sales Employee Management</h1>

      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="se-th-serial">S.No</th>
              <th className="se-th-code">Employee Code</th>
              <th className="se-th-name">Name</th>
              <th className="se-th-department">Department</th>
              <th className="se-th-contact">Contact Number</th>
              <th className="se-th-remarks">Remarks</th>
              <th className="se-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="se-loading-cell">
                  Loading...
                </td>
              </tr>
            ) : (
              currentPageData.map((emp, index) => (
                <tr key={emp.id}>
                  <td className="se-td-serial">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td className="se-td-code">
                    <span
                      onClick={() => handleEditClick(emp.id)}
                      className="se-code-link"
                    >
                      {emp.code}
                    </span>
                  </td>
                  <td>{emp.name}</td>
                  <td>{emp.department}</td>
                  <td>{emp.contactNumber}</td>
                  <td className="se-td-remarks">{emp.remarks}</td>
                  <td className="se-td-actions">
                    <button
                      onClick={() => promptDeleteEmployee(emp)}
                      title={`Delete ${emp.name}`}
                      className="se-action-button"
                      disabled={isSubmitting}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
            {!isLoading && salesEmployees.length === 0 && (
              <tr>
                <td colSpan="7" className="no-data-cell">
                  No sales employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />

      <div className="se-create-section">
        <h3 className="se-create-title">Add New Sales Employee</h3>

        {/* --- THIS IS THE FORM JSX THAT WAS MISSING --- */}
        <div className="se-form-container">
          <div className="se-form-column">
            <div className="se-form-row">
              <label htmlFor="code" className="se-label">
                Employee Code<span className="se-required">*</span>
              </label>
              <input
                type="text"
                id="code"
                name="code"
                className={`se-input ${
                  formErrors.code ? "se-input-error" : ""
                }`}
                value={newEmployee.code}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="se-form-row">
              <label htmlFor="name" className="se-label">
                Name<span className="se-required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={`se-input ${
                  formErrors.name ? "se-input-error" : ""
                }`}
                value={newEmployee.name}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="se-form-row">
              <label htmlFor="jobTitle" className="se-label">
                Job Title
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                className="se-input"
                value={newEmployee.jobTitle}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="se-form-row">
              <label htmlFor="position" className="se-label">
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                className="se-input"
                value={newEmployee.position}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="se-form-column">
            <div className="se-form-row">
              <label htmlFor="department" className="se-label">
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                className="se-input"
                value={newEmployee.department}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="se-form-row">
              <label htmlFor="contactNumber" className="se-label">
                Contact Number<span className="se-required">*</span>
              </label>
              <div className="se-contact-wrapper">
                <span className="se-contact-prefix">+91</span>
                <input
                  type="text"
                  id="contactNumber"
                  name="contactNumber"
                  maxLength="10"
                  className={`se-input se-contact-input ${
                    formErrors.contactNumber ? "se-input-error" : ""
                  }`}
                  value={newEmployee.contactNumber}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="se-form-row">
              <label htmlFor="email" className="se-label">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`se-input ${
                  formErrors.email ? "se-input-error" : ""
                }`}
                value={newEmployee.email}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        <div className="se-full-width-fields">
          <div className="se-form-row">
            <label htmlFor="address" className="se-label">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              className="se-textarea"
              rows="3"
              value={newEmployee.address}
              onChange={handleInputChange}
              disabled={isSubmitting}
            ></textarea>
          </div>
          <div className="se-form-row">
            <label htmlFor="remarks" className="se-label">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              className="se-textarea"
              rows="3"
              value={newEmployee.remarks}
              onChange={handleInputChange}
              disabled={isSubmitting}
            ></textarea>
          </div>
        </div>

        <div className="se-button-container">
          <button
            type="button"
            className="se-submit-button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? "Adding..." : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SalesEmployee;
