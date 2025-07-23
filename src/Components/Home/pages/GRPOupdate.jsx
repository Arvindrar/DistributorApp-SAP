import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./GRPOUpdate.css"; // Use the new CSS file
import {
  API_PRODUCTS_ENDPOINT,
  API_BASE_URL,
  API_UOM_ENDPOINT,
  API_WAREHOUSE_ENDPOINT,
} from "../../../config";

// --- Reusable Components (prefixed for this page) ---
const MessageModal = ({ message, onClose, type = "info" }) => {
  if (!message) return null;
  return (
    <div className="grpo-update-modal-overlay">
      <div className={`grpo-update-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="grpo-update-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};
const LookupIcon = () => (
  <span className="grpo-update__lookup-indicator-icon" title="Lookup value">
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

function GRPOUpdate() {
  const navigate = useNavigate();
  const { grpoId } = useParams(); // Changed from poId
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    grpoNo: "",
    purchaseOrderNo: "",
    vendorCode: "",
    vendorName: "",
    grpoDate: "",
    deliveryDate: "",
    vendorRefNumber: "",
    shipToAddress: "",
    grpoRemarks: "",
    uploadedFiles: [],
  });
  const [grpoItems, setGrpoItems] = useState([]);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileIdsToDelete, setFileIdsToDelete] = useState([]);

  // Lookup data states
  const [allProducts, setAllProducts] = useState([]);
  const [activeTaxCodes, setActiveTaxCodes] = useState([]);
  const [allUOMs, setAllUOMs] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalTargetId, setProductModalTargetId] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [taxModalTargetId, setTaxModalTargetId] = useState(null);
  const [taxSearchTerm, setTaxSearchTerm] = useState("");
  const [isUOMModalOpen, setIsUOMModalOpen] = useState(false);
  const [uomModalTargetId, setUOMModalTargetId] = useState(null);
  const [uomSearchTerm, setUomSearchTerm] = useState("");
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [warehouseModalTargetId, setWarehouseModalTargetId] = useState(null);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("");

  const showAppModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeAppModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess) navigate("/grpo");
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

  const fetchDataForLookups = useCallback(
    async (endpoint, setData, resourceName) => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`${resourceName} API Error`);
        setData(await response.json());
      } catch (error) {
        console.error(`Error loading ${resourceName}:`, error);
      }
    },
    []
  );

  useEffect(() => {
    Promise.all([
      fetchDataForLookups(API_PRODUCTS_ENDPOINT, setAllProducts, "Products"),
      fetchDataForLookups(
        `${API_BASE_URL}/TaxDeclarations`,
        setActiveTaxCodes,
        "Tax Codes"
      ),
      fetchDataForLookups(API_UOM_ENDPOINT, setAllUOMs, "UOMs"),
      fetchDataForLookups(
        API_WAREHOUSE_ENDPOINT,
        setAllWarehouses,
        "Warehouses"
      ),
    ]);
  }, [fetchDataForLookups]);

  useEffect(() => {
    const fetchGRPO = async () => {
      setIsLoading(true);
      setPageError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/GRPOs/${grpoId}`);
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Failed to load data. Server responded with ${response.status}: ${errorBody}`
          );
        }
        const data = await response.json();
        if (!data) throw new Error("Received empty data from server.");

        setFormData({
          grpoNo: data.grpoNo,
          purchaseOrderNo: data.purchaseOrderNo || "",
          vendorCode: data.vendorCode || "",
          vendorName: data.vendorName || "",
          grpoDate: data.grpoDate
            ? new Date(data.grpoDate).toISOString().split("T")[0]
            : "",
          deliveryDate: data.deliveryDate
            ? new Date(data.deliveryDate).toISOString().split("T")[0]
            : "",
          vendorRefNumber: data.vendorRefNumber || "",
          shipToAddress: data.shipToAddress || "",
          grpoRemarks: data.grpoRemarks || "",
          uploadedFiles: [],
        });

        setGrpoItems(
          (data.grpoItems || []).map((item) => ({
            ...item,
            id: item.id || Date.now() + Math.random(),
            quantity: item.quantity?.toString() || "1",
            price: item.price?.toString() || "0",
            taxPrice: item.taxPrice?.toFixed(2) || "0.00",
            total: item.total?.toFixed(2) || "0.00",
          }))
        );
        setExistingAttachments(data.attachments || []);
        setFileIdsToDelete([]);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGRPO();
  }, [grpoId]);

  const updateItemTaxAndTotal = useCallback(
    (itemIdToUpdate, items) => {
      return items.map((item) => {
        if (item.id === itemIdToUpdate) {
          let tax = 0;
          const qty = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const base = qty * price;
          const taxCodeData = activeTaxCodes.find(
            (tc) => tc.taxCode === item.taxCode
          );
          if (taxCodeData?.totalPercentage != null) {
            tax = base * (parseFloat(taxCodeData.totalPercentage) / 100);
          }
          return {
            ...item,
            taxPrice: tax.toFixed(2),
            total: (base + tax).toFixed(2),
          };
        }
        return item;
      });
    },
    [activeTaxCodes]
  );

  const handleItemChange = (e, itemId, fieldName) => {
    const { value } = e.target;
    let newItems = grpoItems.map((item) =>
      item.id === itemId ? { ...item, [fieldName]: value } : item
    );
    if (["quantity", "price", "taxCode"].includes(fieldName)) {
      newItems = updateItemTaxAndTotal(itemId, newItems);
    }
    setGrpoItems(newItems);
  };

  const handleSelectProduct = (product) => {
    let newItems = grpoItems.map((item) =>
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
    newItems = updateItemTaxAndTotal(productModalTargetId, newItems);
    setGrpoItems(newItems);
    setIsProductModalOpen(false);
  };

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFileInputChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        uploadedFiles: [
          ...prev.uploadedFiles,
          ...newFiles.filter(
            (file) => !prev.uploadedFiles.some((f) => f.name === file.name)
          ),
        ],
      }));
    }
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

  const handleAddItemRow = () =>
    setGrpoItems((prev) => [...prev, initialEmptyItem(Date.now())]);
  const handleRemoveItem = (id) =>
    setGrpoItems((prev) => prev.filter((item) => item.id !== id));

  const openProductModal = (id) => {
    setProductModalTargetId(id);
    setIsProductModalOpen(true);
  };
  const openUOMModal = (id) => {
    setUOMModalTargetId(id);
    setIsUOMModalOpen(true);
  };
  const openWarehouseModal = (id) => {
    setWarehouseModalTargetId(id);
    setIsWarehouseModalOpen(true);
  };
  const openTaxModal = (id) => {
    setTaxModalTargetId(id);
    setIsTaxModalOpen(true);
  };

  const handleSelectUOM = (uom) => {
    setGrpoItems((prev) =>
      prev.map((item) =>
        item.id === uomModalTargetId ? { ...item, uom: uom.name } : item
      )
    );
    setIsUOMModalOpen(false);
  };
  const handleSelectWarehouse = (wh) => {
    setGrpoItems((prev) =>
      prev.map((item) =>
        item.id === warehouseModalTargetId
          ? { ...item, warehouseLocation: wh.code }
          : item
      )
    );
    setIsWarehouseModalOpen(false);
  };
  const handleSelectTax = (tax) => {
    let newItems = grpoItems.map((item) =>
      item.id === taxModalTargetId ? { ...item, taxCode: tax.taxCode } : item
    );
    newItems = updateItemTaxAndTotal(taxModalTargetId, newItems);
    setGrpoItems(newItems);
    setIsTaxModalOpen(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.vendorCode.trim()) errors.vendorCode = "Vendor is required.";
    if (!formData.grpoDate) errors.grpoDate = "GRPO Date is required.";
    if (!formData.deliveryDate) errors.deliveryDate = "GRPO Date is required.";

    if (
      formData.deliveryDate &&
      new Date(formData.deliveryDate) < new Date(formData.grpoDate)
    ) {
      errors.deliveryDate = "Delivery Date cannot be before GRPO Date.";
    }
    if (grpoItems.length === 0) {
      errors.itemsGeneral = "At least one item must be added to the GRPO.";
    } else {
      grpoItems.forEach((item) => {
        if (!item.productCode.trim())
          errors[`item_${item.id}_product`] = "Product is required.";
        if (
          !item.quantity ||
          isNaN(parseFloat(item.quantity)) ||
          parseFloat(item.quantity) <= 0
        ) {
          errors[`item_${item.id}_quantity`] =
            "Quantity must be a positive number.";
        }
        if (
          item.price === "" ||
          isNaN(parseFloat(item.price)) ||
          parseFloat(item.price) < 0
        ) {
          errors[`item_${item.id}_price`] =
            "Price must be a valid, non-negative number.";
        }
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
      const errorMessages = Object.values(validationErrors);
      const formattedErrorList = errorMessages
        .map((err) => `- ${err}`)
        .join("\n");
      const modalErrorMessage =
        "Please correct the following errors:\n" + formattedErrorList;
      showAppModal(modalErrorMessage, "error");
      return;
    }

    setIsSubmitting(true);
    const payload = new FormData();

    // Append all form data
    payload.append("PurchaseOrderNo", formData.purchaseOrderNo);
    payload.append("VendorCode", formData.vendorCode);
    payload.append("VendorName", formData.vendorName);
    payload.append("GRPODate", formData.grpoDate);
    if (formData.deliveryDate)
      payload.append("DeliveryDate", formData.deliveryDate);
    payload.append("VendorRefNumber", formData.vendorRefNumber);
    payload.append("ShipToAddress", formData.shipToAddress);
    payload.append("GRPORemarks", formData.grpoRemarks);

    const itemsPayload = grpoItems.map((item) => ({
      Id: typeof item.id === "string" && item.id.includes("-") ? 0 : item.id,
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
    payload.append("GRPOItemsJson", JSON.stringify(itemsPayload));

    payload.append("FilesToDeleteJson", JSON.stringify(fileIdsToDelete));
    formData.uploadedFiles.forEach((file) =>
      payload.append("UploadedFiles", file, file.name)
    );

    try {
      const response = await fetch(`${API_BASE_URL}/GRPOs/${grpoId}`, {
        method: "PUT",
        body: payload,
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({
            message: `Failed to update GRPO. Status: ${response.status}`,
          }));
        throw new Error(errorData.message);
      }
      showAppModal("GRPO updated successfully!", "success");
    } catch (error) {
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const grandTotalSummary = grpoItems
    .reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
    .toFixed(2);
  const taxTotalSummary = grpoItems
    .reduce((sum, item) => sum + (parseFloat(item.taxPrice) || 0), 0)
    .toFixed(2);
  const productTotalSummary = (
    parseFloat(grandTotalSummary) - parseFloat(taxTotalSummary)
  ).toFixed(2);

  if (isLoading)
    return <div className="grpo-update__page-loading">Loading GRPO...</div>;
  if (pageError)
    return <div className="grpo-update__page-error">Error: {pageError}</div>;

  return (
    <>
      <MessageModal
        message={modalState.message}
        onClose={closeAppModal}
        type={modalState.type}
      />
      {isProductModalOpen && (
        <div className="grpo-update-modal-overlay">
          <div className="grpo-update-modal-content">
            <div className="modal-header">
              <h2>Select Product</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsProductModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                className="modal-search-input"
                type="text"
                placeholder="Search by SKU or Name..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="product-lookup-table-container">
                <table className="product-lookup-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts
                      .filter(
                        (p) =>
                          p.name
                            .toLowerCase()
                            .includes(productSearchTerm.toLowerCase()) ||
                          p.sku
                            .toLowerCase()
                            .includes(productSearchTerm.toLowerCase())
                      )
                      .map((product) => (
                        <tr
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                        >
                          <td>{product.sku}</td>
                          <td>{product.name}</td>
                          <td>{product.wholesalePrice?.toFixed(2) ?? "N/A"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {isUOMModalOpen && (
        <div className="grpo-update-modal-overlay">
          <div className="grpo-update-modal-content">
            <div className="modal-header">
              <h2>Select UOM</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsUOMModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                className="modal-search-input"
                type="text"
                placeholder="Search UOM..."
                value={uomSearchTerm}
                onChange={(e) => setUomSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="product-lookup-table-container">
                <table className="product-lookup-table">
                  <thead>
                    <tr>
                      <th>UOM Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUOMs
                      .filter((u) =>
                        u.name
                          .toLowerCase()
                          .includes(uomSearchTerm.toLowerCase())
                      )
                      .map((uom) => (
                        <tr key={uom.id} onClick={() => handleSelectUOM(uom)}>
                          <td>{uom.name}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {isWarehouseModalOpen && (
        <div className="grpo-update-modal-overlay">
          <div className="grpo-update-modal-content">
            <div className="modal-header">
              <h2>Select Warehouse</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsWarehouseModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                className="modal-search-input"
                type="text"
                placeholder="Search Warehouse..."
                value={warehouseSearchTerm}
                onChange={(e) => setWarehouseSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="product-lookup-table-container">
                <table className="product-lookup-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allWarehouses
                      .filter(
                        (w) =>
                          w.name
                            .toLowerCase()
                            .includes(warehouseSearchTerm.toLowerCase()) ||
                          w.code
                            .toLowerCase()
                            .includes(warehouseSearchTerm.toLowerCase())
                      )
                      .map((wh) => (
                        <tr
                          key={wh.id}
                          onClick={() => handleSelectWarehouse(wh)}
                        >
                          <td>{wh.code}</td>
                          <td>{wh.name}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {isTaxModalOpen && (
        <div className="grpo-update-modal-overlay">
          <div className="grpo-update-modal-content">
            <div className="modal-header">
              <h2>Select Tax Code</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsTaxModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                className="modal-search-input"
                type="text"
                placeholder="Search Tax Code..."
                value={taxSearchTerm}
                onChange={(e) => setTaxSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="product-lookup-table-container">
                <table className="product-lookup-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Rate (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTaxCodes
                      .filter((t) =>
                        t.taxCode
                          .toLowerCase()
                          .includes(taxSearchTerm.toLowerCase())
                      )
                      .map((tax) => (
                        <tr key={tax.id} onClick={() => handleSelectTax(tax)}>
                          <td>{tax.taxCode}</td>
                          <td>{tax.taxDescription}</td>
                          <td>{tax.totalPercentage?.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* All modals (Product, UOM, etc.) go here... */}

      <div className="grpo-update__detail-page-container">
        <div className="grpo-update__detail-page-header-bar">
          <h1 className="grpo-update__detail-page-main-title">
            Update GRPO: {formData.grpoNo}
          </h1>
        </div>

        <div className="grpo-update__form-header">
          <div className="grpo-update__entry-header-column">
            <div className="grpo-update__entry-header-field">
              <label>Vendor Code:</label>
              <input
                type="text"
                value={formData.vendorCode}
                readOnly
                className="grpo-update__form-input-styled"
              />
            </div>
            <div className="grpo-update__entry-header-field">
              <label>Vendor Name:</label>
              <input
                type="text"
                value={formData.vendorName}
                readOnly
                className="grpo-update__form-input-styled"
              />
            </div>
            <div className="grpo-update__entry-header-field">
              <label>Based on P.O. #:</label>
              <input
                type="text"
                value={formData.purchaseOrderNo}
                readOnly
                className="grpo-update__form-input-styled"
              />
            </div>
            <div className="grpo-update__entry-header-field">
              <label>Vendor Ref No:</label>
              <input
                type="text"
                name="vendorRefNumber"
                value={formData.vendorRefNumber}
                onChange={handleInputChange}
                className="grpo-update__form-input-styled"
              />
            </div>
            <div className="grpo-update__entry-header-field">
              <label>Ship to Address:</label>
              <textarea
                name="shipToAddress"
                value={formData.shipToAddress}
                onChange={handleInputChange}
                className="grpo-update__form-textarea-styled"
              />
            </div>
            <div className="grpo-update__entry-header-field">
              <label>Remarks:</label>
              <textarea
                name="grpoRemarks"
                value={formData.grpoRemarks}
                onChange={handleInputChange}
                className="grpo-update__form-textarea-styled"
              />
            </div>
          </div>
          <div className="grpo-update__entry-header-column">
            <div className="grpo-update__entry-header-field">
              <label>GRPO Number:</label>
              <input
                type="text"
                value={formData.grpoNo}
                readOnly
                className="grpo-update__form-input-styled"
              />
            </div>
            <div className="grpo-update__entry-header-field">
              <label>GRPO Date:</label>
              <input
                type="date"
                name="grpoDate"
                value={formData.grpoDate}
                onChange={handleInputChange}
                className="grpo-update__form-input-styled"
              />
            </div>
            <div className="grpo-update__entry-header-field">
              <label>Delivery Date:</label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                className="grpo-update__form-input-styled"
              />
            </div>
            <div className="grpo-update__entry-header-field grpo-update__file-input-container">
              <label>Attachment(s):</label>
              <button
                type="button"
                className="grpo-update__browse-files-btn"
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
              <div className="grpo-update__file-names-display-area">
                {existingAttachments.map((f) => (
                  <div key={f.id} className="grpo-update__file-name-entry">
                    <span>{f.fileName}</span>
                    <button
                      onClick={() => handleRemoveExistingFile(f.id)}
                      className="grpo-update__remove-file-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {formData.uploadedFiles.map((f, i) => (
                  <div key={i} className="grpo-update__file-name-entry">
                    <span>
                      <i>{f.name} (new)</i>
                    </span>
                    <button
                      onClick={() => handleRemoveNewFile(f.name)}
                      className="grpo-update__remove-file-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grpo-update__detail-form-content-area">
          <div className="grpo-update__items-section">
            <div className="grpo-update__product-details-header">
              <h3 className="grpo-update__form-section-title">
                Product Details
              </h3>
              <button
                onClick={handleAddItemRow}
                className="grpo-update__add-item-row-btn"
              >
                + Add Row
              </button>
            </div>
            <div className="grpo-update__table-responsive-container">
              <table className="grpo-update__items-table">
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grpoItems.map((item) => (
                    <tr key={item.id}>
                      <td className="grpo-update__editable-cell">
                        <div className="grpo-update-input-with-icon-wrapper">
                          <input
                            type="text"
                            value={item.productCode}
                            readOnly
                            onClick={() => openProductModal(item.id)}
                            className="grpo-update__table-input"
                          />
                          <button
                            type="button"
                            className="grpo-update__lookup-indicator"
                            onClick={() => openProductModal(item.id)}
                          >
                            <LookupIcon />
                          </button>
                        </div>
                      </td>
                      <td className="grpo-update__editable-cell">
                        <input
                          type="text"
                          value={item.productName}
                          onClick={() => openProductModal(item.id)}
                          readOnly
                          className="grpo-update__table-input"
                        />
                        <button
                          type="button"
                          className="grpo-update__lookup-indicator"
                          onClick={() => openProductModal(item.id)}
                        >
                          <LookupIcon />
                        </button>
                      </td>
                      <td className="grpo-update__editable-cell">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(e, item.id, "quantity")
                          }
                          className="grpo-update__table-input"
                        />
                      </td>
                      <td className="grpo-update__editable-cell">
                        <div className="grpo-update-input-with-icon-wrapper">
                          <input
                            type="text"
                            value={item.uom}
                            onChange={(e) =>
                              handleItemChange(e, item.id, "uom")
                            }
                            className="grpo-update__table-input"
                          />
                          <button
                            type="button"
                            className="grpo-update__lookup-indicator"
                            onClick={() => openUOMModal(item.id)}
                          >
                            <LookupIcon />
                          </button>
                        </div>
                      </td>
                      <td className="grpo-update__editable-cell">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(e, item.id, "price")
                          }
                          className="grpo-update__table-input"
                        />
                      </td>
                      <td className="grpo-update__editable-cell">
                        <div className="grpo-update-input-with-icon-wrapper">
                          <input
                            type="text"
                            value={item.warehouseLocation}
                            readOnly
                            onClick={() => openWarehouseModal(item.id)}
                            className="grpo-update__table-input"
                          />
                          <button
                            type="button"
                            className="grpo-update__lookup-indicator"
                            onClick={() => openWarehouseModal(item.id)}
                          >
                            <LookupIcon />
                          </button>
                        </div>
                      </td>
                      <td className="grpo-update__editable-cell">
                        <div className="grpo-update-input-with-icon-wrapper">
                          <input
                            type="text"
                            value={item.taxCode}
                            readOnly
                            onClick={() => openTaxModal(item.id)}
                            className="grpo-update__table-input"
                          />
                          <button
                            type="button"
                            className="grpo-update__lookup-indicator"
                            onClick={() => openTaxModal(item.id)}
                          >
                            <LookupIcon />
                          </button>
                        </div>
                      </td>
                      <td className="grpo-update__editable-cell">
                        <input
                          type="number"
                          value={item.taxPrice}
                          readOnly
                          className="grpo-update__table-input"
                        />
                      </td>
                      <td className="grpo-update__total-cell">{item.total}</td>
                      <td className="grpo-update__action-cell">
                        <button
                          type="button"
                          className="grpo-update__remove-item-btn"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <DeleteIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grpo-update__tax-summary-container">
              <div className="grpo-update__summary-item">
                <label>Product Total w/o Tax :</label>
                <input
                  type="text"
                  readOnly
                  value={productTotalSummary}
                  className="grpo-update__summary-input"
                />
              </div>
              <div className="grpo-update__summary-item">
                <label>Tax Total :</label>
                <input
                  type="text"
                  readOnly
                  value={taxTotalSummary}
                  className="grpo-update__summary-input"
                />
              </div>
              <div className="grpo-update__summary-item">
                <label>Net Total :</label>
                <input
                  type="text"
                  readOnly
                  value={grandTotalSummary}
                  className="grpo-update__summary-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grpo-update__detail-page-footer">
          <button
            className="grpo-update__footer-btn grpo-update__primary"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update GRPO"}
          </button>
          <button
            className="grpo-update__footer-btn grpo-update__secondary"
            onClick={() => navigate("/grpo")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default GRPOUpdate;
