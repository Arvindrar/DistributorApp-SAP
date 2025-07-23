// src/pages/Sales/SalesEmployee/SalesEmployeeUpdate.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./SalesEmployeeUpdate.css";

const API_BASE_URL = "https://localhost:7074/api";

// Modal Component
const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive || !message) return null;
  return (
    <div className="seu-modal-overlay">
      <div className={`seu-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="seu-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

const SalesEmployeeUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState({
    code: "",
    name: "",
    jobTitle: "",
    position: "",
    department: "",
    contactNumber: "",
    email: "",
    address: "",
    remarks: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  const showModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });

  const closeModal = () => {
    const currentType = modalState.type;
    setModalState({ message: "", type: "info", isActive: false });
    if (currentType === "success") navigate("/salesemployee");
  };

  const fetchEmployeeData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/SalesEmployee/${id}`);
      if (!res.ok) throw new Error("Failed to fetch employee data.");
      const data = await res.json();
      data.contactNumber = data.contactNumber.replace("+91", "");
      setEmployee(data);
      setDataLoaded(true);
    } catch (error) {
      showModal(error.message || "Could not load employee details.", "error");
    }
  }, [id]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "contactNumber" && value && !/^\d*$/.test(value)) return;

    const updated = { ...employee, [name]: value };
    setEmployee(updated);
    validateForm(updated);
  };

  const validateForm = (dataToValidate) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|in|[a-z]{2,})$/i;

    if (!dataToValidate.code.trim()) errors.code = "Employee Code is required.";
    if (!dataToValidate.name.trim()) errors.name = "Employee Name is required.";

    if (!dataToValidate.contactNumber.trim()) {
      errors.contactNumber = "Contact Number is required.";
    } else if (!/^\d{10}$/.test(dataToValidate.contactNumber)) {
      errors.contactNumber = "Contact Number must be exactly 10 digits.";
    }

    if (dataToValidate.email.trim() && !emailRegex.test(dataToValidate.email)) {
      errors.email = "The email format is invalid.";
    }

    setFormErrors(errors);
    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(employee);
    const errorList = Object.values(validationErrors).filter(Boolean);

    if (errorList.length > 0) {
      showModal(
        `Please correct the following:\n• ${errorList.join("\n• ")}`,
        "error"
      );
      return;
    }

    setIsSubmitting(true);
    const employeeData = {
      ...employee,
      contactNumber: `+91${employee.contactNumber.trim()}`,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/SalesEmployee/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        if (errorText.toLowerCase().includes("already exist")) {
          throw new Error(
            "A sales employee with this Code or Name already exists."
          );
        }
        throw new Error(
          errorText || `Request failed with status ${res.status}`
        );
      }

      showModal("Sales Employee updated successfully!", "success");
    } catch (error) {
      showModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!dataLoaded) {
    return (
      <div className="seu-loading-container">Loading Employee Data...</div>
    );
  }

  return (
    <div className="seu-page-content">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      <div className="seu-form-section">
        <h1 className="seu-main-title">Update Sales Employee</h1>
        <div className="seu-form-container">
          {/* Left column */}
          <div className="seu-form-column">
            <div className="seu-form-row">
              <label className="seu-label">
                Employee Code<span className="seu-required">*</span>
              </label>
              <input
                type="text"
                name="code"
                className={`seu-input ${
                  formErrors.code ? "seu-input-error" : ""
                }`}
                value={employee.code}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="seu-form-row">
              <label className="seu-label">
                Name<span className="seu-required">*</span>
              </label>
              <input
                type="text"
                name="name"
                className={`seu-input ${
                  formErrors.name ? "seu-input-error" : ""
                }`}
                value={employee.name}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="seu-form-row">
              <label className="seu-label">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                className="seu-input"
                value={employee.jobTitle}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="seu-form-row">
              <label className="seu-label">Position</label>
              <input
                type="text"
                name="position"
                className="seu-input"
                value={employee.position}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="seu-form-column">
            <div className="seu-form-row">
              <label className="seu-label">Department</label>
              <input
                type="text"
                name="department"
                className="seu-input"
                value={employee.department}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="seu-form-row">
              <label className="seu-label">
                Contact Number<span className="seu-required">*</span>
              </label>
              <div className="seu-contact-wrapper">
                <span className="seu-contact-prefix">+91</span>
                <input
                  type="text"
                  name="contactNumber"
                  maxLength="10"
                  className={`seu-input seu-contact-input ${
                    formErrors.contactNumber ? "seu-input-error" : ""
                  }`}
                  value={employee.contactNumber}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="seu-form-row">
              <label className="seu-label">E-mail</label>
              <input
                type="email"
                name="email"
                className={`seu-input ${
                  formErrors.email ? "seu-input-error" : ""
                }`}
                value={employee.email}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Full-width fields */}
        <div className="seu-full-width-fields">
          <div className="seu-form-row">
            <label className="seu-label">Address</label>
            <textarea
              name="address"
              rows="3"
              className="seu-textarea"
              value={employee.address}
              onChange={handleInputChange}
              disabled={isSubmitting}
            ></textarea>
          </div>
          <div className="seu-form-row">
            <label className="seu-label">Remarks</label>
            <textarea
              name="remarks"
              rows="3"
              className="seu-textarea"
              value={employee.remarks}
              onChange={handleInputChange}
              disabled={isSubmitting}
            ></textarea>
          </div>
        </div>

        {/* Buttons */}
        <div className="seu-button-container">
          <button
            className="seu-submit-button"
            onClick={handleSubmit}
            disabled={isSubmitting || !dataLoaded}
          >
            {isSubmitting ? "Updating..." : "Update Employee"}
          </button>
          <button
            className="seu-cancel-button"
            onClick={() => navigate("/salesemployee")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesEmployeeUpdate;
