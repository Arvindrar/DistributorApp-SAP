import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
//import "./APCreditNoteAdd.css";
import "../../../styles/Create.css";
import {
  API_PRODUCTS_ENDPOINT,
  API_BASE_URL,
  API_UOM_ENDPOINT,
  API_WAREHOUSE_ENDPOINT,
} from "../../../config";

// --- Reusable Components ---
const MessageModal = ({ message, onClose, type = "info" }) => {
  if (!message) return null;
  return (
    <div className="ap-credit-note-add-modal-overlay">
      <div className={`ap-credit-note-add-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button
          onClick={onClose}
          className="ap-credit-note-add-modal-close-button"
        >
          OK
        </button>
      </div>
    </div>
  );
};
const LookupIcon = () => (
  <span className="ap-credit-note-lookup-indicator-icon" title="Lookup value">
    ○
  </span>
);
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
    title="Remove Item"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

function APCreditNoteAdd() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const initialFormDataState = {
    apCreditNoteNo: "",
    basedOnGrpoNo: "",
    vendorCode: "",
    vendorName: "",
    apCreditNoteDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    vendorRefNumber: "",
    shipToAddress: "",
    apCreditNoteRemarks: "",
    uploadedFiles: [],
  };

  const initialEmptyItem = (id) => ({
    id,
    productCode: "",
    productName: "",
    quantity: "1",
    uom: "",
    price: "",
    warehouseLocation: "",
    taxCode: "",
    taxPrice: "0",
    total: "0.00",
  });

  const [formData, setFormData] = useState(initialFormDataState);
  const [apCreditNoteItems, setApCreditNoteItems] = useState([
    initialEmptyItem(Date.now()),
  ]);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Data for Lookups
  const [allProducts, setAllProducts] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [availableGRPOs, setAvailableGRPOs] = useState([]);
  const [activeTaxCodes, setActiveTaxCodes] = useState([]);
  const [allUOMs, setAllUOMs] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);

  // Modal State Control
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [isGRPOModalOpen, setIsGRPOModalOpen] = useState(false);
  const [grpoSearchTerm, setGrpoSearchTerm] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productModalTargetId, setProductModalTargetId] = useState(null);
  const [isUOMModalOpen, setIsUOMModalOpen] = useState(false);
  const [uomSearchTerm, setUomSearchTerm] = useState("");
  const [uomModalTargetId, setUOMModalTargetId] = useState(null);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("");
  const [warehouseModalTargetId, setWarehouseModalTargetId] = useState(null);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [taxSearchTerm, setTaxSearchTerm] = useState("");
  const [taxModalTargetId, setTaxModalTargetId] = useState(null);

  const showAppModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeAppModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess)
      navigate("/ap-credit-note", { state: { refreshAPCreditNotes: true } });
  };

  const fetchDataForLookups = useCallback(
    async (endpoint, setData, resourceName) => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`${resourceName} API Error`);
        const data = await response.json();
        setData(
          data.filter ? data.filter((item) => item.isActive !== false) : data
        );
      } catch (error) {
        showAppModal(
          `Error loading ${resourceName}: ${error.message}`,
          "error"
        );
      }
    },
    []
  );

  useEffect(() => {
    fetchDataForLookups(API_PRODUCTS_ENDPOINT, setAllProducts, "Products");
    fetchDataForLookups(`${API_BASE_URL}/Vendor`, setAllVendors, "Vendors");
    fetchDataForLookups(
      `${API_BASE_URL}/TaxDeclarations`,
      setActiveTaxCodes,
      "Tax Codes"
    );
    fetchDataForLookups(API_UOM_ENDPOINT, setAllUOMs, "UOMs");
    fetchDataForLookups(API_WAREHOUSE_ENDPOINT, setAllWarehouses, "Warehouses");
  }, [fetchDataForLookups]);

  const updateItemTaxAndTotal = useCallback(
    (itemsToUpdate) => {
      return itemsToUpdate.map((item) => {
        let tax = 0;
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const base = qty * price;
        const taxCodeData = activeTaxCodes.find(
          (tc) => tc.taxCode === item.taxCode
        );
        if (taxCodeData && taxCodeData.totalPercentage != null) {
          tax = base * (parseFloat(taxCodeData.totalPercentage) / 100);
        }
        return {
          ...item,
          taxPrice: tax.toFixed(2),
          total: (base + tax).toFixed(2),
        };
      });
    },
    [activeTaxCodes]
  );

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
  const handleAddItemRow = () =>
    setApCreditNoteItems((prev) => [...prev, initialEmptyItem(Date.now())]);
  const handleRemoveItem = (id) =>
    setApCreditNoteItems((prev) => prev.filter((item) => item.id !== id));

  const handleItemChange = (e, itemId, fieldName) => {
    const { value } = e.target;
    const newItems = apCreditNoteItems.map((item) =>
      item.id === itemId ? { ...item, [fieldName]: value } : item
    );
    if (["quantity", "price", "taxCode"].includes(fieldName)) {
      setApCreditNoteItems(updateItemTaxAndTotal(newItems));
    } else {
      setApCreditNoteItems(newItems);
    }
  };

  const openVendorModal = () => {
    setVendorSearchTerm("");
    setIsVendorModalOpen(true);
  };
  const openProductModal = (id) => {
    setProductModalTargetId(id);
    setProductSearchTerm("");
    setIsProductModalOpen(true);
  };
  const openUOMModal = (id) => {
    setUOMModalTargetId(id);
    setUomSearchTerm("");
    setIsUOMModalOpen(true);
  };
  const openWarehouseModal = (id) => {
    setWarehouseModalTargetId(id);
    setWarehouseSearchTerm("");
    setIsWarehouseModalOpen(true);
  };
  const openTaxModal = (id) => {
    setTaxModalTargetId(id);
    setTaxSearchTerm("");
    setIsTaxModalOpen(true);
  };

  const openGRPOModal = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/GRPOs`);
      if (!response.ok) throw new Error("Could not fetch GRPOs.");
      let allGrpoData = await response.json();
      if (formData.vendorCode) {
        allGrpoData = allGrpoData.filter(
          (grpo) =>
            grpo.vendorCode &&
            grpo.vendorCode.trim().toLowerCase() ===
              formData.vendorCode.trim().toLowerCase()
        );
      }
      if (allGrpoData.length === 0) {
        showAppModal(
          formData.vendorCode
            ? `No GRPOs found for vendor: ${formData.vendorName}`
            : "No GRPOs found.",
          "info"
        );
      } else {
        setAvailableGRPOs(allGrpoData);
        setGrpoSearchTerm("");
        setIsGRPOModalOpen(true);
      }
    } catch (error) {
      console.error("Error in openGRPOModal:", error);
      showAppModal(error.message, "error");
    }
  };

  const handleSelectVendor = (vendor) => {
    setFormData({
      ...initialFormDataState,
      apCreditNoteDate: new Date().toISOString().split("T")[0],
      vendorCode: vendor.code,
      vendorName: vendor.name,
      shipToAddress: [
        vendor.address1,
        vendor.address2,
        vendor.street,
        vendor.city,
      ]
        .filter(Boolean)
        .join(", "),
    });
    setApCreditNoteItems([initialEmptyItem(Date.now())]);
    setAvailableGRPOs([]);
    setIsVendorModalOpen(false);
    setFormErrors({});
  };

  const handleSelectGRPO = async (grpoSummary) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/GRPOs/${grpoSummary.id}`);
      if (!response.ok)
        throw new Error(
          `Failed to fetch details for GRPO #${grpoSummary.grpoNo}`
        );
      const fullGrpoDetails = await response.json();
      setFormData((prev) => ({
        ...prev,
        basedOnGrpoNo: fullGrpoDetails.grpoNo,
        vendorCode: fullGrpoDetails.vendorCode,
        vendorName: fullGrpoDetails.vendorName,
        vendorRefNumber: fullGrpoDetails.vendorRefNumber || "",
        shipToAddress: fullGrpoDetails.shipToAddress || "",
        apCreditNoteRemarks: fullGrpoDetails.grpoRemarks || "",
        dueDate: fullGrpoDetails.dueDate
          ? fullGrpoDetails.dueDate.split("T")[0]
          : "",
      }));
      const newApCreditNoteItems = (fullGrpoDetails.grpoItems || []).map(
        (item, index) => ({
          id: Date.now() + index,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity.toString(),
          uom: item.uom,
          price: item.price.toString(),
          warehouseLocation: item.warehouseLocation,
          taxCode: item.taxCode || "",
          taxPrice: "0",
          total: "0.00",
        })
      );
      setApCreditNoteItems(updateItemTaxAndTotal(newApCreditNoteItems));
      setIsGRPOModalOpen(false);
      setFormErrors({});
    } catch (error) {
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectProduct = (product) => {
    const newItems = apCreditNoteItems.map((item) =>
      item.id === productModalTargetId
        ? {
            ...item,
            productCode: product.sku,
            productName: product.name,
            uom: product.uom,
            price: product.wholesalePrice?.toString() ?? "0",
          }
        : item
    );
    setApCreditNoteItems(updateItemTaxAndTotal(newItems));
    setIsProductModalOpen(false);
  };
  const handleSelectUOM = (uom) => {
    setApCreditNoteItems((prev) =>
      prev.map((item) =>
        item.id === uomModalTargetId ? { ...item, uom: uom.name } : item
      )
    );
    setIsUOMModalOpen(false);
  };
  const handleSelectWarehouse = (wh) => {
    setApCreditNoteItems((prev) =>
      prev.map((item) =>
        item.id === warehouseModalTargetId
          ? { ...item, warehouseLocation: wh.code }
          : item
      )
    );
    setIsWarehouseModalOpen(false);
  };
  const handleSelectTax = (tax) => {
    const newItems = apCreditNoteItems.map((item) =>
      item.id === taxModalTargetId ? { ...item, taxCode: tax.taxCode } : item
    );
    setApCreditNoteItems(updateItemTaxAndTotal(newItems));
    setIsTaxModalOpen(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.vendorCode.trim()) errors.vendorCode = "Vendor is required.";
    if (!formData.apCreditNoteDate)
      errors.apCreditNoteDate = "Credit Note Date is required.";
    if (!formData.dueDate) errors.dueDate = "Due Date is required.";
    if (
      formData.apCreditNoteDate &&
      formData.dueDate &&
      new Date(formData.dueDate) < new Date(formData.apCreditNoteDate)
    ) {
      errors.dueDate = "Due Date cannot be before the Credit Note Date.";
    }
    if (apCreditNoteItems.length === 0) {
      errors.items = "At least one item must be added to the credit note.";
    } else {
      apCreditNoteItems.forEach((item, index) => {
        if (!item.productCode.trim())
          errors[
            `item_${item.id}_productCode`
          ] = `Product is required for row ${index + 1}.`;
        if (!item.quantity || parseFloat(item.quantity) <= 0)
          errors[`item_${item.id}_quantity`] = `Quantity must be > 0 for row ${
            index + 1
          }.`;
        if (
          item.price === "" ||
          isNaN(parseFloat(item.price)) ||
          parseFloat(item.price) < 0
        )
          errors[
            `item_${item.id}_price`
          ] = `Price must be a valid, non-negative number for row ${
            index + 1
          }.`;
        if (!item.uom || !item.uom.trim())
          errors[`item_${item.id}_uom`] = `UOM is required for row ${
            index + 1
          }.`;
        if (!item.warehouseLocation || !item.warehouseLocation.trim())
          errors[
            `item_${item.id}_warehouseLocation`
          ] = `Warehouse is required for row ${index + 1}.`;
      });
    }
    return errors;
  };

  const handleSave = async () => {
    setFormErrors({});
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      const errorMessages = Object.values(validationErrors).map(
        (err) => `- ${err}`
      );
      const modalErrorMessage =
        "Please correct the following errors:\n" + errorMessages.join("\n");
      showAppModal(modalErrorMessage, "error");
      return;
    }

    setIsSubmitting(true);
    const payload = new FormData();
    payload.append("BasedOnGrpoNo", formData.basedOnGrpoNo);
    payload.append("VendorCode", formData.vendorCode);
    payload.append("VendorName", formData.vendorName);
    payload.append("APCreditNoteDate", formData.apCreditNoteDate);
    payload.append("DueDate", formData.dueDate);
    payload.append("VendorRefNumber", formData.vendorRefNumber);
    payload.append("ShipToAddress", formData.shipToAddress);
    payload.append("APCreditNoteRemarks", formData.apCreditNoteRemarks);

    const itemsPayload = apCreditNoteItems.map((item) => ({
      ProductCode: item.productCode,
      ProductName: item.productName,
      Quantity: parseFloat(item.quantity) || 0,
      UOM: item.uom,
      Price: parseFloat(item.price) || 0,
      WarehouseLocation: item.warehouseLocation,
      TaxCode: item.taxCode,
      TaxPrice: parseFloat(item.taxPrice) || 0,
      Total: parseFloat(item.total) || 0,
    }));
    payload.append("APCreditNoteItemsJson", JSON.stringify(itemsPayload));
    formData.uploadedFiles.forEach((file) =>
      payload.append("UploadedFiles", file, file.name)
    );

    try {
      const response = await fetch(`${API_BASE_URL}/APCreditNotes`, {
        method: "POST",
        body: payload,
      });
      const responseData = await response.json();
      if (!response.ok)
        throw new Error(
          responseData.message || "Failed to create AP Credit Note."
        );
      showAppModal(responseData.message, "success");
    } catch (error) {
      console.error("Error saving AP Credit Note:", error);
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const grandTotalSummary = apCreditNoteItems
    .reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
    .toFixed(2);
  const taxTotalSummary = apCreditNoteItems
    .reduce((sum, item) => sum + (parseFloat(item.taxPrice) || 0), 0)
    .toFixed(2);
  const productTotalSummary = (
    parseFloat(grandTotalSummary) - parseFloat(taxTotalSummary)
  ).toFixed(2);

  return (
    <>
      <MessageModal
        message={modalState.message}
        onClose={closeAppModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      {/* --- ALL MODALS (Render them here) --- */}
      {isVendorModalOpen && (
        <div className="lookup-modal-overlay">
          {/* ... Vendor Modal Content ... */}
        </div>
      )}
      {isGRPOModalOpen && (
        <div className="lookup-modal-overlay">
          {/* ... GRPO Modal Content ... */}
        </div>
      )}
      {/* ... Other modals for Product, UOM, etc. ... */}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="form-header">
          <div className="header-column">
            <div className="header-field">
              <label htmlFor="vendorCode">Vendor Code:</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  id="vendorCode"
                  value={formData.vendorCode}
                  className="form-input"
                  readOnly
                  onClick={openVendorModal}
                />
                <button
                  type="button"
                  className="lookup-btn"
                  onClick={openVendorModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="header-field">
              <label htmlFor="vendorName">Vendor Name:</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  id="vendorName"
                  value={formData.vendorName}
                  className="form-input"
                  readOnly
                  onClick={openVendorModal}
                />
                <button
                  type="button"
                  className="lookup-btn"
                  onClick={openVendorModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="header-field">
              <label htmlFor="basedOnGrpoNo">Based on GRPO #:</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  id="basedOnGrpoNo"
                  value={formData.basedOnGrpoNo}
                  className="form-input"
                  readOnly
                  onClick={openGRPOModal}
                />
                <button
                  type="button"
                  className="lookup-btn"
                  onClick={openGRPOModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="header-field">
              <label htmlFor="vendorRefNumber">Vendor Ref No:</label>
              <input
                type="text"
                id="vendorRefNumber"
                name="vendorRefNumber"
                value={formData.vendorRefNumber}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="header-field">
              <label htmlFor="shipToAddress">Ship to Address:</label>
              <textarea
                id="shipToAddress"
                name="shipToAddress"
                value={formData.shipToAddress}
                onChange={handleInputChange}
                className="form-textarea"
                rows="2"
              />
            </div>
            <div className="header-field">
              <label htmlFor="apCreditNoteRemarks">Remarks:</label>
              <textarea
                id="apCreditNoteRemarks"
                name="apCreditNoteRemarks"
                value={formData.apCreditNoteRemarks}
                onChange={handleInputChange}
                className="form-textarea"
                rows="2"
              />
            </div>
          </div>
          <div className="header-column">
            <div className="header-field">
              <label htmlFor="apCreditNoteNo">Credit Note #:</label>
              <input
                type="text"
                id="apCreditNoteNo"
                value={"Generated on save"}
                className="form-input"
                readOnly
                disabled
              />
            </div>
            <div className="header-field">
              <label htmlFor="apCreditNoteDate">Credit Note Date:</label>
              <input
                type="date"
                id="apCreditNoteDate"
                name="apCreditNoteDate"
                value={formData.apCreditNoteDate}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="header-field">
              <label htmlFor="dueDate">Due Date:</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="header-field file-area">
              <label htmlFor="uploadFilesInput">Attachment(s):</label>
              <div className="file-controls">
                <input
                  type="file"
                  id="uploadFilesInput"
                  ref={fileInputRef}
                  className="file-input-hidden"
                  onChange={handleFileInputChange}
                  multiple
                />
                <button
                  type="button"
                  className="browse-btn"
                  onClick={handleBrowseClick}
                >
                  Browse...
                </button>
                {formData.uploadedFiles.length > 0 && (
                  <div className="file-list">
                    {formData.uploadedFiles.map((f, i) => (
                      <div key={f.name + i} className="file-entry">
                        <span className="file-name" title={f.name}>
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
        </div>

        <div className="content-area">
          <div className="items-header">
            <h3 className="section-title">Product Details</h3>
            <button
              type="button"
              className="add-row-btn"
              onClick={handleAddItemRow}
            >
              + Add Row
            </button>
          </div>
          <div className="table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>UOM</th>
                  <th>Price</th>
                  <th>Warehouse</th>
                  <th>Tax Code</th>
                  <th>Tax Price</th>
                  <th>Total</th>
                  <th className="action-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {apCreditNoteItems.length > 0 ? (
                  apCreditNoteItems.map((item) => (
                    <tr key={item.id}>
                      <td className="editable-cell">
                        <div className="table-input-wrapper">
                          <input
                            type="text"
                            value={item.productCode}
                            className={`table-input ${
                              formErrors[`item_${item.id}_productCode`]
                                ? "input-error"
                                : ""
                            }`}
                            readOnly
                            onClick={() => openProductModal(item.id)}
                          />
                          <button
                            type="button"
                            className="lookup-btn"
                            onClick={() => openProductModal(item.id)}
                          >
                            <LookupIcon />
                          </button>
                        </div>
                      </td>
                      <td className="editable-cell">
                        <input
                          type="text"
                          value={item.productName}
                          className="table-input"
                          readOnly
                        />
                      </td>
                      <td className="editable-cell">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(e, item.id, "quantity")
                          }
                          className={`table-input align-right ${
                            formErrors[`item_${item.id}_quantity`]
                              ? "input-error"
                              : ""
                          }`}
                        />
                      </td>
                      <td className="editable-cell">
                        <div className="table-input-wrapper">
                          <input
                            type="text"
                            value={item.uom}
                            onChange={(e) =>
                              handleItemChange(e, item.id, "uom")
                            }
                            className={`table-input align-center ${
                              formErrors[`item_${item.id}_uom`]
                                ? "input-error"
                                : ""
                            }`}
                          />
                          <button
                            type="button"
                            className="lookup-btn"
                            onClick={() => openUOMModal(item.id)}
                          >
                            <LookupIcon />
                          </button>
                        </div>
                      </td>
                      <td className="editable-cell">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(e, item.id, "price")
                          }
                          className={`table-input align-right ${
                            formErrors[`item_${item.id}_price`]
                              ? "input-error"
                              : ""
                          }`}
                        />
                      </td>
                      <td className="editable-cell">
                        <div className="table-input-wrapper">
                          <input
                            type="text"
                            value={item.warehouseLocation}
                            onChange={(e) =>
                              handleItemChange(e, item.id, "warehouseLocation")
                            }
                            className={`table-input ${
                              formErrors[`item_${item.id}_warehouseLocation`]
                                ? "input-error"
                                : ""
                            }`}
                            onClick={() => openWarehouseModal(item.id)}
                          />
                          <button
                            type="button"
                            className="lookup-btn"
                            onClick={() => openWarehouseModal(item.id)}
                          >
                            <LookupIcon />
                          </button>
                        </div>
                      </td>
                      <td className="editable-cell">
                        <div className="table-input-wrapper">
                          <input
                            type="text"
                            value={item.taxCode}
                            onChange={(e) =>
                              handleItemChange(e, item.id, "taxCode")
                            }
                            className="table-input"
                            onClick={() => openTaxModal(item.id)}
                          />
                          <button
                            type="button"
                            className="lookup-btn"
                            onClick={() => openTaxModal(item.id)}
                          >
                            <LookupIcon />
                          </button>
                        </div>
                      </td>
                      <td className="readonly-cell">
                        <input
                          type="number"
                          value={item.taxPrice}
                          className="table-input align-right"
                          readOnly
                        />
                      </td>
                      <td className="readonly-cell total-cell">{item.total}</td>
                      <td className="action-cell">
                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <DeleteIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="no-items-row">
                      Click '+ Add Row' to begin or select a GRPO to populate
                      items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="summary-container">
            <div className="summary-item">
              <label>Product Total (ex. Tax):</label>
              <input
                type="text"
                readOnly
                value={productTotalSummary}
                className="summary-input"
              />
            </div>
            <div className="summary-item">
              <label>Tax Total:</label>
              <input
                type="text"
                readOnly
                value={taxTotalSummary}
                className="summary-input"
              />
            </div>
            <div className="summary-item">
              <label>Net Total:</label>
              <input
                type="text"
                readOnly
                value={grandTotalSummary}
                className="summary-input"
              />
            </div>
          </div>
        </div>

        <div className="page-footer">
          <button
            type="button"
            className="footer-btn secondary"
            onClick={() => navigate("/apcreditnote")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="footer-btn primary"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Add AP Credit Note"}
          </button>
        </div>
      </form>
    </>
  );
}
export default APCreditNoteAdd;
