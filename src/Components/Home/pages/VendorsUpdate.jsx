// src/components/Vendors/VendorsUpdate.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./VendorsUpdate.css"; // CSS for this component

const API_BASE_URL = "https://localhost:7074/api";

// --- MODAL COMPONENTS (with vu- prefix) ---
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
    <div className="vu-modal-overlay">
      <div className="vu-modal-content vu-confirmation-modal">
        {title && <h4 className="vu-modal-title">{title}</h4>}
        <p className="vu-modal-message">{message}</p>
        <div className="vu-modal-actions">
          <button
            onClick={onClose}
            className="vu-modal-button vu-modal-button-cancel"
            disabled={isConfirming}
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className="vu-modal-button vu-modal-button-confirm vu-modal-button-danger"
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
    <div className="vu-modal-overlay">
      <div className={`vu-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="vu-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};
// --- END MODAL COMPONENTS ---

function VendorsUpdate() {
  const navigate = useNavigate();
  const { vendorId } = useParams();

  const initialFormState = {
    code: "",
    name: "",
    group: "", // Vendor Group
    balance: "",
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
  const [pageError, setPageError] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");

  const [vendorGroupOptions, setVendorGroupOptions] = useState([]);
  const [isLoadingVendorGroups, setIsLoadingVendorGroups] = useState(true);

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
            ? `${prevError}\nFailed to load ${resourceName}. Some dropdowns might not work.`
            : `Failed to load ${resourceName}. Some dropdowns might not work.`
        );
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchVendorData = useCallback(async (id) => {
    setIsLoadingData(true);
    setPageError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/Vendor/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Vendor not found.");
        throw new Error(
          `HTTP error fetching vendor data! status: ${response.status}`
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
      console.error("Failed to fetch vendor data:", e);
      setPageError(e.message || "Failed to load vendor data.");
      setFormData(initialFormState);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions(
      "VendorGroup",
      setVendorGroupOptions,
      setIsLoadingVendorGroups,
      "vendor groups"
    );
    fetchOptions(
      "ShippingType",
      setShippingTypeOptions,
      setIsLoadingShippingTypes,
      "shipping types"
    );

    if (vendorId) {
      fetchVendorData(vendorId);
    } else {
      setPageError("No Vendor ID provided for update.");
      setIsLoadingData(false);
      setFormData(initialFormState);
    }
  }, [vendorId, fetchOptions, fetchVendorData]);

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
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    setInfoMessage("");

    if (!formData.code.trim()) {
      setInfoMessage("Vendor Code is required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.name.trim()) {
      setInfoMessage("Vendor Name is required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.group) {
      setInfoMessage("Please select a Vendor Group.");
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

    const vendorDataToUpdate = {
      id: parseInt(vendorId),
      ...formData,
      balance: parseFloat(formData.balance) || 0,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/Vendor/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorDataToUpdate),
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
          /* no json body */
        }
        throw new Error(apiErrorText);
      }
      setInfoMessage("Vendor Updated Successfully!");
    } catch (e) {
      console.error("Failed to update vendor:", e);
      setInfoMessage(e.message || "Failed to update vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveClick = () => {
    setInfoMessage("");
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    setIsRemoving(true);
    setInfoMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/Vendor/${vendorId}`, {
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
          /* Ignore */
        }
        throw new Error(errorMessage);
      }
      setInfoMessage("Vendor Removed Successfully!");
    } catch (e) {
      console.error("Failed to remove vendor:", e);
      setInfoMessage(e.message || "Failed to remove vendor.");
    } finally {
      setIsRemoving(false);
      setShowDeleteConfirmModal(false);
    }
  };

  const handleCancel = () => navigate("/vendor");

  const closeModalAndNavigate = () => {
    const wasSuccess = infoMessage.includes("Successfully");
    setInfoMessage("");
    if (wasSuccess) {
      navigate("/vendor", { state: { refreshVendors: true } });
    }
  };

  const anyDropdownLoading = isLoadingVendorGroups || isLoadingShippingTypes;

  if (isLoadingData || (anyDropdownLoading && !formData.name && vendorId)) {
    let loadingMessages = [];
    if (isLoadingData && vendorId) loadingMessages.push("vendor details");
    if (isLoadingVendorGroups && !vendorGroupOptions.length)
      loadingMessages.push("vendor groups");
    if (isLoadingShippingTypes && !shippingTypeOptions.length)
      loadingMessages.push("shipping types");

    if (loadingMessages.length > 0) {
      return (
        <div className="vu-detail-page-container">
          Loading {loadingMessages.join(", ")}...
        </div>
      );
    }
  }

  if (pageError && !formData.name && vendorId) {
    // Show error if critical data (like name for an existing ID) isn't loaded
    return (
      <div
        className="vu-detail-page-container vu-page-level-error-display"
        style={{ padding: "20px" }}
      >
        Error: {pageError}{" "}
        <button
          onClick={() => navigate("/vendor")}
          style={{ marginLeft: "10px" }}
        >
          Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="vu-detail-page-container">
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
        message={`Are you sure you want to remove vendor "${
          formData.name || "this vendor"
        }" (Code: ${formData.code || "N/A"})? This action cannot be undone.`}
        confirmButtonText="Yes, Remove"
        isConfirming={isRemoving}
      />

      <div className="vu-detail-page-header-bar">
        <h1 className="vu-detail-page-main-title">Update Vendor</h1>
        {pageError &&
          formData.name && ( // Show non-critical errors here if form is somewhat populated
            <div className="vu-page-level-error-display">{pageError}</div>
          )}
      </div>

      <div className="vu-vendor-info-header">
        {/* Column 1 */}
        <div className="vu-vendor-info-column">
          <div className="vu-vendor-info-field">
            <label htmlFor="code">Vendor Code :</label>
            <input
              type="text"
              id="code"
              name="code"
              className="vu-form-input-styled"
              value={formData.code}
              onChange={handleInputChange}
              required
              readOnly
            />
          </div>
          <div className="vu-vendor-info-field">
            <label htmlFor="name">Name :</label>
            <input
              type="text"
              id="name"
              name="name"
              className="vu-form-input-styled"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="vu-vendor-info-field">
            <label htmlFor="group">Vendor Group :</label>
            <select
              id="group"
              name="group"
              className="vu-form-input-styled vu-form-select-styled"
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
          <div className="vu-vendor-info-field">
            <label htmlFor="contactNumber">Contact Number :</label>
            <div className="vu-compound-input-contact">
              <span className="vu-input-prefix-contact">+91</span>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                className="vu-form-input-styled vu-form-input-contact-suffix"
                value={formData.contactNumber || ""}
                onChange={handleInputChange}
                placeholder="10 digits"
              />
            </div>
          </div>
          <div className="vu-vendor-info-field">
            <label htmlFor="mailId">Mail ID :</label>
            <input
              type="email"
              id="mailId"
              name="mailId"
              className="vu-form-input-styled"
              value={formData.mailId || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="vu-vendor-info-field">
            <label htmlFor="shippingType">Shipping Type :</label>
            <select
              id="shippingType"
              name="shippingType"
              className="vu-form-input-styled vu-form-select-styled"
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
        <div className="vu-vendor-info-column">
          <div className="vu-vendor-info-field">
            <label htmlFor="balance">Account Balance :</label>
            <input
              type="number"
              id="balance"
              name="balance"
              step="0.01"
              className="vu-form-input-styled"
              value={formData.balance}
              onChange={handleInputChange}
            />
          </div>
          <div className="vu-vendor-info-field">
            <label htmlFor="remarks">Remarks :</label>
            <textarea
              id="remarks"
              name="remarks"
              className="vu-form-textarea-styled"
              value={formData.remarks || ""}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="vu-detail-form-content-area">
        <section className="vu-form-section-card">
          <h3 className="vu-form-section-title">Address Information</h3>
          <div className="vu-form-field-group vu-form-field-group-inline">
            <label htmlFor="address1">Address 1 :</label>
            <input
              type="text"
              id="address1"
              name="address1"
              className="vu-form-input-styled"
              value={formData.address1 || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="vu-form-field-group vu-form-field-group-inline">
            <label htmlFor="address2">Address 2 :</label>
            <input
              type="text"
              id="address2"
              name="address2"
              className="vu-form-input-styled"
              value={formData.address2 || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="vu-form-field-group vu-form-field-group-inline">
            <label htmlFor="street">Street :</label>
            <input
              type="text"
              id="street"
              name="street"
              className="vu-form-input-styled"
              value={formData.street || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="vu-form-field-group vu-form-field-group-inline">
            <label htmlFor="postBox">Post Box :</label>
            <input
              type="text"
              inputMode="numeric"
              id="postBox"
              name="postBox"
              className="vu-form-input-styled"
              value={formData.postBox || ""}
              onChange={handleInputChange}
              placeholder="6 digits"
            />
          </div>
          <div className="vu-form-field-group vu-form-field-group-inline">
            <label htmlFor="city">City :</label>
            <input
              type="text"
              id="city"
              name="city"
              className="vu-form-input-styled"
              value={formData.city || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="vu-form-field-group vu-form-field-group-inline">
            <label htmlFor="state">State :</label>
            <input
              type="text"
              id="state"
              name="state"
              className="vu-form-input-styled"
              value={formData.state || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="vu-form-field-group vu-form-field-group-inline">
            <label htmlFor="country">Country :</label>
            <input
              type="text"
              id="country"
              name="country"
              className="vu-form-input-styled"
              value={formData.country || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="vu-form-field-group vu-form-field-group-inline">
            <label htmlFor="gstin">GSTIN :</label>
            <input
              type="text"
              id="gstin"
              name="gstin"
              className="vu-form-input-styled"
              value={formData.gstin || ""}
              onChange={handleInputChange}
            />
          </div>
        </section>
      </div>

      <div className="vu-detail-page-footer">
        <div className="vu-footer-actions-left">
          <button
            className="vu-footer-btn primary"
            onClick={handleUpdate}
            disabled={
              isSubmitting || isLoadingData || anyDropdownLoading || isRemoving
            }
          >
            {isSubmitting ? "Updating..." : "Update Vendor"}
          </button>
          <button
            className="vu-footer-btn danger"
            onClick={handleRemoveClick}
            disabled={
              isSubmitting ||
              isLoadingData || // Disable while initial data is loading or if no ID
              !vendorId || // Disable if no vendorId (e.g. error state)
              isRemoving
            }
          >
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </div>
        <div className="vu-footer-actions-right">
          <button
            className="vu-footer-btn secondary"
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

export default VendorsUpdate;
