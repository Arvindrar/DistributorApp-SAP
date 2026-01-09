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
    salesEmployeeCode: -1,
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

  // NEW STATE: For Sales Employee Modal
  const [allSalesEmployees, setAllSalesEmployees] = useState([]);
  const [isSalesEmployeeModalOpen, setIsSalesEmployeeModalOpen] =
    useState(false);
  const [salesEmployeeSearchTerm, setSalesEmployeeSearchTerm] = useState("");

  useEffect(() => {
    // Generic fetch function to handle different data types from your API
    const fetchData = async (endpoint, setter) => {
      try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) throw new Error(`Could not load ${endpoint} data.`);
        const data = await response.json();

        // INTELLIGENT DATA HANDLING: This correctly handles both
        // direct arrays `[...]` and OData objects `{ "value": [...] }`.
        if (Array.isArray(data)) {
          setter(data);
        } else {
          setter(data.value || []);
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        showAppModal(`[ERROR] Loading ${endpoint}: ${error.message}`, "error");
      }
    };

    fetchData("Customer?pageSize=1000", setAllCustomers);
    fetchData("SalesEmployee", setAllSalesEmployees); // This line was effectively missing.

    // --- END HIGHLIGHTED FIX ---
  }, []); // The empty array ensures this runs only once when the component mounts.

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

  const openSalesEmployeeModal = () => setIsSalesEmployeeModalOpen(true);

  const handleSelectSalesEmployee = (employee) => {
    setFormData((prev) => ({
      ...prev,
      salesEmployee: employee.name, // Use 'name'
      salesEmployeeCode: employee.code, // Use 'code' or 'id'
    }));
    setIsSalesEmployeeModalOpen(false);
  };

  const handleSelectCustomer = (customer) => {
    const billToAddress =
      customer.BPAddresses?.find((addr) => addr.AddressType === "bo_BillTo") ||
      customer.BPAddresses?.[0];
    const address = billToAddress
      ? [
          billToAddress.Street,
          billToAddress.Block,
          billToAddress.City,
          billToAddress.State,
          billToAddress.Country,
        ]
          .filter(Boolean)
          .join(", ")
      : "No address found";

    setFormData((prev) => ({
      ...prev,
      customerCode: customer.CardCode,
      customerName: customer.CardName,
      shipToAddress: address,
      salesEmployee: customer.SalesPerson?.SalesEmployeeName || "",
    }));
    setIsCustomerModalOpen(false);
    setFormErrors((prev) => ({
      ...prev,
      customerCode: null,
      customerName: null,
    }));
  };

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
      const errorMessages = Object.values(validationErrors).join("\n");
      showAppModal(
        `Please fix the following issues:\n\n${errorMessages}`,
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    // ==========================================================
    // BUILD THE SAP PAYLOAD
    // This structure matches what the SAP Service Layer expects for a Sales Order.
    // ==========================================================
    const sapPayload = {
      CardCode: formData.customerCode,
      DocDate: formData.soDate,
      DocDueDate: formData.deliveryDate,
      Comments: formData.salesRemarks,
      NumAtCard: formData.customerRefNumber,
      SalesPersonCode: formData.salesEmployeeCode,
      DocumentLines: salesItems.map((item) => ({
        ItemCode: item.productCode,
        Quantity: parseFloat(item.quantity) || 0,
        UnitPrice: parseFloat(item.price) || 0,
        WarehouseCode: item.warehouseLocation,
        TaxCode: item.taxCode,
      })),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/SalesOrders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sapPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // The backend now returns detailed error messages directly from SAP
        const errorMessage =
          responseData.message ||
          "An unknown error occurred while creating the sales order.";
        throw new Error(errorMessage);
      }

      const newDocNum = responseData.DocNum; // SAP returns the created document with its number
      showAppModal(
        `Sales Order ${newDocNum} created successfully in SAP!`,
        "success"
      );
    } catch (error) {
      showAppModal(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log(
    "Rendering SalesAdd. Data in allSalesEmployees:",
    allSalesEmployees
  );

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
                    c.CardName.toLowerCase().includes(
                      customerSearchTerm.toLowerCase()
                    ) ||
                    c.CardCode.toLowerCase().includes(
                      customerSearchTerm.toLowerCase()
                    )
                )
                .map((customer) => (
                  <tr
                    key={customer.CardCode}
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <td>{customer.CardCode}</td>
                    <td>{customer.CardName}</td>
                    <td>{customer.BPAddresses?.[0]?.Street || "N/A"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </LookupModal>

      <LookupModal
        isOpen={isSalesEmployeeModalOpen}
        onClose={() => setIsSalesEmployeeModalOpen(false)}
        title="Select Sales Employee"
        searchTerm={salesEmployeeSearchTerm}
        onSearchChange={(e) => setSalesEmployeeSearchTerm(e.target.value)}
      >
        <div className="product-lookup-table-container">
          <table className="product-lookup-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {allSalesEmployees
                .filter((e) =>
                  (e.name?.toLowerCase() ?? "").includes(
                    salesEmployeeSearchTerm.toLowerCase()
                  )
                )
                .map((employee) => (
                  <tr
                    key={employee.id} // Use 'id' for the key
                    onClick={() => handleSelectSalesEmployee(employee)}
                  >
                    <td>{employee.code}</td> {/* Display 'code' */}
                    <td>{employee.name}</td> {/* Display 'name' */}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </LookupModal>

      <div className="detail-page-container">
        {/* <div className="detail-page-header-bar">
          <h1 className="detail-page-main-title">Create Sales Order</h1>
        </div> */}

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
              <div className="input-icon-wrapper">
                <input
                  type="text"
                  id="salesEmployee"
                  value={formData.salesEmployee}
                  className="form-input-styled"
                  readOnly
                  onClick={openSalesEmployeeModal}
                />
                <button
                  type="button"
                  className="header-lookup-indicator internal"
                  onClick={openSalesEmployeeModal}
                >
                  <LookupIcon />
                </button>
              </div>
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
