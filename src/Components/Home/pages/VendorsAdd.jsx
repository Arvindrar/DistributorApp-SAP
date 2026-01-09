// src/components/Vendors/VendorsAdd.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./VendorsAdd.css"; // Import the CSS file

const API_BASE_URL = "https://localhost:7074/api"; // Assuming API base URL is the same

const MessageModal = ({ message, onClose, type = "success" }) => {
  if (!message) return null;
  return (
    <div className="va-modal-overlay">
      <div className={`va-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="va-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

function VendorsAdd() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  // State for dropdown options
  const [vendorGroupOptions, setVendorGroupOptions] = useState([]);
  const [isLoadingVendorGroups, setIsLoadingVendorGroups] = useState(true);
  // Vendor Category states removed
  const [shippingTypeOptions, setShippingTypeOptions] = useState([]);
  const [isLoadingShippingTypes, setIsLoadingShippingTypes] = useState(true);

  const initialFormData = {
    code: "",
    name: "",
    group: "", // Represents Vendor Group
    balance: "",
    // 'category' field removed
    remarks: "",
    contactNumber: "",
    mailId: "",
    shippingType: "",
    address1: "",
    address2: "",
    street: "",
    postBox: "",
    city: "",
    state: "",
    country: "",
    gstin: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  const showModal = (message, type = "info") => {
    setModalState({ message, type, isActive: true });
  };

  const closeModal = () => {
    const wasSuccess =
      modalState.type === "success" &&
      modalState.message.includes("Successfully");
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess) {
      navigate("/vendor", { state: { refreshVendors: true } });
    }
  };

  const fetchOptions = useCallback(
    async (endpoint, setOptions, setLoading, resourceName) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
          throw new Error(
            `HTTP error fetching ${resourceName}! status: ${response.status}`
          );
        }
        const data = await response.json();
        setOptions(
          data.map((item) => ({ value: item.name, label: item.name }))
        );
      } catch (e) {
        console.error(`Failed to fetch ${resourceName}:`, e);
        showModal(
          `Failed to load ${resourceName}. Some dropdowns might not work.`,
          "error"
        );
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOptions(
      "VendorGroup",
      setVendorGroupOptions,
      setIsLoadingVendorGroups,
      "vendor groups"
    );
    // Removed fetchOptions for VendorCategory
    fetchOptions(
      "ShippingType",
      setShippingTypeOptions,
      setIsLoadingShippingTypes,
      "shipping types"
    );
  }, [fetchOptions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "postBox") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 6) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
    } else if (name === "contactNumber") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (error) setError(null);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    // Validations
    if (!formData.code.trim()) {
      setError("Vendor Code is required.");
      showModal("Vendor Code is required.", "error");
      setIsSubmitting(false);
      return;
    }
    if (!formData.name.trim()) {
      setError("Vendor Name is required.");
      showModal("Vendor Name is required.", "error");
      setIsSubmitting(false);
      return;
    }
    if (!formData.group) {
      setError("Please select a Vendor Group.");
      showModal("Please select a Vendor Group.", "error");
      setIsSubmitting(false);
      return;
    }
    if (!formData.mailId.trim()) {
      setError("Email Address (Mail ID) is required.");
      showModal("Email Address (Mail ID) is required.", "error");
      setIsSubmitting(false);
      return;
    }
    if (formData.mailId.trim() && !/\S+@\S+\.\S+/.test(formData.mailId)) {
      setError("Please enter a valid Email Address.");
      showModal("Please enter a valid Email Address.", "error");
      setIsSubmitting(false);
      return;
    }
    if (!formData.shippingType) {
      setError("Please select a Shipping Type.");
      showModal("Please select a Shipping Type.", "error");
      setIsSubmitting(false);
      return;
    }
    if (
      formData.postBox.trim() !== "" &&
      !/^\d{6}$/.test(formData.postBox.trim())
    ) {
      setError("Post Box must be exactly 6 digits if provided.");
      showModal("Post Box must be exactly 6 digits if provided.", "error");
      setIsSubmitting(false);
      return;
    }
    if (
      formData.contactNumber.trim() !== "" &&
      !/^\d{10}$/.test(formData.contactNumber.trim())
    ) {
      setError("Contact Number must be exactly 10 digits if provided.");
      showModal(
        "Contact Number must be exactly 10 digits if provided.",
        "error"
      );
      setIsSubmitting(false);
      return;
    }

    const vendorDataToSave = {
      ...formData, // 'category' is no longer in formData
      balance: parseFloat(formData.balance) || 0,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/Vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorDataToSave),
      });

      if (!response.ok) {
        let displayErrorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData) {
            if (errorData.errors) {
              const fieldErrors = errorData.errors;
              const fieldNames = Object.keys(fieldErrors);
              if (fieldNames.length > 0) {
                displayErrorMessage = fieldNames
                  .map(
                    (field) =>
                      `${field}: ${
                        Array.isArray(fieldErrors[field])
                          ? fieldErrors[field].join(", ")
                          : fieldErrors[field]
                      }`
                  )
                  .join("; ");
              } else if (errorData.title) {
                displayErrorMessage = errorData.title;
              }
            } else if (errorData.title) {
              displayErrorMessage = errorData.title;
            } else if (errorData.detail) {
              displayErrorMessage = errorData.detail;
            } else if (
              errorData.message &&
              typeof errorData.message === "string"
            ) {
              displayErrorMessage = errorData.message;
            } else if (
              typeof errorData === "string" &&
              errorData.trim() !== ""
            ) {
              displayErrorMessage = errorData;
            } else if (
              typeof errorData === "object" &&
              Object.keys(errorData).length > 0
            ) {
              const firstErrorKey = Object.keys(errorData)[0];
              if (firstErrorKey && errorData[firstErrorKey]) {
                const messages = errorData[firstErrorKey];
                displayErrorMessage = `${firstErrorKey}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`;
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse API error response as JSON:", e);
        }
        showModal(displayErrorMessage, "error");
        throw new Error(displayErrorMessage);
      }

      showModal("Vendor Added Successfully!", "success");
      setFormData(initialFormData);
    } catch (e) {
      if (!modalState.isActive) {
        showModal(
          e.message || "Failed to save vendor. Please try again.",
          "error"
        );
      }
      console.error("Failed to save vendor (outer catch):", e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      navigate("/vendor");
    }
  };

  const stillLoadingDropdowns =
    isLoadingVendorGroups ||
    // isLoadingVendorCategories removed
    isLoadingShippingTypes;

  if (
    stillLoadingDropdowns &&
    !vendorGroupOptions.length &&
    // vendorCategoryOptions removed
    !shippingTypeOptions.length
  ) {
    return (
      <div className="va-detail-page-container">
        Loading selection options...
      </div>
    );
  }

  return (
    <div className="va-detail-page-container">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
      />

      {/* <div className="va-detail-page-header-bar">
        <h1 className="va-detail-page-main-title">New Vendor</h1>
      </div> */}

      {error && !modalState.isActive && (
        <div
          className="va-form-error-message"
          style={{ color: "red", marginBottom: "15px", textAlign: "center" }}
        >
          {error}
        </div>
      )}

      <div className="va-vendor-info-header">
        {/* Column 1 */}
        <div className="va-vendor-info-column">
          <div className="va-vendor-info-field">
            <label htmlFor="code">Vendor Code :</label>
            <input
              type="text"
              id="code"
              name="code"
              className="va-form-input-styled"
              value={formData.code}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="va-vendor-info-field">
            <label htmlFor="name">Name :</label>
            <input
              type="text"
              id="name"
              name="name"
              className="va-form-input-styled"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="va-vendor-info-field">
            <label htmlFor="group">Vendor Group :</label>
            <select
              id="group"
              name="group"
              className="va-form-input-styled va-form-select-styled"
              value={formData.group}
              onChange={handleInputChange}
              disabled={isLoadingVendorGroups}
              required
            >
              <option value="">
                {isLoadingVendorGroups && !vendorGroupOptions.length
                  ? "Loading..."
                  : "Select group"}
              </option>
              {vendorGroupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="va-vendor-info-field">
            <label htmlFor="contactNumber">Contact Number :</label>
            <div className="va-compound-input-contact">
              <span className="va-input-prefix-contact">+91</span>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                className="va-form-input-styled va-form-input-contact-suffix"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="10 digits"
              />
            </div>
          </div>
          <div className="va-vendor-info-field">
            <label htmlFor="mailId">Mail ID :</label>
            <input
              type="email"
              id="mailId"
              name="mailId"
              className="va-form-input-styled"
              value={formData.mailId}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="va-vendor-info-field">
            <label htmlFor="shippingType">Shipping Type :</label>
            <select
              id="shippingType"
              name="shippingType"
              className="va-form-input-styled va-form-select-styled"
              value={formData.shippingType}
              onChange={handleInputChange}
              disabled={isLoadingShippingTypes}
              required
            >
              <option value="">
                {isLoadingShippingTypes && !shippingTypeOptions.length
                  ? "Loading..."
                  : "Select Shipping Type"}
              </option>
              {shippingTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Column 2 */}
        <div className="va-vendor-info-column">
          {/* Vendor Category dropdown removed */}
          <div className="va-vendor-info-field">
            <label htmlFor="balance">Account Balance :</label>
            <input
              type="number"
              id="balance"
              name="balance"
              step="0.01"
              className="va-form-input-styled"
              value={formData.balance}
              onChange={handleInputChange}
            />
          </div>
          <div className="va-vendor-info-field">
            <label htmlFor="remarks">Remarks :</label>
            <textarea
              id="remarks"
              name="remarks"
              className="va-form-textarea-styled"
              rows={4}
              value={formData.remarks}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      <div className="va-detail-form-content-area">
        <section className="va-form-section-card">
          <h3 className="va-form-section-title">Vendor Address Information</h3>
          <div className="va-form-field-group va-form-field-group-inline">
            <label htmlFor="address1">Address 1 :</label>
            <input
              type="text"
              id="address1"
              name="address1"
              className="va-form-input-styled"
              value={formData.address1 || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="va-form-field-group va-form-field-group-inline">
            <label htmlFor="address2">Address 2 :</label>
            <input
              type="text"
              id="address2"
              name="address2"
              className="va-form-input-styled"
              value={formData.address2 || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="va-form-field-group va-form-field-group-inline">
            <label htmlFor="street">Street :</label>
            <input
              type="text"
              id="street"
              name="street"
              className="va-form-input-styled"
              value={formData.street || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="va-form-field-group va-form-field-group-inline">
            <label htmlFor="postBox">Post Box :</label>
            <input
              type="text"
              inputMode="numeric"
              id="postBox"
              name="postBox"
              className="va-form-input-styled"
              value={formData.postBox}
              onChange={handleInputChange}
            />
          </div>
          <div className="va-form-field-group va-form-field-group-inline">
            <label htmlFor="city">City :</label>
            <input
              type="text"
              id="city"
              name="city"
              className="va-form-input-styled"
              value={formData.city || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="va-form-field-group va-form-field-group-inline">
            <label htmlFor="state">State :</label>
            <input
              type="text"
              id="state"
              name="state"
              className="va-form-input-styled"
              value={formData.state || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="va-form-field-group va-form-field-group-inline">
            <label htmlFor="country">Country :</label>
            <input
              type="text"
              id="country"
              name="country"
              className="va-form-input-styled"
              value={formData.country || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="va-form-field-group va-form-field-group-inline">
            <label htmlFor="gstin">GSTIN :</label>
            <input
              type="text"
              id="gstin"
              name="gstin"
              className="va-form-input-styled"
              value={formData.gstin || ""}
              onChange={handleInputChange}
            />
          </div>
        </section>
      </div>

      <div className="va-detail-page-footer">
        <div className="va-footer-actions-main">
          <button
            className="va-footer-btn primary"
            onClick={handleSave}
            disabled={isSubmitting || stillLoadingDropdowns}
          >
            {isSubmitting ? "Adding..." : "Add Vendor"}
          </button>
        </div>
        <button
          className="va-footer-btn secondary"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default VendorsAdd;
