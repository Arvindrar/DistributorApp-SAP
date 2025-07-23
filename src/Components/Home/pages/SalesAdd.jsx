import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SalesAdd.css";
import { API_BASE_URL } from "../../../config";

// 1. IMPORT the hook and table component as before
import { useProductItems } from "../../Common/useProductItems";
import ProductItemsTable from "../../Common/ProductItemsTable";

// 2. IMPORT your new shared components
import {
  MessageModal,
  LookupIcon,
  LookupModal,
} from "../../Common/SharedComponents";

function SalesAdd() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 3. CALL the hook WITHOUT the LookupModal argument
  const {
    items: salesItems,
    handleItemChange,
    handleAddItemRow,
    handleRemoveItem,
    summary,
    renderModals,
    openProductModal,
    openUOMModal,
    openWarehouseModal,
    openTaxModal,
  } = useProductItems([], { priceField: "retailPrice" });

  // ... The rest of your SalesAdd component remains exactly the same ...
  // ... from 'initialFormDataState' down to the closing tag ...

  const initialFormDataState = {
    salesOrderNo: "",
    customerCode: "",
    customerName: "",
    soDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    customerRefNumber: "",
    shipToAddress: "",
    salesRemarks: "",
    salesEmployee: "",
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

  const [allCustomers, setAllCustomers] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/Customer`);
        if (!response.ok) throw new Error("Failed to fetch customers");
        const data = await response.json();
        setAllCustomers(
          data.filter ? data.filter((c) => c.isActive !== false) : data
        );
      } catch (error) {
        showAppModal(`Error loading Customers: ${error.message}`, "error");
      }
    };
    fetchCustomers();
  }, []);

  const showAppModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeAppModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess)
      navigate("/salesorder", { state: { refreshSalesOrders: true } });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const openCustomerModal = () => {
    setCustomerSearchTerm("");
    setIsCustomerModalOpen(true);
  };

  const handleSelectCustomer = (customer) => {
    const address = [
      customer.address1,
      customer.address2,
      customer.street,
      customer.city,
      customer.state,
      customer.country,
    ]
      .filter(Boolean)
      .join(", ");
    setFormData((prev) => ({
      ...prev,
      customerCode: customer.code,
      customerName: customer.name,
      shipToAddress: address,
      salesEmployee: customer.employee || "",
    }));
    setIsCustomerModalOpen(false);
    setFormErrors((prev) => ({
      ...prev,
      customerCode: null,
      customerName: null,
    }));
  };

  const handleFileInputChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        uploadedFiles: [
          ...prev.uploadedFiles,
          ...newFiles.filter(
            (file) => !prev.uploadedFiles.some((ef) => ef.name === file.name)
          ),
        ],
      }));
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
    if (!formData.customerCode.trim() || !formData.customerName.trim()) {
      errors.customerCode = "Customer is required.";
      errors.customerName = "Customer Name is required.";
    }
    if (!formData.soDate) errors.soDate = "S.O. Date is required.";
    if (!formData.deliveryDate) {
      errors.deliveryDate = "Delivery Date is required.";
    } else if (new Date(formData.deliveryDate) < new Date(formData.soDate)) {
      errors.deliveryDate = "Delivery Date cannot be before S.O. Date.";
    }
    if (salesItems.length === 0) {
      errors.items = "At least one item must be added.";
    } else {
      salesItems.forEach((item) => {
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

    const postingDetails = salesItems.map((item, index) => ({
      slNo: index + 1,
      productCode: item.productCode,
      productName: item.productName,
      qty: (parseFloat(item.quantity) || 0).toFixed(1),
      uomCode: item.uom,
      price: (parseFloat(item.price) || 0).toFixed(2),
      locationCode: item.warehouseLocation,
      taxCode: item.taxCode,
      totalTax: (parseFloat(item.taxPrice) || 0).toFixed(2),
      netTotal: (parseFloat(item.total) || 0).toFixed(2),
    }));

    // Construct the JSON payload WITHOUT the extra fields.
    const jsonPayload = {
      soNumber: "",
      customerCode: formData.customerCode,
      customerName: formData.customerName,
      soDate: formData.soDate.replace(/-/g, ""),
      address: formData.shipToAddress,
      remark: formData.salesRemarks,
      netTotal: (parseFloat(summary.netTotal) || 0).toFixed(2),
      PostingSalesOrderDetails: postingDetails,
      // --- REMOVED THE FOLLOWING LINES ---
      // deliveryDate: formData.deliveryDate,
      // customerRefNumber: formData.customerRefNumber,
      // salesEmployee: formData.salesEmployee,
    };

    const finalPayload = new FormData();
    finalPayload.append("Payload", JSON.stringify(jsonPayload));

    formData.uploadedFiles.forEach((file) => {
      finalPayload.append("UploadedFiles", file, file.name);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/SalesOrders`, {
        method: "POST",
        body: finalPayload,
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(
          responseData.message || "Failed to create sales order."
        );
      }
      showAppModal(responseData.message, "success");
    } catch (error) {
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
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Select Customer"
        searchTerm={customerSearchTerm}
        onSearchChange={(e) => setCustomerSearchTerm(e.target.value)}
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
              {allCustomers
                .filter(
                  (c) =>
                    c.name
                      .toLowerCase()
                      .includes(customerSearchTerm.toLowerCase()) ||
                    c.code
                      .toLowerCase()
                      .includes(customerSearchTerm.toLowerCase())
                )
                .map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <td>{customer.code}</td>
                    <td>{customer.name}</td>
                    <td>
                      {[customer.address1, customer.city]
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
        <div className="detail-page-header-bar">
          <h1 className="detail-page-main-title">Create Sales Order</h1>
        </div>

        <div className="sales-order-add__form-header">
          <div className="entry-header-column">
            <div className="entry-header-field">
              <label htmlFor="customerCode">Customer Code:</label>
              <div className="input-icon-wrapper">
                <input
                  type="text"
                  id="customerCode"
                  value={formData.customerCode}
                  className={`form-input-styled ${
                    formErrors.customerCode ? "input-error" : ""
                  }`}
                  readOnly
                  onClick={openCustomerModal}
                />
                <button
                  type="button"
                  className="header-lookup-indicator internal"
                  onClick={openCustomerModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="entry-header-field">
              <label htmlFor="customerName">Customer Name:</label>
              <div className="input-icon-wrapper">
                <input
                  type="text"
                  id="customerName"
                  value={formData.customerName}
                  className={`form-input-styled ${
                    formErrors.customerName ? "input-error" : ""
                  }`}
                  readOnly
                  onClick={openCustomerModal}
                />
                <button
                  type="button"
                  className="header-lookup-indicator internal"
                  onClick={openCustomerModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="entry-header-field">
              <label htmlFor="customerRefNumber">Customer Ref No:</label>
              <input
                type="text"
                id="customerRefNumber"
                name="customerRefNumber"
                value={formData.customerRefNumber}
                onChange={handleInputChange}
                className="form-input-styled"
              />
            </div>
            <div className="entry-header-field">
              <label htmlFor="shipToAddress">Bill to Address:</label>
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
              <label htmlFor="salesRemarks">Remarks:</label>
              <textarea
                id="salesRemarks"
                name="salesRemarks"
                value={formData.salesRemarks}
                onChange={handleInputChange}
                className="form-textarea-styled"
                rows="2"
              />
            </div>
          </div>
          <div className="entry-header-column">
            <div className="entry-header-field">
              <label htmlFor="salesOrderNo">S.O Number:</label>
              <input
                type="text"
                id="salesOrderNo"
                value={formData.salesOrderNo || "Generated on save"}
                className="form-input-styled"
                readOnly
                disabled
              />
            </div>
            <div className="entry-header-field">
              <label htmlFor="soDate">S.O Date:</label>
              <input
                type="date"
                id="soDate"
                name="soDate"
                value={formData.soDate}
                onChange={handleInputChange}
                className={`form-input-styled ${
                  formErrors.soDate ? "input-error" : ""
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
            <div className="entry-header-field">
              <label htmlFor="salesEmployee">Sales Employee:</label>
              <input
                type="text"
                id="salesEmployee"
                name="salesEmployee"
                value={formData.salesEmployee}
                className="form-input-styled"
                readOnly
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
            items={salesItems}
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
              {isSubmitting ? "Saving..." : "Add Sales Order"}
            </button>
          </div>
          <button
            className="footer-btn secondary"
            onClick={() => navigate("/salesorder")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default SalesAdd;
