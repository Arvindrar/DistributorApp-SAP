import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./UpdateCustomers.css"; // Ensure this CSS file exists

const API_BASE_URL = "https://localhost:7074/api";

// --- MODAL COMPONENTS ---
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  isConfirming,
}) => {
  if (!isOpen) return null;
  return (
    <div className="ac-modal-overlay">
      <div className="ac-modal-content ac-confirmation-modal">
        {title && <h4 className="ac-modal-title">{title}</h4>}
        <p className="ac-modal-message">{message}</p>
        <div className="ac-modal-actions">
          <button
            onClick={onClose}
            className="ac-modal-button ac-modal-button-cancel"
            disabled={isConfirming}
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className="ac-modal-button ac-modal-button-confirm ac-modal-button-danger"
            disabled={isConfirming}
          >
            {isConfirming ? "Processing..." : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

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
// --- END MODAL COMPONENTS ---

function UpdateCustomers() {
  const navigate = useNavigate();
  const { customerId } = useParams();

  const initialFormState = {
    code: "",
    name: "",
    group: "",
    balance: "",
    route: "",
    employee: "",
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

  const [formData, setFormData] = useState(initialFormState);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pageError, setPageError] = useState(null); // For general page load errors
  const [infoMessage, setInfoMessage] = useState(""); // For modal messages (success/validation/API errors)

  const [customerGroupOptions, setCustomerGroupOptions] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  const [routeOptions, setRouteOptions] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);

  const [salesEmployeeOptions, setSalesEmployeeOptions] = useState([]);
  const [isLoadingSalesEmployees, setIsLoadingSalesEmployees] = useState(true);

  const [shippingTypeOptions, setShippingTypeOptions] = useState([]);
  const [isLoadingShippingTypes, setIsLoadingShippingTypes] = useState(true);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

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
        setPageError((prevError) =>
          prevError
            ? `${prevError}\nFailed to load ${resourceName}.`
            : `Failed to load ${resourceName}.`
        );
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchCustomerData = useCallback(async (id) => {
    setIsLoadingData(true);
    setPageError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/Customer/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Customer not found.");
        throw new Error(
          `HTTP error fetching customer data! status: ${response.status}`
        );
      }
      const data = await response.json();
      setFormData({
        code: data.code || "",
        name: data.name || "",
        group: data.group || "",
        balance:
          data.balance !== null && data.balance !== undefined
            ? String(data.balance)
            : "",
        route: data.route || "",
        employee: data.employee || "",
        remarks: data.remarks || "",
        contactNumber: data.contactNumber || "",
        mailId: data.mailId || "",
        shippingType: data.shippingType || "",
        address1: data.address1 || "",
        address2: data.address2 || "",
        street: data.street || "",
        postBox: data.postBox || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        gstin: data.gstin || "",
      });
    } catch (e) {
      console.error("Failed to fetch customer data:", e);
      setPageError(e.message || "Failed to load customer data.");
      setFormData(initialFormState);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions(
      "CustomerGroup",
      setCustomerGroupOptions,
      setIsLoadingGroups,
      "customer groups"
    );
    fetchOptions("Routes", setRouteOptions, setIsLoadingRoutes, "routes");
    fetchOptions(
      "SalesEmployee",
      setSalesEmployeeOptions,
      setIsLoadingSalesEmployees,
      "sales employees"
    );
    fetchOptions(
      "ShippingType",
      setShippingTypeOptions,
      setIsLoadingShippingTypes,
      "shipping types"
    );

    if (customerId) {
      fetchCustomerData(customerId);
    } else {
      setPageError("No Customer ID provided for update.");
      setIsLoadingData(false);
      setFormData(initialFormState);
    }
  }, [customerId, fetchOptions, fetchCustomerData]);

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

    if (infoMessage) setInfoMessage("");
    // if (pageError) setPageError(null); // Keep page load errors unless explicitly cleared
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    setInfoMessage("");
    // setPageError(null); // Clear general errors before new action

    // --- CLIENT-SIDE VALIDATION ---
    if (!formData.code.trim()) {
      // Code is readOnly, but good to keep consistent checks
      setInfoMessage("Customer Code is required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.name.trim()) {
      setInfoMessage("Customer Name is required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.group) {
      setInfoMessage("Please select a Customer Group.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.mailId.trim()) {
      setInfoMessage("Email Address (Mail ID) is required.");
      setIsSubmitting(false);
      return;
    }
    if (formData.mailId.trim() && !/\S+@\S+\.\S+/.test(formData.mailId)) {
      setInfoMessage("Please enter a valid Email Address.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.shippingType) {
      setInfoMessage("Please select a Shipping Type.");
      setIsSubmitting(false);
      return;
    }
    if (
      formData.postBox.trim() !== "" &&
      !/^\d{6}$/.test(formData.postBox.trim())
    ) {
      setInfoMessage("Post Box must be exactly 6 digits if provided.");
      setIsSubmitting(false);
      return;
    }
    if (
      formData.contactNumber.trim() !== "" &&
      !/^\d{10}$/.test(formData.contactNumber.trim())
    ) {
      setInfoMessage("Contact Number must be exactly 10 digits if provided.");
      setIsSubmitting(false);
      return;
    }
    // --- END VALIDATION ---

    const customerDataToUpdate = {
      id: parseInt(customerId), // Ensure ID is part of the payload if your API expects it in the body
      ...formData,
      balance: parseFloat(formData.balance) || 0,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/Customer/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerDataToUpdate),
      });

      if (!response.ok) {
        let apiErrorText = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.errors) {
            apiErrorText = Object.entries(errorData.errors)
              .map(
                ([field, messages]) =>
                  `${field}: ${
                    Array.isArray(messages) ? messages.join(", ") : messages
                  }`
              )
              .join("; ");
          } else if (errorData.title) {
            apiErrorText = errorData.title;
          } else if (errorData.detail) {
            apiErrorText = errorData.detail;
          } else if (typeof errorData === "string" && errorData.trim() !== "") {
            apiErrorText = errorData;
          } else if (
            typeof errorData === "object" &&
            Object.keys(errorData).length > 0
          ) {
            // Fallback for other object structures like ASP.NET Core validation problems
            const firstErrorKey = Object.keys(errorData)[0];
            if (
              firstErrorKey &&
              errorData[firstErrorKey] &&
              Array.isArray(errorData[firstErrorKey])
            ) {
              apiErrorText = `${firstErrorKey}: ${errorData[firstErrorKey].join(
                ", "
              )}`;
            }
          }
        } catch {
          /* no json body or other parsing error */
        }
        throw new Error(apiErrorText);
      }
      setInfoMessage("Customer Updated Successfully!");
      // Optionally re-fetch data to reflect server state if there are server-side transformations
      // fetchCustomerData(customerId);
    } catch (e) {
      console.error("Failed to update customer:", e);
      setInfoMessage(e.message || "Failed to update customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveClick = () => {
    // setPageError(null);
    setInfoMessage("");
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    setIsRemoving(true);
    // setPageError(null);
    setInfoMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/Customer/${customerId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.title ||
            errorData.detail ||
            errorData.message ||
            (errorData.errors ? JSON.stringify(errorData.errors) : null) ||
            errorMessage;
        } catch (e) {
          /* Ignore if error body parsing fails */
        }
        throw new Error(errorMessage);
      }
      setInfoMessage("Customer Removed Successfully!"); // This will trigger navigation via closeModalAndNavigate
    } catch (e) {
      console.error("Failed to remove customer:", e);
      setInfoMessage(e.message || "Failed to remove customer.");
    } finally {
      setIsRemoving(false);
      setShowDeleteConfirmModal(false);
    }
  };

  const handleCancel = () => navigate("/customers");

  const closeModalAndNavigate = () => {
    const wasSuccess = infoMessage.includes("Successfully");
    setInfoMessage("");
    if (wasSuccess) {
      navigate("/customers", { state: { refreshCustomers: true } });
    }
  };

  const anyDropdownLoading =
    isLoadingGroups ||
    isLoadingRoutes ||
    isLoadingSalesEmployees ||
    isLoadingShippingTypes;

  // Combined loading state for initial page render
  if (isLoadingData || (anyDropdownLoading && !formData.name)) {
    // Show loading if data is fetching OR if dropdowns are fetching and no data yet
    let loadingMessages = [];
    if (isLoadingData && customerId) loadingMessages.push("customer details");
    if (isLoadingGroups && !customerGroupOptions.length)
      loadingMessages.push("groups");
    if (isLoadingRoutes && !routeOptions.length) loadingMessages.push("routes");
    if (isLoadingSalesEmployees && !salesEmployeeOptions.length)
      loadingMessages.push("employees");
    if (isLoadingShippingTypes && !shippingTypeOptions.length)
      loadingMessages.push("shipping types");

    if (loadingMessages.length > 0) {
      return (
        <div className="detail-page-container">
          Loading {loadingMessages.join(", ")}...
        </div>
      );
    }
  }

  // Handle case where customer data failed to load or no ID
  if (pageError && !formData.name) {
    return (
      <div className="detail-page-container error-message">
        Error: {pageError}{" "}
        <button onClick={() => navigate("/customers")}>
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="detail-page-container">
      <MessageModal
        message={infoMessage}
        onClose={closeModalAndNavigate}
        type={infoMessage.includes("Successfully") ? "success" : "error"}
      />
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to remove customer "${
          formData.name || "this customer"
        }" (Code: ${formData.code || "N/A"})? This action cannot be undone.`}
        confirmButtonText="Yes, Remove"
        isConfirming={isRemoving}
      />

      <div className="detail-page-header-bar">
        <h1 className="detail-page-main-title">Update Customer</h1>
        {pageError && (
          <div className="page-level-error-display">{pageError}</div>
        )}
      </div>

      <div className="customer-info-header">
        {/* Column 1 */}
        <div className="customer-info-column">
          <div className="customer-info-field">
            <label htmlFor="code">Customer Code :</label>
            <input
              type="text"
              id="code"
              name="code"
              className="form-input-styled"
              value={formData.code}
              onChange={handleInputChange}
              required
              readOnly // Customer code usually not updatable
            />
          </div>
          <div className="customer-info-field">
            <label htmlFor="name">Name :</label>
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
            <label htmlFor="group">Customer group :</label>
            <select
              id="group"
              name="group"
              className="form-input-styled"
              value={formData.group}
              onChange={handleInputChange}
              disabled={isLoadingGroups}
              required
            >
              <option value="">
                {isLoadingGroups && !customerGroupOptions.length
                  ? "Loading..."
                  : "Select group"}
              </option>
              {customerGroupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="customer-info-field">
            <label htmlFor="contactNumber">Contact Number :</label>
            <div className="compound-input-contact">
              <span className="input-prefix-contact">+91</span>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                className="form-input-styled form-input-contact-suffix"
                value={formData.contactNumber || ""}
                onChange={handleInputChange}
                placeholder="10 digits"
              />
            </div>
          </div>
          <div className="customer-info-field">
            <label htmlFor="mailId">Mail ID :</label>
            <input
              type="email"
              id="mailId"
              name="mailId"
              className="form-input-styled"
              value={formData.mailId || ""}
              onChange={handleInputChange}
              required // Added required
            />
          </div>
          <div className="customer-info-field">
            <label htmlFor="shippingType">Shipping Type :</label>
            <select
              id="shippingType"
              name="shippingType"
              className="form-input-styled"
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
        <div className="customer-info-column">
          <div className="customer-info-field">
            <label htmlFor="route">Route :</label>
            <select
              id="route"
              name="route"
              className="form-input-styled"
              value={formData.route}
              onChange={handleInputChange}
              disabled={isLoadingRoutes}
            >
              <option value="">
                {isLoadingRoutes && !routeOptions.length
                  ? "Loading..."
                  : "Select route"}
              </option>
              {routeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="customer-info-field">
            <label htmlFor="employee">Sales Employee :</label>
            <select
              id="employee"
              name="employee"
              className="form-input-styled"
              value={formData.employee}
              onChange={handleInputChange}
              disabled={isLoadingSalesEmployees}
            >
              <option value="">
                {isLoadingSalesEmployees && !salesEmployeeOptions.length
                  ? "Loading..."
                  : "Select employee"}
              </option>
              {salesEmployeeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="customer-info-field">
            <label htmlFor="balance">Account Balance :</label>
            <input
              type="number"
              id="balance"
              name="balance"
              step="0.01"
              className="form-input-styled"
              value={formData.balance}
              onChange={handleInputChange}
            />
          </div>
          <div className="customer-info-field">
            <label htmlFor="remarks">Remarks :</label>
            <textarea
              id="remarks"
              name="remarks"
              className="form-textarea-styled"
              value={formData.remarks || ""}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="detail-form-content-area">
        <section className="form-section-card">
          <h3 className="form-section-title">Address Information</h3>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="address1">Address 1 :</label>
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
            <label htmlFor="address2">Address 2 :</label>
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
            <label htmlFor="street">Street :</label>
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
            <label htmlFor="postBox">Post Box :</label>
            <input
              type="text" // Kept as text for JS control
              inputMode="numeric" // Suggests numeric keyboard
              id="postBox"
              name="postBox"
              className="form-input-styled"
              value={formData.postBox || ""}
              onChange={handleInputChange}
              placeholder="6 digits"
            />
          </div>
          <div className="form-field-group form-field-group-inline">
            <label htmlFor="city">City :</label>
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
            <label htmlFor="state">State :</label>
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
            <label htmlFor="country">Country :</label>
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
            <label htmlFor="gstin">GSTIN :</label>
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
        <div className="footer-actions-left">
          <button
            className="footer-btn primary"
            onClick={handleUpdate}
            disabled={
              isSubmitting ||
              isLoadingData || // Disable while initial data is loading
              anyDropdownLoading || // Disable if dropdowns are still loading
              isRemoving
            }
          >
            {isSubmitting ? "Updating..." : "Update Customer"}
          </button>
          <button
            className="footer-btn danger"
            onClick={handleRemoveClick}
            disabled={
              isSubmitting ||
              isLoadingData || // Disable while initial data is loading
              isRemoving
            }
          >
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </div>
        <div className="footer-actions-right">
          <button
            className="footer-btn secondary"
            onClick={handleCancel}
            disabled={isSubmitting || isRemoving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateCustomers;
