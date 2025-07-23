import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ARInvoiceUpdate.css"; // The component's specific CSS
import { API_BASE_URL } from "../../../config";

// --- Import the reusable hook and table component ---
import { useProductItems } from "../../Common/useProductItems";
import ProductItemsTable from "../../Common/ProductItemsTable";

// --- Reusable Components (can be moved to their own files) ---
const MessageModal = ({ message, onClose, type = "info" }) => {
  if (!message) return null;
  return (
    <div className="ar-inv-update-modal-overlay">
      <div className={`ar-inv-update-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="ar-inv-update-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

function ARInvoiceUpdate() {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const fileInputRef = useRef(null);

  // --- Use the custom hook for all item-related logic ---
  const {
    items: invoiceItems,
    setItems: setInvoiceItems, // We need the setter to populate from the fetch
    handleItemChange,
    handleAddItemRow,
    handleRemoveItem,
    summary,
    renderModals, // The hook provides all lookup modals!
    openProductModal,
    openUOMModal,
    openWarehouseModal,
    openTaxModal,
  } = useProductItems();

  // --- State for the HEADER of the form ---
  const [formData, setFormData] = useState({
    arInvoiceNo: "",
    salesOrderNo: "",
    customerCode: "",
    customerName: "",
    invoiceDate: "",
    dueDate: "",
    customerRefNumber: "",
    billToAddress: "",
    invoiceRemarks: "",
    uploadedFiles: [], // For newly added files
  });

  // State for page-level concerns
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // State for managing existing vs. new attachments
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileIdsToDelete, setFileIdsToDelete] = useState([]);

  // --- Fetch the existing A/R Invoice data on component mount ---
  useEffect(() => {
    const fetchInvoice = async () => {
      setIsLoading(true);
      setPageError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/ARInvoices/${invoiceId}`);
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Failed to load data. Server responded with ${response.status}: ${errorBody}`
          );
        }
        const data = await response.json();
        if (!data) throw new Error("Received empty data from server.");

        // Populate the header form state
        setFormData({
          arInvoiceNo: data.arInvoiceNo,
          salesOrderNo: data.salesOrderNo || "",
          customerCode: data.customerCode || "",
          customerName: data.customerName || "",
          invoiceDate: data.invoiceDate
            ? new Date(data.invoiceDate).toISOString().split("T")[0]
            : "",
          dueDate: data.dueDate
            ? new Date(data.dueDate).toISOString().split("T")[0]
            : "",
          customerRefNumber: data.customerRefNumber || "",
          billToAddress: data.billToAddress || "",
          invoiceRemarks: data.invoiceRemarks || "",
          uploadedFiles: [], // Start with no new files
        });

        // Use the setter from the hook to populate the items table
        setInvoiceItems(data.arInvoiceItems || []);

        // Set existing attachments and clear the deletion list
        setExistingAttachments(data.attachments || []);
        setFileIdsToDelete([]);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId, setInvoiceItems]); // setInvoiceItems is from the hook

  const showAppModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });

  const closeAppModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess) navigate("/arinvoice");
  };

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // --- Attachment Handling ---
  const handleFileInputChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: [
        ...prev.uploadedFiles,
        ...newFiles.filter(
          (f) => !prev.uploadedFiles.some((pf) => pf.name === f.name)
        ),
      ],
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleRemoveNewFile = (fileName) =>
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.name !== fileName),
    }));
  const handleRemoveExistingFile = (fileId) => {
    setExistingAttachments((prev) => prev.filter((f) => f.id !== fileId));
    setFileIdsToDelete((prev) => [...new Set([...prev, fileId])]);
  };

  // --- Form Validation ---
  const validateForm = () => {
    const errors = {};
    if (!formData.customerCode?.trim())
      errors.customerCode = "Customer is required.";
    if (!formData.invoiceDate) errors.invoiceDate = "Invoice Date is required.";
    if (!formData.dueDate) errors.dueDate = "Due Date is required.";
    else if (new Date(formData.dueDate) < new Date(formData.invoiceDate)) {
      errors.dueDate = "Due Date cannot be before Invoice Date.";
    }
    if (invoiceItems.length === 0) {
      errors.items = "At least one item must be added.";
    } else {
      // Logic for item validation can be shared or kept here
      invoiceItems.forEach((item) => {
        if (!item.productCode?.trim())
          errors[`item_${item.id}_product`] = "Product is required.";
        if (!item.quantity || parseFloat(item.quantity) <= 0)
          errors[`item_${item.id}_quantity`] = "Quantity must be > 0.";
      });
    }
    setFormErrors(errors);
    return errors;
  };

  // --- Handle Form Submission ---
  const handleSave = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const errorMessagesList = [];

      // Check for header errors
      if (validationErrors.customerCode) {
        errorMessagesList.push(`- Customer: ${validationErrors.customerCode}`);
      }
      if (validationErrors.invoiceDate) {
        errorMessagesList.push(
          `- Invoice Date: ${validationErrors.invoiceDate}`
        );
      }
      if (validationErrors.dueDate) {
        errorMessagesList.push(`- Due Date: ${validationErrors.dueDate}`);
      }

      // Check for a general items error
      if (validationErrors.items) {
        errorMessagesList.push(`- Items: ${validationErrors.items}`);
      }

      // Loop through invoiceItems to add specific item errors
      invoiceItems.forEach((item, index) => {
        const itemPrefix = `- Item #${index + 1}`;
        if (validationErrors[`item_${item.id}_product`]) {
          errorMessagesList.push(`${itemPrefix} (Product): is required.`);
        }
        if (validationErrors[`item_${item.id}_quantity`]) {
          errorMessagesList.push(
            `${itemPrefix} (Quantity): must be greater than 0.`
          );
        }
        if (validationErrors[`item_${item.id}_price`]) {
          errorMessagesList.push(
            `${itemPrefix} (Price): must be a valid number.`
          );
        }
        if (validationErrors[`item_${item.id}_uom`]) {
          errorMessagesList.push(`${itemPrefix} (UOM): is required.`);
        }
        if (validationErrors[`item_${item.id}_warehouseLocation`]) {
          errorMessagesList.push(`${itemPrefix} (Warehouse): is required.`);
        }
      });

      const modalErrorMessage =
        "Please correct the following errors:\n" + errorMessagesList.join("\n");

      showAppModal(modalErrorMessage, "error");
      return;
    }

    setIsSubmitting(true);
    const payload = new FormData();

    // Append all header data
    payload.append("SalesOrderNo", formData.salesOrderNo);
    payload.append("CustomerCode", formData.customerCode);
    payload.append("CustomerName", formData.customerName);
    payload.append("InvoiceDate", formData.invoiceDate);
    if (formData.dueDate) payload.append("DueDate", formData.dueDate);
    payload.append("CustomerRefNumber", formData.customerRefNumber);
    payload.append("BillToAddress", formData.billToAddress);
    payload.append("InvoiceRemarks", formData.invoiceRemarks);

    const itemsPayload = invoiceItems.map((item) => ({
      ...item, // Keep all existing properties like ProductCode, UOM, etc.
      quantity: String(item.quantity || "0"),
      price: String(item.price || "0"),
      taxPrice: String(item.taxPrice || "0"),
      total: String(item.total || "0"),
    }));

    // The hook provides the final, clean items list
    payload.append("InvoiceItemsJson", JSON.stringify(itemsPayload));

    // Append attachment info
    payload.append("FilesToDeleteJson", JSON.stringify(fileIdsToDelete));
    formData.uploadedFiles.forEach((file) =>
      payload.append("UploadedFiles", file, file.name)
    );

    try {
      const response = await fetch(`${API_BASE_URL}/ARInvoices/${invoiceId}`, {
        method: "PUT",
        body: payload,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Failed to update. Status: ${response.status}`,
        }));
        throw new Error(errorData.message);
      }
      showAppModal("A/R Invoice updated successfully!", "success");
    } catch (error) {
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="ar-inv-update__page-loading">Loading A/R Invoice...</div>
    );
  if (pageError)
    return <div className="ar-inv-update__page-error">Error: {pageError}</div>;

  return (
    <>
      <MessageModal
        message={modalState.message}
        onClose={closeAppModal}
        type={modalState.type}
      />
      {renderModals()} {/* Renders ALL lookup modals from the hook */}
      <div className="ar-inv-update__detail-page-container">
        <div className="ar-inv-update__detail-page-header-bar">
          <h1 className="ar-inv-update__detail-page-main-title">
            Update A/R Invoice: {formData.arInvoiceNo}
          </h1>
        </div>

        <div className="ar-inv-update__form-header">
          {/* Column 1 */}
          <div className="ar-inv-update__entry-header-column">
            <div className="ar-inv-update__entry-header-field">
              <label>Customer Code:</label>
              <input
                type="text"
                value={formData.customerCode}
                readOnly
                className="ar-inv-update__form-input-styled"
              />
            </div>
            <div className="ar-inv-update__entry-header-field">
              <label>Customer Name:</label>
              <input
                type="text"
                value={formData.customerName}
                readOnly
                className="ar-inv-update__form-input-styled"
              />
            </div>
            <div className="ar-inv-update__entry-header-field">
              <label>Based on S.O. #:</label>
              <input
                type="text"
                value={formData.salesOrderNo}
                readOnly
                className="ar-inv-update__form-input-styled"
              />
            </div>
            <div className="ar-inv-update__entry-header-field">
              <label>Customer Ref No:</label>
              <input
                type="text"
                name="customerRefNumber"
                value={formData.customerRefNumber}
                onChange={handleInputChange}
                className="ar-inv-update__form-input-styled"
              />
            </div>
            <div className="ar-inv-update__entry-header-field">
              <label>Bill to Address:</label>
              <textarea
                name="billToAddress"
                value={formData.billToAddress}
                readOnly
                className="ar-inv-update__form-textarea-styled"
              />
            </div>
            <div className="ar-inv-update__entry-header-field">
              <label>Remarks:</label>
              <textarea
                name="invoiceRemarks"
                value={formData.invoiceRemarks}
                onChange={handleInputChange}
                className="ar-inv-update__form-textarea-styled"
              />
            </div>
          </div>
          {/* Column 2 */}
          <div className="ar-inv-update__entry-header-column">
            <div className="ar-inv-update__entry-header-field">
              <label>Invoice Number:</label>
              <input
                type="text"
                value={formData.arInvoiceNo}
                readOnly
                className="ar-inv-update__form-input-styled"
              />
            </div>
            <div className="ar-inv-update__entry-header-field">
              <label>Invoice Date:</label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                className="ar-inv-update__form-input-styled"
              />
            </div>
            <div className="ar-inv-update__entry-header-field">
              <label>Due Date:</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="ar-inv-update__form-input-styled"
              />
            </div>
            <div className="ar-inv-update__entry-header-field ar-inv-update__file-input-container">
              <label>Attachment(s):</label>
              <div className="ar-inv-update__file-input-controls">
                <button
                  type="button"
                  className="ar-inv-update__browse-files-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  Browse new
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  style={{ display: "none" }}
                />
                <div className="ar-inv-update__file-names-display-area">
                  {existingAttachments.map((f) => (
                    <div key={f.id} className="ar-inv-update__file-name-entry">
                      <span>{f.fileName}</span>
                      <button
                        onClick={() => handleRemoveExistingFile(f.id)}
                        className="ar-inv-update__remove-file-btn"
                        title="Remove existing file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {formData.uploadedFiles.map((f, i) => (
                    <div key={i} className="ar-inv-update__file-name-entry">
                      <span>
                        <i>{f.name} (new)</i>
                      </span>
                      <button
                        onClick={() => handleRemoveNewFile(f.name)}
                        className="ar-inv-update__remove-file-btn"
                        title="Remove new file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ar-inv-update__detail-form-content-area">
          <ProductItemsTable
            items={invoiceItems}
            summary={summary}
            onItemChange={handleItemChange}
            onAddItem={handleAddItemRow}
            onRemoveItem={handleRemoveItem}
            onOpenProductModal={openProductModal}
            onOpenUOMModal={openUOMModal}
            onOpenWarehouseModal={openWarehouseModal}
            onOpenTaxModal={openTaxModal}
            formErrors={formErrors}
          />
        </div>

        <div className="ar-inv-update__detail-page-footer">
          <button
            className="ar-inv-update__footer-btn primary"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update A/R Invoice"}
          </button>
          <button
            className="ar-inv-update__footer-btn secondary"
            onClick={() => navigate("/arinvoice")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default ARInvoiceUpdate;
