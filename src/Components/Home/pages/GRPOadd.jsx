import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./GRPOAdd.css";
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
    <div className="grpo-add-modal-overlay">
      <div className={`grpo-add-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="grpo-add-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};
const LookupIcon = () => (
  <span className="grpo-lookup-indicator-icon" title="Lookup value">
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

function GRPOAdd() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const initialFormDataState = {
    grpoNo: "",
    purchaseOrderNo: "",
    vendorCode: "",
    vendorName: "",
    grpoDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    vendorRefNumber: "",
    shipToAddress: "",
    grpoRemarks: "",
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
  const [grpoItems, setGrpoItems] = useState([initialEmptyItem(Date.now())]);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data for Lookups
  const [allProducts, setAllProducts] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [vendorPurchaseOrders, setVendorPurchaseOrders] = useState([]);
  const [activeTaxCodes, setActiveTaxCodes] = useState([]);
  const [allUOMs, setAllUOMs] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);

  // Modal State Control
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState("");
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
  const [formErrors, setFormErrors] = useState({});

  const showAppModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeAppModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess) navigate("/grpo", { state: { refreshGRPOs: true } });
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
    setGrpoItems((prev) => [...prev, initialEmptyItem(Date.now())]);
  const handleRemoveItem = (id) =>
    setGrpoItems((prev) => prev.filter((item) => item.id !== id));

  const handleItemChange = (e, itemId, fieldName) => {
    const { value } = e.target;
    const newItems = grpoItems.map((item) =>
      item.id === itemId ? { ...item, [fieldName]: value } : item
    );
    if (["quantity", "price", "taxCode"].includes(fieldName)) {
      setGrpoItems(updateItemTaxAndTotal(newItems));
    } else {
      setGrpoItems(newItems);
    }
  };

  const openVendorModal = () => {
    setVendorSearchTerm("");
    setIsVendorModalOpen(true);
  };

  const openPOModal = async () => {
    if (!formData.vendorCode) {
      showAppModal("Please select a vendor first.", "info");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/PurchaseOrders`);
      if (!response.ok) throw new Error("Could not fetch Purchase Orders.");

      const allPoData = await response.json();

      // The FIX is here: We REMOVED the "&& po.status === 'Open'" check
      // because your API data does not contain a "status" field.
      // We now filter ONLY by vendor code.
      const vendorPOs = allPoData.filter(
        (po) =>
          po.vendorCode &&
          po.vendorCode.trim().toLowerCase() ===
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
      console.error("Error in openPOModal:", error);
      showAppModal(error.message, "error");
    }
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

  const handleSelectVendor = (vendor) => {
    setFormData({
      ...initialFormDataState,
      grpoDate: new Date().toISOString().split("T")[0],
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
    setGrpoItems([initialEmptyItem(Date.now())]);
    setVendorPurchaseOrders([]);
    setIsVendorModalOpen(false);
  };
  const handleSelectPO = async (poSummary) => {
    setIsSubmitting(true);
    try {
      // Step 1: Make a new API call to get the full details of the selected PO
      // We assume the API endpoint for a single PO is /PurchaseOrders/{id}
      const response = await fetch(
        `${API_BASE_URL}/PurchaseOrders/${poSummary.id}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch details for PO #${poSummary.purchaseOrderNo}`
        );
      }
      const fullPoDetails = await response.json();

      // Step 2: Use the full details to update the form state
      setFormData((prev) => ({
        ...prev,
        purchaseOrderNo: fullPoDetails.purchaseOrderNo,
        // Add defensive checks: if a field might be null, provide a fallback
        deliveryDate: fullPoDetails.deliveryDate
          ? fullPoDetails.deliveryDate.split("T")[0]
          : "",
        vendorRefNumber: fullPoDetails.vendorRefNumber || "",
        shipToAddress: fullPoDetails.shipToAddress || "",
        grpoRemarks: fullPoDetails.purchaseRemarks || "",
      }));

      // Step 3: Use the purchaseItems array from the full details
      // Add a defensive check here as well (|| []) to prevent crash if purchaseItems is missing
      const newGrpoItems = (fullPoDetails.purchaseItems || []).map(
        (item, index) => ({
          id: Date.now() + index,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity.toString(),
          uom: item.uom,
          price: item.price.toString(),
          warehouseLocation: item.warehouseLocation,
          taxCode: item.taxCode || "",
          taxPrice: "0", // Will be recalculated
          total: "0.00", // Will be recalculated
        })
      );

      setGrpoItems(updateItemTaxAndTotal(newGrpoItems));
      setIsPOModalOpen(false);
    } catch (error) {
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectProduct = (product) => {
    const newItems = grpoItems.map((item) =>
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
    setGrpoItems(updateItemTaxAndTotal(newItems));
    setIsProductModalOpen(false);
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
    const newItems = grpoItems.map((item) =>
      item.id === taxModalTargetId ? { ...item, taxCode: tax.taxCode } : item
    );
    setGrpoItems(updateItemTaxAndTotal(newItems));
    setIsTaxModalOpen(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.vendorCode.trim() || !formData.vendorName.trim()) {
      errors.vendorCode = "Vendor Code is required.";
      errors.vendorName = "Vendor Name is required.";
    }
    if (!formData.grpoDate) {
      errors.grpoDate = "GRPO Date is required.";
    }
    if (!formData.deliveryDate) {
      errors.deliveryDate = "Delivery Date is required.";
    }
    if (
      formData.deliveryDate &&
      new Date(formData.deliveryDate) < new Date(formData.grpoDate)
    ) {
      errors.deliveryDate = "Delivery Date cannot be before GRPO Date.";
    }
    if (grpoItems.length === 0) {
      errors.items = "At least one item must be added.";
    } else {
      grpoItems.forEach((item) => {
        if (!item.productCode.trim()) {
          errors[`item_${item.id}_product`] = "Product is required.";
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          errors[`item_${item.id}_quantity`] = "Quantity must be > 0.";
        }
        if (
          item.price === "" ||
          isNaN(parseFloat(item.price)) ||
          parseFloat(item.price) < 0
        ) {
          errors[`item_${item.id}_price`] = "Price must be a valid number.";
        }
        if (!item.uom || !item.uom.trim()) {
          errors[`item_${item.id}_uom`] = "UOM is required.";
        }
        if (!item.warehouseLocation || !item.warehouseLocation.trim()) {
          errors[`item_${item.id}_warehouseLocation`] =
            "Warehouse is required.";
        }
      });
    }
    setFormErrors(errors);
    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const errorMessages = Object.values(validationErrors).map(
        (err) => `- ${err}`
      );
      const modalErrorMessage =
        "Please correct the following errors:\n" + errorMessages.join("\n");
      showAppModal(modalErrorMessage, "error");
      return;
    }

    setIsSubmitting(true);

    // Create a FormData payload to handle file uploads
    const payload = new FormData();

    // Append all header data from the form
    payload.append("PurchaseOrderNo", formData.purchaseOrderNo);
    payload.append("VendorCode", formData.vendorCode);
    payload.append("VendorName", formData.vendorName);
    payload.append("GRPODate", formData.grpoDate);
    if (formData.deliveryDate)
      payload.append("DeliveryDate", formData.deliveryDate);
    payload.append("VendorRefNumber", formData.vendorRefNumber);
    payload.append("ShipToAddress", formData.shipToAddress);
    payload.append("GRPORemarks", formData.grpoRemarks);

    // Prepare and stringify the items array
    const itemsPayload = grpoItems.map((item) => ({
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

    // Append uploaded files
    formData.uploadedFiles.forEach((file) => {
      payload.append("UploadedFiles", file, file.name);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/GRPOs`, {
        method: "POST",
        body: payload,
        // DO NOT set 'Content-Type': 'multipart/form-data'. The browser does it automatically.
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to create GRPO.");
      }

      showAppModal(responseData.message, "success");
    } catch (error) {
      console.error("Error saving GRPO:", error);
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

  return (
    <>
      <MessageModal
        message={modalState.message}
        onClose={closeAppModal}
        type={modalState.type}
      />

      {/* --- ALL MODAL JSX IS NOW INCLUDED --- */}
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
                placeholder="Search..."
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
                placeholder="Search..."
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
                        po.purchaseOrderNo
                          .toLowerCase()
                          .includes(poSearchTerm.toLowerCase())
                      )
                      .map((po) => (
                        <tr key={po.id} onClick={() => handleSelectPO(po)}>
                          <td>{po.purchaseOrderNo}</td>
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

      {isProductModalOpen && (
        <div className="lookup-modal-overlay">
          <div className="lookup-modal-content">
            <div className="lookup-modal-header">
              <h2>Select Product</h2>
              <button
                className="lookup-modal-close-btn"
                onClick={() => setIsProductModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="lookup-modal-body">
              <input
                type="text"
                placeholder="Search..."
                className="lookup-modal-search-input"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="lookup-modal-table-container">
                <table className="lookup-modal-table">
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
        <div className="lookup-modal-overlay">
          <div className="lookup-modal-content">
            <div className="lookup-modal-header">
              <h2>Select UOM</h2>
              <button
                className="lookup-modal-close-btn"
                onClick={() => setIsUOMModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="lookup-modal-body">
              <input
                type="text"
                placeholder="Search..."
                className="lookup-modal-search-input"
                value={uomSearchTerm}
                onChange={(e) => setUomSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="lookup-modal-table-container">
                <table className="lookup-modal-table">
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
        <div className="lookup-modal-overlay">
          <div className="lookup-modal-content">
            <div className="lookup-modal-header">
              <h2>Select Warehouse</h2>
              <button
                className="lookup-modal-close-btn"
                onClick={() => setIsWarehouseModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="lookup-modal-body">
              <input
                type="text"
                placeholder="Search..."
                className="lookup-modal-search-input"
                value={warehouseSearchTerm}
                onChange={(e) => setWarehouseSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="lookup-modal-table-container">
                <table className="lookup-modal-table">
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
        <div className="lookup-modal-overlay">
          <div className="lookup-modal-content">
            <div className="lookup-modal-header">
              <h2>Select Tax Code</h2>
              <button
                className="lookup-modal-close-btn"
                onClick={() => setIsTaxModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="lookup-modal-body">
              <input
                type="text"
                placeholder="Search..."
                className="lookup-modal-search-input"
                value={taxSearchTerm}
                onChange={(e) => setTaxSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="lookup-modal-table-container">
                <table className="lookup-modal-table">
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

      <div className="grpo-add-page-container">
        <div className="grpo-add-page-header-bar">
          <h1 className="grpo-add-page-main-title">Create Goods Receipt PO</h1>
        </div>
        <div className="grpo-add__form-header">
          <div className="grpo-entry-header-column">
            <div className="grpo-entry-header-field">
              <label htmlFor="vendorCode">Vendor Code:</label>
              <div className="grpo-input-with-icon-wrapper">
                <input
                  type="text"
                  id="vendorCode"
                  value={formData.vendorCode}
                  className="grpo-form-input"
                  readOnly
                  onClick={openVendorModal}
                />
                <button
                  type="button"
                  className="grpo-header-lookup-btn"
                  onClick={openVendorModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="grpo-entry-header-field">
              <label htmlFor="vendorName">Vendor Name:</label>
              <div className="grpo-input-with-icon-wrapper">
                <input
                  type="text"
                  id="vendorName"
                  value={formData.vendorName}
                  className="grpo-form-input"
                  readOnly
                  onClick={openVendorModal}
                />
                <button
                  type="button"
                  className="grpo-header-lookup-btn"
                  onClick={openVendorModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="grpo-entry-header-field">
              <label htmlFor="purchaseOrderNo">Based on P.O. #:</label>
              <div className="grpo-input-with-icon-wrapper">
                <input
                  type="text"
                  id="purchaseOrderNo"
                  value={formData.purchaseOrderNo}
                  className="grpo-form-input"
                  readOnly
                  onClick={openPOModal}
                  disabled={!formData.vendorCode}
                />
                <button
                  type="button"
                  className="grpo-header-lookup-btn"
                  onClick={openPOModal}
                  disabled={!formData.vendorCode}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="grpo-entry-header-field">
              <label htmlFor="vendorRefNumber">Vendor Ref No:</label>
              <input
                type="text"
                id="vendorRefNumber"
                name="vendorRefNumber"
                value={formData.vendorRefNumber}
                onChange={handleInputChange}
                className="grpo-form-input"
              />
            </div>
            <div className="grpo-entry-header-field">
              <label htmlFor="shipToAddress">Ship to Address:</label>
              <textarea
                id="shipToAddress"
                name="shipToAddress"
                value={formData.shipToAddress}
                onChange={handleInputChange}
                className="grpo-form-textarea"
                rows="2"
              />
            </div>
            <div className="grpo-entry-header-field">
              <label htmlFor="grpoRemarks">Remarks:</label>
              <textarea
                id="grpoRemarks"
                name="grpoRemarks"
                value={formData.grpoRemarks}
                onChange={handleInputChange}
                className="grpo-form-textarea"
                rows="2"
              />
            </div>
          </div>
          <div className="grpo-entry-header-column">
            <div className="grpo-entry-header-field">
              <label htmlFor="grpoNo">GRPO Number:</label>
              <input
                type="text"
                id="grpoNo"
                value={"Generated on save"}
                className="grpo-form-input"
                readOnly
                disabled
              />
            </div>
            <div className="grpo-entry-header-field">
              <label htmlFor="grpoDate">GRPO Date:</label>
              <input
                type="date"
                id="grpoDate"
                name="grpoDate"
                value={formData.grpoDate}
                onChange={handleInputChange}
                className="grpo-form-input"
              />
            </div>
            <div className="grpo-entry-header-field">
              <label htmlFor="deliveryDate">Delivery Date:</label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                className="grpo-form-input"
              />
            </div>
            <div className="grpo-entry-header-field file-input-area">
              <label htmlFor="uploadFilesInput">Attachment(s):</label>
              <div className="file-input-controls">
                <input
                  type="file"
                  id="uploadFilesInput"
                  ref={fileInputRef}
                  className="grpo-file-input-hidden"
                  onChange={handleFileInputChange}
                  multiple
                />
                <button
                  type="button"
                  className="grpo-browse-files-btn"
                  onClick={handleBrowseClick}
                >
                  Browse...
                </button>
                {formData.uploadedFiles.length > 0 && (
                  <div className="grpo-file-list-display">
                    {formData.uploadedFiles.map((f, i) => (
                      <div key={f.name + i} className="grpo-file-entry">
                        <span className="grpo-file-name" title={f.name}>
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(f.name)}
                          className="grpo-remove-file-btn"
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
        <div className="grpo-add-content-area">
          <div className="grpo-items-header">
            <h3 className="grpo-section-title">Product Details</h3>
            <button
              type="button"
              className="grpo-add-item-row-btn"
              onClick={handleAddItemRow}
            >
              + Add Row
            </button>
          </div>
          <div className="grpo-table-responsive-container">
            <table className="grpo-add__items-table">
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
                  <th className="action-col-header">Action</th>
                </tr>
              </thead>
              <tbody>
                {grpoItems.length > 0 ? (
                  grpoItems.map((item) => (
                    <tr key={item.id}>
                      <td className="editable-cell">
                        <div className="grpo-table-input-wrapper">
                          <input
                            type="text"
                            value={item.productCode}
                            className="grpo-add__table-input"
                            readOnly
                            onClick={() => openProductModal(item.id)}
                          />
                          <button
                            type="button"
                            className="grpo-table-lookup-btn"
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
                          className="grpo-add__table-input"
                          readOnly
                          onClick={() => openProductModal(item.id)}
                        />
                      </td>
                      <td className="editable-cell">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(e, item.id, "quantity")
                          }
                          className="grpo-add__table-input align-right"
                        />
                      </td>
                      <td className="editable-cell">
                        <div className="grpo-table-input-wrapper">
                          <input
                            type="text"
                            value={item.uom}
                            className="grpo-add__table-input align-center"
                            onChange={(e) =>
                              handleItemChange(e, item.id, "uom")
                            }
                          />
                          <button
                            type="button"
                            className="grpo-table-lookup-btn"
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
                          className="grpo-add__table-input align-right"
                        />
                      </td>
                      <td className="editable-cell">
                        <div className="grpo-table-input-wrapper">
                          <input
                            type="text"
                            value={item.warehouseLocation}
                            className="grpo-add__table-input"
                            onClick={() => openWarehouseModal(item.id)}
                            onChange={(e) =>
                              handleItemChange(e, item.id, "warehouseLocation")
                            }
                          />
                          <button
                            type="button"
                            className="grpo-table-lookup-btn"
                            onClick={() => openWarehouseModal(item.id)}
                          >
                            <LookupIcon />
                          </button>
                        </div>
                      </td>
                      <td className="editable-cell">
                        <div className="grpo-table-input-wrapper">
                          <input
                            type="text"
                            value={item.taxCode}
                            className="grpo-add__table-input"
                            onClick={() => openTaxModal(item.id)}
                            onChange={(e) =>
                              handleItemChange(e, item.id, "taxCode")
                            }
                          />
                          <button
                            type="button"
                            className="grpo-table-lookup-btn"
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
                          className="grpo-add__table-input align-right"
                          readOnly
                        />
                      </td>
                      <td className="readonly-cell total-cell">{item.total}</td>
                      <td className="action-cell">
                        <button
                          type="button"
                          className="grpo-remove-item-btn"
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
                      Click '+ Add Row' to begin or select a Purchase Order to
                      populate items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grpo-summary-container">
            <div className="grpo-summary-item">
              <label>Product Total (ex. Tax):</label>
              <input
                type="text"
                readOnly
                value={productTotalSummary}
                className="grpo-summary-input"
              />
            </div>
            <div className="grpo-summary-item">
              <label>Tax Total:</label>
              <input
                type="text"
                readOnly
                value={taxTotalSummary}
                className="grpo-summary-input"
              />
            </div>
            <div className="grpo-summary-item">
              <label>Net Total:</label>
              <input
                type="text"
                readOnly
                value={grandTotalSummary}
                className="grpo-summary-input"
              />
            </div>
          </div>
        </div>
        <div className="grpo-add-page-footer">
          <button
            className="grpo-footer-btn primary"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Add GRPO"}
          </button>
          <button
            className="grpo-footer-btn secondary"
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
export default GRPOAdd;
