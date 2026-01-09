import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PurchaseAdd.css";
import { API_BASE_URL } from "../../../config";

// Import the hook and table component
import { useProductItems } from "../../Common/useProductItems";
import ProductItemsTable from "../../Common/ProductItemsTable";

// Import Shared Components
import {
  MessageModal,
  LookupIcon,
  LookupModal,
} from "../../Common/SharedComponents";

function PurchaseAdd() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Call the hook to manage product items
  const {
    items: purchaseItems,
    handleItemChange,
    handleAddItemRow,
    handleRemoveItem,
    summary,
    renderModals,
    openProductModal,
    openUOMModal,
    openWarehouseModal,
    openTaxModal,
  } = useProductItems([], { priceField: "purchasePrice" });

  const initialFormDataState = {
    purchaseOrderNo: "",
    vendorCode: "",
    vendorName: "",
    poDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    vendorRefNumber: "",
    shipToAddress: "",
    purchaseRemarks: "",
    uploadedFiles: [],
  };
  const [formData, setFormData] = useState(initialFormDataState);

  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [allVendors, setAllVendors] = useState([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/Vendor`);
        if (!response.ok) throw new Error("Failed to fetch vendors");
        const data = await response.json();
        setAllVendors(
          data.filter ? data.filter((v) => v.isActive !== false) : data
        );
      } catch (error) {
        showAppModal(`Error loading Vendors: ${error.message}`, "error");
      }
    };
    fetchVendors();
  }, []);

  const openVendorModal = () => {
    setVendorSearchTerm("");
    setIsVendorModalOpen(true);
  };

  const showAppModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });

  const closeAppModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess)
      navigate("/purchaseorder", { state: { refreshPurchaseOrders: true } });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSelectVendor = (vendor) => {
    const address = [
      vendor.address1,
      vendor.address2,
      vendor.street,
      vendor.city,
      vendor.state,
      vendor.country,
    ]
      .filter(Boolean)
      .join(", ");
    setFormData((prev) => ({
      ...prev,
      vendorCode: vendor.code,
      vendorName: vendor.name,
      shipToAddress: address,
    }));
    setIsVendorModalOpen(false);
    setFormErrors((prev) => ({ ...prev, vendorCode: null, vendorName: null }));
  };

  const handleFileInputChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setFormData((prev) => {
        const existingFileNames = prev.uploadedFiles.map((f) => f.name);
        const uniqueNewFiles = newFiles.filter(
          (file) => !existingFileNames.includes(file.name)
        );
        return {
          ...prev,
          uploadedFiles: [...prev.uploadedFiles, ...uniqueNewFiles],
        };
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (fileName) =>
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.name !== fileName),
    }));
  const handleBrowseClick = () => fileInputRef.current.click();

  const validateForm = () => {
    const errors = {};
    if (!formData.vendorCode.trim() || !formData.vendorName.trim()) {
      errors.vendorCode = "Vendor is required.";
      errors.vendorName = "Vendor Name is required.";
    }
    if (!formData.poDate) {
      errors.poDate = "P.O. Date is required.";
    }
    if (!formData.deliveryDate) {
      errors.deliveryDate = "Delivery Date is required.";
    } else if (new Date(formData.deliveryDate) < new Date(formData.poDate)) {
      errors.deliveryDate = "Delivery Date cannot be before P.O. Date.";
    }
    if (purchaseItems.length === 0) {
      errors.items = "At least one item must be added.";
    } else {
      purchaseItems.forEach((item) => {
        if (!item.productCode.trim())
          errors[`item_${item.id}_product`] = "Product is required.";
        if (!item.quantity || parseFloat(item.quantity) <= 0)
          errors[`item_${item.id}_quantity`] = "Quantity must be > 0.";
        if (
          item.price === "" ||
          isNaN(parseFloat(item.price)) ||
          parseFloat(item.price) < 0
        )
          errors[`item_${item.id}_price`] = "Price must be a valid number.";
        if (!item.uom || !item.uom.trim())
          errors[`item_${item.id}_uom`] = "UOM is required.";
        if (!item.warehouseLocation || !item.warehouseLocation.trim())
          errors[`item_${item.id}_warehouseLocation`] =
            "Warehouse is required.";
      });
    }
    setFormErrors(errors);
    return errors;
  };

  // --- THIS FUNCTION IS FULLY REWRITTEN ---
  const handleSave = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const formattedErrorMessage =
        "Please fix the following issues:\n\n" +
        Object.values(validationErrors).join("\n");
      showAppModal(formattedErrorMessage, "error");
      return;
    }

    setIsSubmitting(true);

    // 1. Map the 'purchaseItems' to the required 'PostingPurchaseOrderDetails' structure.
    //    This includes renaming keys and formatting numbers to strings as required by the API.
    const postingDetails = purchaseItems.map((item, index) => ({
      slNo: index + 1,
      productCode: item.productCode,
      productName: item.productName,
      qty: (parseFloat(item.quantity) || 0).toFixed(1), // Format to string with 1 decimal
      uomCode: item.uom,
      price: (parseFloat(item.price) || 0).toFixed(2), // Format to string with 2 decimals
      locationCode: item.warehouseLocation,
      taxCode: item.taxCode,
      totalTax: (parseFloat(item.taxPrice) || 0).toFixed(2), // Format to string with 2 decimals
      netTotal: (parseFloat(item.total) || 0).toFixed(2), // Format to string with 2 decimals
    }));

    // 2. Construct the final JSON payload object matching the target structure.
    const jsonPayload = {
      poNumber: "", // Generated by the server
      vendorCode: formData.vendorCode,
      vendorName: formData.vendorName,
      poDate: formData.poDate.replace(/-/g, ""), // Format YYYY-MM-DD to YYYYMMDD
      address: formData.shipToAddress,
      remark: formData.purchaseRemarks,
      netTotal: (summary.netTotal || 0).toFixed(2), // Format to string with 2 decimals
      PostingPurchaseOrderDetails: postingDetails,

      // Pass other form fields if your backend needs them (e.g., for multipart form)
      deliveryDate: formData.deliveryDate,
      vendorRefNumber: formData.vendorRefNumber,
    };

    // 3. Create a FormData object to send both the JSON and files.
    const finalPayload = new FormData();

    // Append the JSON payload as a string. The backend will deserialize this.
    finalPayload.append("Payload", JSON.stringify(jsonPayload));

    // Append each uploaded file.
    formData.uploadedFiles.forEach((file) => {
      finalPayload.append("UploadedFiles", file, file.name);
    });

    // 4. Post the FormData to the server.
    try {
      const response = await fetch(`${API_BASE_URL}/PurchaseOrders`, {
        method: "POST",
        body: finalPayload, // Send the FormData object
        // NOTE: DO NOT set the 'Content-Type' header. The browser does it automatically for FormData.
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(
          responseData.message || "Failed to create purchase order."
        );
      }
      showAppModal(responseData.message, "success");
    } catch (error) {
      console.error("Error saving purchase order:", error);
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <MessageModal
        message={modalState.message}
        onClose={closeAppModal}
        type={modalState.type}
      />

      {renderModals()}

      <LookupModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        title="Select Vendor"
        searchTerm={vendorSearchTerm}
        onSearchChange={(e) => setVendorSearchTerm(e.target.value)}
      >
        <div className="product-lookup-table-container">
          <table className="product-lookup-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {allVendors
                .filter(
                  (v) =>
                    v.name
                      .toLowerCase()
                      .includes(vendorSearchTerm.toLowerCase()) ||
                    v.code
                      .toLowerCase()
                      .includes(vendorSearchTerm.toLowerCase())
                )
                .map((vendor) => (
                  <tr
                    key={vendor.id}
                    onClick={() => handleSelectVendor(vendor)}
                  >
                    <td>{vendor.code}</td>
                    <td>{vendor.name}</td>
                    <td>
                      {[vendor.address1, vendor.city]
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </LookupModal>

      <div className="detail-page-container">
        {/* <div className="detail-page-header-bar">
          <h1 className="detail-page-main-title">Create Purchase Order</h1>
        </div> */}

        <div className="purchase-order-add__form-header">
          <div className="entry-header-column">
            <div className="entry-header-field">
              <label htmlFor="vendorCode">Vendor Code:</label>
              <div className="input-icon-wrapper">
                <input
                  type="text"
                  id="vendorCode"
                  value={formData.vendorCode}
                  className={`form-input-styled ${
                    formErrors.vendorCode ? "input-error" : ""
                  }`}
                  readOnly
                  onClick={openVendorModal}
                />
                <button
                  type="button"
                  className="header-lookup-indicator internal"
                  onClick={openVendorModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="entry-header-field">
              <label htmlFor="vendorName">Vendor Name:</label>
              <div className="input-icon-wrapper">
                <input
                  type="text"
                  id="vendorName"
                  value={formData.vendorName}
                  className={`form-input-styled ${
                    formErrors.vendorName ? "input-error" : ""
                  }`}
                  readOnly
                  onClick={openVendorModal}
                />
                <button
                  type="button"
                  className="header-lookup-indicator internal"
                  onClick={openVendorModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="entry-header-field">
              <label htmlFor="vendorRefNumber">Vendor Ref No:</label>
              <input
                type="text"
                id="vendorRefNumber"
                name="vendorRefNumber"
                value={formData.vendorRefNumber}
                onChange={handleInputChange}
                className="form-input-styled"
              />
            </div>
            <div className="entry-header-field">
              <label htmlFor="shipToAddress">Ship to Address:</label>
              <textarea
                id="shipToAddress"
                name="shipToAddress"
                value={formData.shipToAddress}
                onChange={handleInputChange}
                className="form-textarea-styled"
                rows="2"
                readOnly
              />
            </div>
            <div className="entry-header-field">
              <label htmlFor="purchaseRemarks">Remarks:</label>
              <textarea
                id="purchaseRemarks"
                name="purchaseRemarks"
                value={formData.purchaseRemarks}
                onChange={handleInputChange}
                className="form-textarea-styled"
                rows="2"
              />
            </div>
          </div>
          <div className="entry-header-column">
            <div className="entry-header-field">
              <label htmlFor="purchaseOrderNo">P.O Number:</label>
              <input
                type="text"
                id="purchaseOrderNo"
                value={formData.purchaseOrderNo || "Generated on save"}
                className="form-input-styled"
                readOnly
                disabled
              />
            </div>
            <div className="entry-header-field">
              <label htmlFor="poDate">P.O Date:</label>
              <input
                type="date"
                id="poDate"
                name="poDate"
                value={formData.poDate}
                onChange={handleInputChange}
                className={`form-input-styled ${
                  formErrors.poDate ? "input-error" : ""
                }`}
              />
            </div>
            <div className="entry-header-field">
              <label htmlFor="deliveryDate">Delivery Date:</label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                className={`form-input-styled ${
                  formErrors.deliveryDate ? "input-error" : ""
                }`}
              />
            </div>
            <div className="entry-header-field file-input-container">
              <label htmlFor="uploadFilesInput">Attachment(s):</label>
              <input
                type="file"
                id="uploadFilesInput"
                ref={fileInputRef}
                className="form-input-file-hidden"
                onChange={handleFileInputChange}
                multiple
              />
              <button
                type="button"
                className="browse-files-btn"
                onClick={handleBrowseClick}
              >
                Browse files
              </button>
              {formData.uploadedFiles.length > 0 && (
                <div className="file-names-display-area">
                  {formData.uploadedFiles.map((f, i) => (
                    <div key={f.name + i} className="file-name-entry">
                      <span className="file-name-display" title={f.name}>
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(f.name)}
                        className="remove-file-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detail-form-content-area">
          <ProductItemsTable
            items={purchaseItems}
            summary={summary}
            onItemChange={handleItemChange}
            onAddItem={handleAddItemRow}
            onRemoveItem={handleRemoveItem}
            onOpenProductModal={openProductModal}
            onOpenUOMModal={openUOMModal}
            onOpenWarehouseModal={openWarehouseModal}
            onOpenTaxModal={openTaxModal}
            formErrors={formErrors}
            LookupIcon={LookupIcon}
          />
        </div>

        <div className="detail-page-footer">
          <div className="footer-actions-main">
            <button
              className="footer-btn primary"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Add Purchase Order"}
            </button>
          </div>
          <button
            className="footer-btn secondary"
            onClick={() => navigate("/purchaseorder")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
export default PurchaseAdd;
