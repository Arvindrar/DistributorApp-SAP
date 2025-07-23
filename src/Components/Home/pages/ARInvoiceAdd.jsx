import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ARInvoiceAdd.css"; // The new CSS file we will create
import { API_BASE_URL } from "../../../config"; // Using the path alias

// Import the hook and the shared table component
import { useProductItems } from "../../Common/useProductItems";
import ProductItemsTable from "../../Common/ProductItemsTable";

// --- Reusable Components (can be moved to their own files) ---
const MessageModal = ({ message, onClose, type = "info" }) => {
  if (!message) return null;
  return (
    <div className="ar-inv-add-modal-overlay">
      <div className={`ar-inv-add-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="ar-inv-add-modal-close-button">
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
  if (value === null || value === undefined || value === "") {
    return "0";
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return "0";
  }
  return String(num);
};

function ARInvoiceAdd() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Use the custom hook for all item-related logic
  const {
    items: invoiceItems,
    setItems: setInvoiceItems, // Assuming useProductItems exposes a setter for "copy from"
    handleItemChange,
    handleAddItemRow,
    handleRemoveItem,
    summary,
    renderModals, // The hook provides all lookup modals (Product, UOM, Warehouse, Tax)
    openProductModal,
    openUOMModal,
    openWarehouseModal,
    openTaxModal,
  } = useProductItems();

  const initialFormDataState = {
    arInvoiceNo: "",
    customerCode: "",
    customerName: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    customerRefNumber: "",
    billToAddress: "",
    salesOrderNo: "", // For the 'copy from' feature
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

  // --- State for Customer and Sales Order Lookups ---
  const [allCustomers, setAllCustomers] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [isSOModalOpen, setIsSOModalOpen] = useState(false);
  const [soSearchTerm, setSoSearchTerm] = useState("");
  const [customerSalesOrders, setCustomerSalesOrders] = useState([]);

  // Fetch Customers on component mount
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

  const openCustomerModal = () => {
    setCustomerSearchTerm("");
    setIsCustomerModalOpen(true);
  };

  const openSOModal = async () => {
    // Step 1: Check if a customer has been selected. This part is correct.
    if (!formData.customerCode) {
      showAppModal("Please select a customer first.", "info");
      return;
    }

    setIsSubmitting(true); // Show a loading indicator
    try {
      // Step 2: Fetch ALL sales orders. This is more reliable.
      const response = await fetch(`${API_BASE_URL}/SalesOrders`);
      if (!response.ok) {
        throw new Error("Could not fetch the list of Sales Orders.");
      }

      const allSoData = await response.json();

      // Step 3: Filter the sales orders for the selected customer on the client-side.
      // This is the crucial fix.
      const customerSOs = allSoData.filter(
        (so) =>
          so.customerCode &&
          so.customerCode.trim().toLowerCase() ===
            formData.customerCode.trim().toLowerCase()
      );

      // Step 4: Check if any SOs were found for this customer.
      if (customerSOs.length === 0) {
        showAppModal(
          `No Sales Orders found for customer: ${formData.customerName}`,
          "info"
        );
      } else {
        // SUCCESS: We have orders, now open the modal.
        setCustomerSalesOrders(customerSOs);
        setSoSearchTerm("");
        setIsSOModalOpen(true);
      }
    } catch (error) {
      console.error("Error in openSOModal:", error);
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false); // Hide loading indicator
    }
  };

  const showAppModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeAppModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess)
      navigate("/arinvoice", { state: { refreshInvoices: true } });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSelectCustomer = (customer) => {
    const address = [
      customer.address1,
      customer.address2,
      customer.street,
      customer.city,
    ]
      .filter(Boolean)
      .join(", ");

    // Reset form when a new customer is selected, keeping the date
    setFormData({
      ...initialFormDataState,
      invoiceDate: new Date().toISOString().split("T")[0],
      customerCode: customer.code,
      customerName: customer.name,
      billToAddress: address,
    });
    setInvoiceItems([]); // Clear items when customer changes
    setIsCustomerModalOpen(false);
    setFormErrors({});
  };

  const handleSelectSO = async (so) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/SalesOrders/${so.id}`);
      if (!response.ok)
        throw new Error(`Failed to fetch details for SO #${so.salesOrderNo}`);
      const fullSoDetails = await response.json();

      setFormData((prev) => ({
        ...prev,
        salesOrderNo: fullSoDetails.salesOrderNo,
        customerRefNumber: fullSoDetails.customerRefNumber || "",
        invoiceRemarks: fullSoDetails.salesRemarks || "",
        // You might want to get due date based on customer's payment terms
      }));

      const newInvoiceItems = (fullSoDetails.salesItems || []).map(
        (soItem, index) => ({
          id: Date.now() + index, // New client-side ID
          productCode: soItem.productCode,
          productName: soItem.productName,
          quantity: soItem.quantity,
          uom: soItem.uom,
          price: soItem.price,
          warehouseLocation: soItem.warehouseLocation,
          taxCode: soItem.taxCode || "",
          taxPrice: soItem.taxPrice || 0,
          total: soItem.total || 0,
        })
      );
      // Use the setter from the hook to populate the items table
      setInvoiceItems(newInvoiceItems);
      setIsSOModalOpen(false);
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
    const errors = {};
    if (!formData.customerCode.trim())
      errors.customerCode = "Customer is required.";
    if (!formData.invoiceDate) errors.invoiceDate = "Invoice Date is required.";
    if (!formData.dueDate) errors.dueDate = "Due Date is required.";
    else if (new Date(formData.dueDate) < new Date(formData.invoiceDate)) {
      errors.dueDate = "Due Date cannot be before Invoice Date.";
    }
    if (invoiceItems.length === 0) {
      errors.items = "At least one item must be added.";
    } else {
      // The validation logic for items can be moved inside the useProductItems hook
      // For now, we'll keep it here as in the original example
      invoiceItems.forEach((item) => {
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
    // Append header data
    payload.append("CustomerCode", formData.customerCode);
    payload.append("CustomerName", formData.customerName);
    payload.append("InvoiceDate", formData.invoiceDate);
    payload.append("DueDate", formData.dueDate);
    payload.append("CustomerRefNumber", formData.customerRefNumber);
    payload.append("BillToAddress", formData.billToAddress);
    payload.append("SalesOrderNo", formData.salesOrderNo);
    payload.append("InvoiceRemarks", formData.invoiceRemarks);

    // Append items as JSON string
    const itemsPayload = invoiceItems.map((item) => ({
      ProductCode: item.productCode,
      ProductName: item.productName,
      Quantity: cleanNumber(item.quantity),
      UOM: item.uom,
      Price: cleanNumber(item.price),
      WarehouseLocation: item.warehouseLocation,
      TaxCode: item.taxCode,
      TaxPrice: cleanNumber(item.taxPrice),
      Total: cleanNumber(item.total),
    }));
    payload.append("InvoiceItemsJson", JSON.stringify(itemsPayload));

    // Append files
    formData.uploadedFiles.forEach((file) => {
      payload.append("UploadedFiles", file, file.name);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/ARInvoices`, {
        method: "POST",
        body: payload,
      });
      const responseData = await response.json();
      if (!response.ok)
        throw new Error(
          responseData.message || "Failed to create A/R Invoice."
        );
      showAppModal(responseData.message, "success");
    } catch (error) {
      console.error("Error saving A/R Invoice:", error);
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
      {renderModals()}{" "}
      {/* Renders Product, UOM, Warehouse, Tax modals from the hook */}
      {/* --- Customer Lookup Modal --- */}
      {isCustomerModalOpen && (
        <div className="lookup-modal-overlay">
          <div className="lookup-modal-content">
            <div className="lookup-modal-header">
              <h2>Select Customer</h2>
              <button
                className="lookup-modal-close-btn"
                onClick={() => setIsCustomerModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="lookup-modal-body">
              <input
                type="text"
                placeholder="Search by Code or Name..."
                className="lookup-modal-search-input"
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
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
            </div>
          </div>
        </div>
      )}
      {/* --- Sales Order Lookup Modal --- */}
      {isSOModalOpen && (
        <div className="lookup-modal-overlay">
          <div className="lookup-modal-content">
            <div className="lookup-modal-header">
              <h2>Select Sales Order</h2>
              <button
                className="lookup-modal-close-btn"
                onClick={() => setIsSOModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="lookup-modal-body">
              <input
                type="text"
                placeholder="Search by S.O. Number..."
                className="lookup-modal-search-input"
                value={soSearchTerm}
                onChange={(e) => setSoSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="lookup-modal-table-container">
                <table className="lookup-modal-table">
                  <thead>
                    <tr>
                      <th>S.O. Number</th>
                      <th>S.O. Date</th>
                      <th>Customer Ref No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerSalesOrders
                      .filter((so) =>
                        so.salesOrderNo
                          .toLowerCase()
                          .includes(soSearchTerm.toLowerCase())
                      )
                      .map((so) => (
                        <tr key={so.id} onClick={() => handleSelectSO(so)}>
                          <td>{so.salesOrderNo}</td>
                          <td>{new Date(so.soDate).toLocaleDateString()}</td>
                          <td>{so.customerRefNumber}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="ar-inv-add-page-container">
        <div className="ar-inv-add-page-header-bar">
          <h1 className="ar-inv-add-page-main-title">Create A/R Invoice</h1>
        </div>

        <div className="ar-inv-add__form-header">
          {/* Column 1 */}
          <div className="ar-inv-entry-header-column">
            <div className="ar-inv-entry-header-field">
              <label htmlFor="customerCode">Customer Code:</label>
              <div className="ar-inv-input-with-icon-wrapper">
                <input
                  type="text"
                  id="customerCode"
                  value={formData.customerCode}
                  className="ar-inv-form-input"
                  readOnly
                  onClick={openCustomerModal}
                />
                <button
                  type="button"
                  className="ar-inv-header-lookup-btn"
                  onClick={openCustomerModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="ar-inv-entry-header-field">
              <label htmlFor="customerName">Customer Name:</label>
              <div className="ar-inv-input-with-icon-wrapper">
                <input
                  type="text"
                  id="customerName"
                  value={formData.customerName}
                  className="ar-inv-form-input"
                  readOnly
                  onClick={openCustomerModal}
                />
                <button
                  type="button"
                  className="ar-inv-header-lookup-btn"
                  onClick={openCustomerModal}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="ar-inv-entry-header-field">
              <label htmlFor="salesOrderNo">Based on S.O. #:</label>
              <div className="ar-inv-input-with-icon-wrapper">
                <input
                  type="text"
                  id="salesOrderNo"
                  value={formData.salesOrderNo}
                  className="ar-inv-form-input"
                  readOnly
                  onClick={openSOModal}
                  disabled={!formData.customerCode}
                />
                <button
                  type="button"
                  className="ar-inv-header-lookup-btn"
                  onClick={openSOModal}
                  disabled={!formData.customerCode}
                >
                  <LookupIcon />
                </button>
              </div>
            </div>
            <div className="ar-inv-entry-header-field">
              <label htmlFor="customerRefNumber">Customer Ref No:</label>
              <input
                type="text"
                id="customerRefNumber"
                name="customerRefNumber"
                value={formData.customerRefNumber}
                onChange={handleInputChange}
                className="ar-inv-form-input"
              />
            </div>
            <div className="ar-inv-entry-header-field">
              <label htmlFor="billToAddress">Bill to Address:</label>
              <textarea
                id="billToAddress"
                name="billToAddress"
                value={formData.billToAddress}
                onChange={handleInputChange}
                className="ar-inv-form-textarea"
                rows="2"
                readOnly
              />
            </div>
            <div className="ar-inv-entry-header-field">
              <label htmlFor="invoiceRemarks">Remarks:</label>
              <textarea
                id="invoiceRemarks"
                name="invoiceRemarks"
                value={formData.invoiceRemarks}
                onChange={handleInputChange}
                className="ar-inv-form-textarea"
                rows="2"
              />
            </div>
          </div>
          {/* Column 2 */}
          <div className="ar-inv-entry-header-column">
            <div className="ar-inv-entry-header-field">
              <label htmlFor="arInvoiceNo">Invoice Number:</label>
              <input
                type="text"
                id="arInvoiceNo"
                value={"Generated on save"}
                className="ar-inv-form-input"
                readOnly
                disabled
              />
            </div>
            <div className="ar-inv-entry-header-field">
              <label htmlFor="invoiceDate">Invoice Date:</label>
              <input
                type="date"
                id="invoiceDate"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                className="ar-inv-form-input"
              />
            </div>
            <div className="ar-inv-entry-header-field">
              <label htmlFor="dueDate">Due Date:</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="ar-inv-form-input"
              />
            </div>
            <div className="ar-inv-entry-header-field file-input-area">
              <label htmlFor="uploadFilesInput">Attachment(s):</label>
              <div className="file-input-controls">
                <input
                  type="file"
                  id="uploadFilesInput"
                  ref={fileInputRef}
                  className="ar-inv-file-input-hidden"
                  onChange={handleFileInputChange}
                  multiple
                />
                <button
                  type="button"
                  className="ar-inv-browse-files-btn"
                  onClick={handleBrowseClick}
                >
                  Browse...
                </button>
                {formData.uploadedFiles.length > 0 && (
                  <div className="ar-inv-file-list-display">
                    {formData.uploadedFiles.map((f, i) => (
                      <div key={f.name + i} className="ar-inv-file-entry">
                        <span className="ar-inv-file-name" title={f.name}>
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(f.name)}
                          className="ar-inv-remove-file-btn"
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

        <div className="ar-inv-add-content-area">
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
            // Pass a unique prefix for CSS classes if ProductItemsTable is designed to accept one
            // cssPrefix="ar-inv"
          />
        </div>

        <div className="ar-inv-add-page-footer">
          <button
            className="ar-inv-footer-btn primary"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Add A/R Invoice"}
          </button>
          <button
            className="ar-inv-footer-btn secondary"
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
export default ARInvoiceAdd;
