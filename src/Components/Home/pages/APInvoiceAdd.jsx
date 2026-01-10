// src/components/pages/APInvoiceAdd.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./APInvoiceAdd.css"; // The new CSS file we will create
import { API_BASE_URL } from "../../../config";

import { useProductItems } from "../../Common/useProductItems";
import ProductItemsTable from "../../Common/ProductItemsTable";

// --- Reusable Components ---
const MessageModal = ({ message, onClose, type = "info", isActive }) => {
  if (!isActive) return null;
  return (
    <div className="ap-inv-add-modal-overlay">
      <div className={`ap-inv-add-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="ap-inv-add-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};
const LookupIcon = () => (
  <span className="lookup-indicator-icon" title="Lookup value">
    ○
  </span>
);

const cleanNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? "0" : String(num);
};

function APInvoiceAdd() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const {
    items: invoiceItems,
    setItems: setInvoiceItems,
    handleItemChange,
    handleAddItemRow,
    handleRemoveItem,
    summary,
    renderModals,
    openProductModal,
    openUOMModal,
    openWarehouseModal,
    openTaxModal,
  } = useProductItems();

  const initialFormDataState = {
    apInvoiceNo: "",
    vendorCode: "",
    vendorName: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    vendorRefNumber: "",
    billToAddress: "",
    purchaseOrderNo: "", // For 'copy from'
    invoiceRemarks: "",
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

  // --- State for Vendor and Purchase Order Lookups ---
  const [allVendors, setAllVendors] = useState([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState("");
  const [vendorPurchaseOrders, setVendorPurchaseOrders] = useState([]);

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

  const openPOModal = async () => {
    if (!formData.vendorCode) {
      showAppModal("Please select a vendor first.", "info");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/PurchaseOrders`);
      if (!response.ok) throw new Error("Could not fetch Purchase Orders.");
      const allPoData = await response.json();
      const vendorPOs = allPoData.filter(
        (po) =>
          po.vendorCode?.trim().toLowerCase() ===
          formData.vendorCode.trim().toLowerCase()
      );
      if (vendorPOs.length === 0) {
        showAppModal(
          `No Purchase Orders found for vendor: ${formData.vendorName}`,
          "info"
        );
      } else {
        setVendorPurchaseOrders(vendorPOs);
        setPoSearchTerm("");
        setIsPOModalOpen(true);
      }
    } catch (error) {
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAppModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeAppModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess)
      navigate("/apinvoice", { state: { refreshInvoices: true } });
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
    ]
      .filter(Boolean)
      .join(", ");
    setFormData({
      ...initialFormDataState,
      invoiceDate: new Date().toISOString().split("T")[0],
      vendorCode: vendor.code,
      vendorName: vendor.name,
      billToAddress: address,
    });
    setInvoiceItems([]);
    setIsVendorModalOpen(false);
    setFormErrors({});
  };

  const handleSelectPO = async (po) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/PurchaseOrders/${po.id}`);
      if (!response.ok)
        throw new Error(`Failed to fetch details for PO #${po.poNumber}`);
      const fullPoDetails = await response.json();
      setFormData((prev) => ({
        ...prev,
        purchaseOrderNo: fullPoDetails.poNumber,
        vendorRefNumber: fullPoDetails.vendorRefNumber || "",
        invoiceRemarks: fullPoDetails.remark || "",
      }));
      const newInvoiceItems = (
        fullPoDetails.postingPurchaseOrderDetails || []
      ).map((poItem, index) => ({
        id: Date.now() + index,
        productCode: poItem.productCode,
        productName: poItem.productName,
        quantity: poItem.qty,
        uom: poItem.uomCode,
        price: poItem.price,
        warehouseLocation: poItem.locationCode,
        taxCode: poItem.taxCode || "",
        taxPrice: poItem.totalTax || 0,
        total: poItem.netTotal || 0,
      }));
      setInvoiceItems(newInvoiceItems);
      setIsPOModalOpen(false);
    } catch (error) {
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileInputChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: [
        ...prev.uploadedFiles,
        ...newFiles.filter(
          (f1) => !prev.uploadedFiles.some((f2) => f2.name === f1.name)
        ),
      ],
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (fileName) =>
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.name !== fileName),
    }));
  const handleBrowseClick = () => fileInputRef.current.click();

  const validateForm = () => {
    /* ... (Your validation logic remains the same, just checking for vendorCode) ... */ return {};
  };

  const handleSave = async () => {
    // ... (Your validation logic from ARInvoiceAdd would go here, checking formData.vendorCode) ...
    setIsSubmitting(true);
    const payload = new FormData();
    payload.append("VendorCode", formData.vendorCode);
    payload.append("VendorName", formData.vendorName);
    payload.append("InvoiceDate", formData.invoiceDate);
    payload.append("DueDate", formData.dueDate);
    payload.append("VendorRefNumber", formData.vendorRefNumber);
    payload.append("BillToAddress", formData.billToAddress);
    payload.append("PurchaseOrderNo", formData.purchaseOrderNo);
    payload.append("InvoiceRemarks", formData.invoiceRemarks);
    const itemsPayload = invoiceItems.map((item) => ({ ...item })); // Map items to backend model
    payload.append("InvoiceItemsJson", JSON.stringify(itemsPayload));
    formData.uploadedFiles.forEach((file) =>
      payload.append("UploadedFiles", file, file.name)
    );
    try {
      const response = await fetch(`${API_BASE_URL}/APInvoices`, {
        method: "POST",
        body: payload,
      });
      const responseData = await response.json();
      if (!response.ok)
        throw new Error(
          responseData.message || "Failed to create A/P Invoice."
        );
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
        isActive={modalState.isActive}
      />
      {renderModals()}
      {isVendorModalOpen && (
        <div className="lookup-modal-overlay">
          <div className="lookup-modal-content">
            <div className="lookup-modal-header">
              <h2>Select Vendor</h2>
              <button
                className="lookup-modal-close-btn"
                onClick={() => setIsVendorModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="lookup-modal-body">
              <input
                type="text"
                placeholder="Search by Code or Name..."
                className="lookup-modal-search-input"
                value={vendorSearchTerm}
                onChange={(e) => setVendorSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="lookup-modal-table-container">
                <table className="lookup-modal-table">
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
            </div>
          </div>
        </div>
      )}
      {isPOModalOpen && (
        <div className="lookup-modal-overlay">
          <div className="lookup-modal-content">
            <div className="lookup-modal-header">
              <h2>Select Purchase Order</h2>
              <button
                className="lookup-modal-close-btn"
                onClick={() => setIsPOModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="lookup-modal-body">
              <input
                type="text"
                placeholder="Search by P.O. Number..."
                className="lookup-modal-search-input"
                value={poSearchTerm}
                onChange={(e) => setPoSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="lookup-modal-table-container">
                <table className="lookup-modal-table">
                  <thead>
                    <tr>
                      <th>P.O. Number</th>
                      <th>P.O. Date</th>
                      <th>Vendor Ref No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorPurchaseOrders
                      .filter((po) =>
                        po.poNumber
                          .toLowerCase()
                          .includes(poSearchTerm.toLowerCase())
                      )
                      .map((po) => (
                        <tr key={po.id} onClick={() => handleSelectPO(po)}>
                          <td>{po.poNumber}</td>
                          <td>{new Date(po.poDate).toLocaleDateString()}</td>
                          <td>{po.vendorRefNumber}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="ap-inv-add-page-container">
        <div className="ap-inv-add-page-header-bar">
          <h1 className="ap-inv-add-page-main-title">Create A/P Invoice</h1>
        </div>
        <div className="ap-inv-add__form-header">
          <div className="ap-inv-entry-header-column">
            <div className="ap-inv-entry-header-field">
              <label htmlFor="vendorCode">Vendor Code:</label>
              <div className="ap-inv-input-with-icon-wrapper">
                <input
                  type="text"
                  id="vendorCode"
                  value={formData.vendorCode}
                  className="ap-inv-form-input"
                  readOnly
                  onClick={openVendorModal}
                />
                <button
                  type="button"
                  className="ap-inv-header-lookup-btn"
                  onClick={openVendorModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="ap-inv-entry-header-field">
              <label htmlFor="vendorName">Vendor Name:</label>
              <div className="ap-inv-input-with-icon-wrapper">
                <input
                  type="text"
                  id="vendorName"
                  value={formData.vendorName}
                  className="ap-inv-form-input"
                  readOnly
                  onClick={openVendorModal}
                />
                <button
                  type="button"
                  className="ap-inv-header-lookup-btn"
                  onClick={openVendorModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="ap-inv-entry-header-field">
              <label htmlFor="purchaseOrderNo">Based on P.O. #:</label>
              <div className="ap-inv-input-with-icon-wrapper">
                <input
                  type="text"
                  id="purchaseOrderNo"
                  value={formData.purchaseOrderNo}
                  className="ap-inv-form-input"
                  readOnly
                  onClick={openPOModal}
                  disabled={!formData.vendorCode}
                />
                <button
                  type="button"
                  className="ap-inv-header-lookup-btn"
                  onClick={openPOModal}
                  disabled={!formData.vendorCode}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="ap-inv-entry-header-field">
              <label htmlFor="vendorRefNumber">Vendor Ref No:</label>
              <input
                type="text"
                id="vendorRefNumber"
                name="vendorRefNumber"
                value={formData.vendorRefNumber}
                onChange={handleInputChange}
                className="ap-inv-form-input"
              />
            </div>
            <div className="ap-inv-entry-header-field">
              <label htmlFor="billToAddress">Bill to Address:</label>
              <textarea
                id="billToAddress"
                name="billToAddress"
                value={formData.billToAddress}
                onChange={handleInputChange}
                className="ap-inv-form-textarea"
                rows="2"
                readOnly
              />
            </div>
            <div className="ap-inv-entry-header-field">
              <label htmlFor="invoiceRemarks">Remarks:</label>
              <textarea
                id="invoiceRemarks"
                name="invoiceRemarks"
                value={formData.invoiceRemarks}
                onChange={handleInputChange}
                className="ap-inv-form-textarea"
                rows="2"
              />
            </div>
          </div>
          <div className="ap-inv-entry-header-column">
            <div className="ap-inv-entry-header-field">
              <label htmlFor="apInvoiceNo">Invoice Number:</label>
              <input
                type="text"
                id="apInvoiceNo"
                value={"Generated on save"}
                className="ap-inv-form-input"
                readOnly
                disabled
              />
            </div>
            <div className="ap-inv-entry-header-field">
              <label htmlFor="invoiceDate">Invoice Date:</label>
              <input
                type="date"
                id="invoiceDate"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                className="ap-inv-form-input"
              />
            </div>
            <div className="ap-inv-entry-header-field">
              <label htmlFor="dueDate">Due Date:</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="ap-inv-form-input"
              />
            </div>
            <div className="ap-inv-entry-header-field file-input-area">
              <label htmlFor="uploadFilesInput">Attachment(s):</label>
              <div className="file-input-controls">
                <input
                  type="file"
                  id="uploadFilesInput"
                  ref={fileInputRef}
                  className="ap-inv-file-input-hidden"
                  onChange={handleFileInputChange}
                  multiple
                />
                <button
                  type="button"
                  className="ap-inv-browse-files-btn"
                  onClick={handleBrowseClick}
                >
                  Browse...
                </button>
                {formData.uploadedFiles.length > 0 && (
                  <div className="ap-inv-file-list-display">
                    {formData.uploadedFiles.map((f, i) => (
                      <div key={f.name + i} className="ap-inv-file-entry">
                        <span className="ap-inv-file-name" title={f.name}>
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(f.name)}
                          className="ap-inv-remove-file-btn"
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
        </div>

        <div className="ap-inv-add-content-area">
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

        <div className="ap-inv-add-page-footer">
          <button
            className="ap-inv-footer-btn primary"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Add A/P Invoice"}
          </button>
          <button
            className="ap-inv-footer-btn secondary"
            onClick={() => navigate("/apinvoice")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default APInvoiceAdd;
