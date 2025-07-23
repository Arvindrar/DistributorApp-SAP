import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AddCustomers.css";

const API_BASE_URL = "https://localhost:7074/api";

const MessageModal = ({ message, onClose, type = "success" }) => {
  if (!message) return null;
  return (
    <div className="ac-modal-overlay">
      <div className={`ac-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="ac-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

function AddCustomers() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  // In a real app, these would be fetched from SAP (e.g., /BusinessPartnerGroups, /SalesPersons, /ShippingTypes)
  const [customerGroupOptions, setCustomerGroupOptions] = useState([
    { value: 102, label: "High-Tech Customers" },
  ]); // Example
  const [routeOptions, setRouteOptions] = useState([]);
  const [salesEmployeeOptions, setSalesEmployeeOptions] = useState([
    { value: 1, label: "Harish" },
  ]); // Example
  const [shippingTypeOptions, setShippingTypeOptions] = useState([
    { value: 2, label: "Courier" },
  ]); // Example
  const [paymentTermOptions, setPaymentTermOptions] = useState([
    { value: 3, label: "Cash On Delivery" },
  ]); // Example

  const initialFormData = {
    code: "",
    name: "",
    group: "", // This will now hold the integer GroupCode
    balance: "",
    route: "",
    employee: "", // This will hold the integer SalesPersonCode
    remarks: "",
    contactNumber: "",
    mailId: "",
    shippingType: "", // This will hold the integer ShippingTypeCode
    paymentTerm: "", // This will hold the integer PayTermsGrpCode
    address1: "",
    address2: "", // You can combine these into one "Street" field for SAP
    street: "",
    postBox: "",
    city: "",
    state: "",
    country: "IN", // Default to India, using 2-letter ISO code
    gstin: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  const showModal = (message, type = "info") => {
    setModalState({ message, type, isActive: true });
  };

  const closeModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess) {
      navigate("/customers"); // Go back to the customer list
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    // Your validation logic is good, let's adapt it slightly
    if (!formData.code.trim()) {
      return showModal("Customer Code is required.", "error");
    }
    if (!formData.name.trim()) {
      return showModal("Customer Name is required.", "error");
    }
    if (!formData.group) {
      return showModal("Please select a Customer Group.", "error");
    }
    if (!formData.mailId.trim() || !/\S+@\S+\.\S+/.test(formData.mailId)) {
      return showModal("Please enter a valid Email Address.", "error");
    }
    if (!formData.shippingType) {
      return showModal("Please select a Shipping Type.", "error");
    }
    if (!formData.paymentTerm) {
      return showModal("Please select a Payment Term.", "error");
    }

    // --- Build the payload for SAP Service Layer ---
    const sapPayload = {
      CardCode: formData.code,
      CardName: formData.name,
      CardType: "cCustomer", // REQUIRED to create a customer
      GroupCode: parseInt(formData.group, 10), // Send as integer
      SalesPersonCode: formData.employee ? parseInt(formData.employee, 10) : -1, // Send as integer or -1
      PayTermsGrpCode: parseInt(formData.paymentTerm, 10), // Send as integer
      ShippingType: parseInt(formData.shippingType, 10), // Send as integer
      Notes: formData.remarks,
      EmailAddress: formData.mailId,
      Phone1: formData.contactNumber,
      BPAddresses: [
        {
          AddressName: "Bill To Address", // A descriptive name
          Street: `${formData.address1 || ""} ${
            formData.address2 || ""
          }`.trim(),
          Block: formData.street,
          City: formData.city,
          State: formData.state,
          ZipCode: formData.postBox,
          Country: formData.country, // Use 2-letter ISO code, e.g., "IN"
          AddressType: "bo_BillTo",
        },
        {
          AddressName: "Ship To Address",
          Street: `${formData.address1 || ""} ${
            formData.address2 || ""
          }`.trim(),
          Block: formData.street,
          City: formData.city,
          State: formData.state,
          ZipCode: formData.postBox,
          Country: formData.country,
          AddressType: "bo_ShipTo",
        },
      ],
      // Map User-Defined Fields (UDFs) here. The UDF name MUST match SAP exactly.
      // For example, if your Route UDF is named "U_Route", you would use:
      // U_Route: formData.route
    };

    try {
      const response = await fetch(`${API_BASE_URL}/Customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sapPayload),
      });

      if (!response.ok) {
        let displayErrorMessage = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          displayErrorMessage = errorData.message || JSON.stringify(errorData);
        } catch {}
        throw new Error(displayErrorMessage);
      }

      showModal("Customer Added Successfully to SAP!", "success");
      setFormData(initialFormData);
    } catch (e) {
      showModal(
        e.message || "Failed to save customer. Please try again.",
        "error"
      );
      console.error("Failed to save customer to SAP:", e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) navigate("/customers");
  };

  return (
    <div className="detail-page-container">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
      />

      <div className="detail-page-header-bar">
        <h1 className="detail-page-main-title">New Customer</h1>
      </div>

      <div className="customer-info-header">
        {/* Column 1 */}
        <div className="customer-info-column">
          <div className="customer-info-field">
            <label htmlFor="code">Customer Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              className="form-input-styled"
              value={formData.code}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="customer-info-field">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input-styled"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="customer-info-field">
            <label htmlFor="group">Customer group *</label>
            <select
              id="group"
              name="group"
              className="form-input-styled"
              value={formData.group}
              onChange={handleInputChange}
              required
            >
              <option value="">Select group</option>
              {customerGroupOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="customer-info-field">
            <label htmlFor="mailId">Mail ID *</label>
            <input
              type="email"
              id="mailId"
              name="mailId"
              className="form-input-styled"
              value={formData.mailId}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="customer-info-field">
            <label htmlFor="contactNumber">Contact Number</label>
            <div className="compound-input-contact">
              <span className="input-prefix-contact">+91</span>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                className="form-input-styled form-input-contact-suffix"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="10 digits"
              />
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="customer-info-column">
          <div className="customer-info-field">
            <label htmlFor="shippingType">Shipping Type *</label>
            <select
              id="shippingType"
              name="shippingType"
              className="form-input-styled"
              value={formData.shippingType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Shipping Type</option>
              {shippingTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="customer-info-field">
            <label htmlFor="paymentTerm">Payment Term *</label>
            <select
              id="paymentTerm"
              name="paymentTerm"
              className="form-input-styled"
              value={formData.paymentTerm}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Payment Term</option>
              {paymentTermOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="customer-info-field">
            <label htmlFor="route">Route</label>
            <select
              id="route"
              name="route"
              className="form-input-styled"
              value={formData.route}
              onChange={handleInputChange}
            >
              <option value="">Select route</option>
              {routeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="customer-info-field">
            <label htmlFor="employee">Sales Employee</label>
            <select
              id="employee"
              name="employee"
              className="form-input-styled"
              value={formData.employee}
              onChange={handleInputChange}
            >
              <option value="">Select employee</option>
              {salesEmployeeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="customer-info-field">
            <label htmlFor="remarks">Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              className="form-textarea-styled"
              rows={4}
              value={formData.remarks}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      <div className="detail-form-content-area">
        <section className="form-section-card">
          <h3 className="form-section-title">Customer Address Information</h3>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="address1">Address 1</label>
            <input
              type="text"
              id="address1"
              name="address1"
              className="form-input-styled"
              value={formData.address1 || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="address2">Address 2</label>
            <input
              type="text"
              id="address2"
              name="address2"
              className="form-input-styled"
              value={formData.address2 || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="street">Street / Block</label>
            <input
              type="text"
              id="street"
              name="street"
              className="form-input-styled"
              value={formData.street || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              className="form-input-styled"
              value={formData.city || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="postBox">Post Box</label>
            <input
              type="text"
              inputMode="numeric"
              id="postBox"
              name="postBox"
              className="form-input-styled"
              value={formData.postBox}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              className="form-input-styled"
              value={formData.state || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              className="form-input-styled"
              value={formData.country || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="gstin">GSTIN</label>
            <input
              type="text"
              id="gstin"
              name="gstin"
              className="form-input-styled"
              value={formData.gstin || ""}
              onChange={handleInputChange}
            />
          </div>
        </section>
      </div>

      <div className="detail-page-footer">
        <button
          className="footer-btn primary"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding to SAP..." : "Add Customer"}
        </button>
        <button
          className="footer-btn secondary"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AddCustomers;
