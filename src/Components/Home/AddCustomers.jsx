// PASTE THIS ENTIRE CODE BLOCK INTO YOUR AddCustomers.jsx FILE

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AddCustomers.css"; // Your existing CSS file
import LookupModal from "../Common/LookupModal"; // The reusable modal component

const API_BASE_URL = "https://localhost:7074/api";

const MessageModal = ({ message, onClose, type = "success" }) => {
  if (!message) return null;
  return (
    <div className="ac-modal-overlay">
      <div className={`ac-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="ac-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

function AddCustomers() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });

  // State for all lookup data
  const [customerGroups, setCustomerGroups] = useState([]);
  const [shippingTypes, setShippingTypes] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [salesEmployees, setSalesEmployees] = useState([]);

  // State for controlling modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  // State for search terms within modals
  const [searchTerms, setSearchTerms] = useState({
    group: "",
    shipping: "",
    route: "",
    sales: "",
  });

  const initialFormData = {
    code: "",
    name: "",
    group: "",
    groupName: "",
    mailId: "",
    contactNumber: "",
    shippingType: "",
    shippingTypeName: "",
    route: "",
    routeName: "",
    employee: "",
    employeeName: "",
    remarks: "",
    address1: "",
    address2: "",
    street: "",
    city: "",
    postBox: "",
    state: "",
    country: "IN",
    gstin: "",
    creditLimit: 0,
  };
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    // ====================================================================
    // THE FIX IS HERE: This function now handles both API response formats
    // ====================================================================
    const fetchData = async (endpoint, setter) => {
      try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) throw new Error(`Could not load ${endpoint} data.`);
        const data = await response.json();

        // INTELLIGENT DATA HANDLING:
        // Check if the response is a direct array (from SQL).
        if (Array.isArray(data)) {
          setter(data);
        }
        // Otherwise, assume it's an OData object (from SAP) and look for the .value property.
        else {
          setter(data.value || []);
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        showModal(error.message, "error");
      }
    };

    fetchData("CustomerGroup", setCustomerGroups);
    fetchData("ShippingType", setShippingTypes);
    fetchData("Route", setRoutes);
    fetchData("SalesEmployee", setSalesEmployees);
  }, []);

  const showModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });
  const closeModal = () => {
    const wasSuccess = modalState.type === "success";
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess) navigate("/customers");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (modalName, value) => {
    setSearchTerms((prev) => ({ ...prev, [modalName]: value }));
  };

  const handleSelectGroup = (group) => {
    setFormData((prev) => ({
      ...prev,
      group: group.id,
      groupName: group.name,
    }));
    setIsGroupModalOpen(false);
  };
  const handleSelectShippingType = (type) => {
    setFormData((prev) => ({
      ...prev,
      shippingType: type.id,
      shippingTypeName: type.name,
    }));
    setIsShippingModalOpen(false);
  };
  const handleSelectRoute = (route) => {
    setFormData((prev) => ({
      ...prev,
      route: route.id,
      routeName: route.name,
    }));
    setIsRouteModalOpen(false);
  };
  const handleSelectSalesEmployee = (employee) => {
    setFormData((prev) => ({
      ...prev,
      employee: employee.id,
      employeeName: employee.SalesEmployeeName,
    }));
    setIsSalesModalOpen(false);
  };

  // In AddCustomers.jsx, replace the handleSave function

  // In AddCustomers.jsx, replace the handleSave function

  // In AddCustomers.jsx, replace the handleSave function

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim() || !formData.group) {
      showModal("Customer Name, and Customer Group are required.", "error");
      return;
    }
    setIsSubmitting(true);

    //const stateValue = formData.state.trim();

    const payload = {
      Series: 138, // This is correct for auto-numbering
      CardName: formData.name.trim(),
      CardType: "cCustomer",
      GroupCode: parseInt(formData.group, 10),
      CreditLimit: parseFloat(formData.creditLimit) || 0,
      SalesPersonCode: formData.employee ? parseInt(formData.employee, 10) : -1,
      ShippingType: formData.shippingType
        ? parseInt(formData.shippingType, 10)
        : null,
      Territory: formData.route ? parseInt(formData.route, 10) : null,
      Notes: formData.remarks.trim(),
      EmailAddress: formData.mailId.trim(),
      Phone1: formData.contactNumber.trim(),
      FederalTaxID: formData.gstin.trim(),
      BPAddresses: [
        {
          AddressName: "Bill To Address",
          AddressType: "bo_BillTo",
          Street: formData.street.trim(),
          Block: formData.address2.trim(), // 'Block' is a valid field
          City: formData.city.trim(),
          //State: stateValue, // <-- FIX: Renamed 'StateCode' to 'State'
          ZipCode: formData.postBox.trim(),
          Country: "IN", // Country code is correct
        },
        {
          AddressName: "Ship To Address",
          AddressType: "bo_ShipTo",
          Street: formData.street.trim(),
          Block: formData.address2.trim(),
          City: formData.city.trim(),
          //State: stateValue,
          ZipCode: formData.postBox.trim(),
          Country: "IN",
        },
      ],
    };
    console.log("--- PAYLOAD BEING SENT TO BACKEND ---");
    console.log(JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${API_BASE_URL}/Customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detailedErrorMessage =
          errorData?.error?.message?.value ||
          errorData.message ||
          `Failed to create customer. Status: ${response.status}`;
        throw new Error(detailedErrorMessage);
      }

      const createdCustomer = await response.json();
      showModal(
        `Customer '${createdCustomer.CardName}' was added successfully!`,
        "success"
      );
    } catch (e) {
      console.error("Error saving customer:", e);
      showModal(e.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="detail-page-container">
        <MessageModal
          message={modalState.message}
          onClose={closeModal}
          type={modalState.type}
        />

        <div className="detail-page-header-bar">
          <h1 className="detail-page-main-title">New Customer</h1>
        </div>

        <div className="customer-info-header">
          {/* --- Column 1 - All original class names restored --- */}
          <div className="customer-info-column">
            <div className="customer-info-field">
              <label htmlFor="code">Customer Code *</label>
              <input
                type="text"
                id="code"
                name="code"
                className="form-input-styled"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="<Auto-generated by SAP>"
                readOnly // <-- Add this property
              />
            </div>
            <div className="customer-info-field">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input-styled"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="customer-info-field">
              <label htmlFor="group">Customer group *</label>
              <input
                type="text"
                id="group"
                className="form-input-styled"
                value={formData.groupName}
                onClick={() => setIsGroupModalOpen(true)}
                readOnly
                placeholder="Select group"
              />
            </div>
            <div className="customer-info-field">
              <label htmlFor="mailId">Mail ID *</label>
              <input
                type="email"
                id="mailId"
                name="mailId"
                className="form-input-styled"
                value={formData.mailId}
                onChange={handleInputChange}
              />
            </div>
            <div className="customer-info-field">
              <label htmlFor="contactNumber">Contact Number</label>
              <div className="compound-input-contact">
                <span className="input-prefix-contact">+91</span>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  className="form-input-styled form-input-contact-suffix"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="10 digits"
                />
              </div>
            </div>
          </div>

          {/* --- Column 2 - All original class names restored --- */}
          <div className="customer-info-column">
            <div className="customer-info-field">
              <label htmlFor="creditLimit">Credit Limit</label>
              <input
                type="number"
                id="creditLimit"
                name="creditLimit"
                className="form-input-styled"
                value={formData.creditLimit}
                onChange={handleInputChange}
              />
            </div>

            <div className="customer-info-field">
              <label htmlFor="shippingType">Shipping Type *</label>
              <input
                type="text"
                id="shippingType"
                className="form-input-styled"
                value={formData.shippingTypeName}
                onClick={() => setIsShippingModalOpen(true)}
                readOnly
                placeholder="Select Shipping Type"
              />
            </div>
            <div className="customer-info-field">
              <label htmlFor="route">Route</label>
              <input
                type="text"
                id="route"
                className="form-input-styled"
                value={formData.routeName}
                onClick={() => setIsRouteModalOpen(true)}
                readOnly
                placeholder="Select route"
              />
            </div>
            <div className="customer-info-field">
              <label htmlFor="employee">Sales Employee</label>
              <input
                type="text"
                id="employee"
                className="form-input-styled"
                value={formData.employeeName}
                onClick={() => setIsSalesModalOpen(true)}
                readOnly
                placeholder="Select employee"
              />
            </div>
            <div className="customer-info-field">
              <label htmlFor="remarks">Remarks</label>
              <textarea
                id="remarks"
                name="remarks"
                className="form-textarea-styled"
                rows={4}
                value={formData.remarks}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* ... Address Info (all original class names restored) ... */}
        <div className="detail-form-content-area">
          <section className="form-section-card">
            <h3 className="form-section-title">Customer Address Information</h3>
            <div className="form-field-group form-field-group-inline">
              <label htmlFor="address1">Address 1</label>
              <input
                type="text"
                id="address1"
                name="address1"
                className="form-input-styled"
                value={formData.address1}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-field-group form-field-group-inline">
              <label htmlFor="address2">Address 2</label>
              <input
                type="text"
                id="address2"
                name="address2"
                className="form-input-styled"
                value={formData.address2}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-field-group form-field-group-inline">
              <label htmlFor="street">Street / Block</label>
              <input
                type="text"
                id="street"
                name="street"
                className="form-input-styled"
                value={formData.street}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-field-group form-field-group-inline">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                className="form-input-styled"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-field-group form-field-group-inline">
              <label htmlFor="postBox">Post Box</label>
              <input
                type="text"
                id="postBox"
                name="postBox"
                className="form-input-styled"
                value={formData.postBox}
                onChange={handleInputChange}
              />
            </div>
            {/* <div className="form-field-group form-field-group-inline">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                className="form-input-styled"
                placeholder="use abbreviation, e.g., 'KA' for Karnataka"
                value={formData.state}
                onChange={handleInputChange}
              />
            </div> */}
          </section>
        </div>

        <div className="detail-page-footer">
          <button
            className="footer-btn primary"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Customer"}
          </button>
          <button
            className="footer-btn secondary"
            onClick={() => navigate("/customers")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* --- RENDER ALL MODALS --- */}
      <LookupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title="Select Customer Group"
        searchTerm={searchTerms.group}
        onSearchChange={(e) => handleSearchChange("group", e.target.value)}
      >
        <table className="lookup-modal-table">
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {customerGroups
              .filter((g) =>
                g.name?.toLowerCase().includes(searchTerms.group.toLowerCase())
              )
              .map((g) => (
                <tr key={g.id} onClick={() => handleSelectGroup(g)}>
                  <td>{g.name}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </LookupModal>

      <LookupModal
        isOpen={isShippingModalOpen}
        onClose={() => setIsShippingModalOpen(false)}
        title="Select Shipping Type"
        searchTerm={searchTerms.shipping}
        onSearchChange={(e) => handleSearchChange("shipping", e.target.value)}
      >
        <table className="lookup-modal-table">
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {shippingTypes
              .filter((s) =>
                s.name
                  ?.toLowerCase()
                  .includes(searchTerms.shipping.toLowerCase())
              )
              .map((s) => (
                <tr key={s.id} onClick={() => handleSelectShippingType(s)}>
                  <td>{s.name}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </LookupModal>

      <LookupModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        title="Select Route"
        searchTerm={searchTerms.route}
        onSearchChange={(e) => handleSearchChange("route", e.target.value)}
      >
        <table className="lookup-modal-table">
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {routes
              .filter((r) =>
                r.name?.toLowerCase().includes(searchTerms.route.toLowerCase())
              )
              .map((r) => (
                <tr key={r.id} onClick={() => handleSelectRoute(r)}>
                  <td>{r.name}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </LookupModal>

      <LookupModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        title="Select Sales Employee"
        searchTerm={searchTerms.sales}
        onSearchChange={(e) => handleSearchChange("sales", e.target.value)}
      >
        <table className="lookup-modal-table">
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {salesEmployees
              // THE FIX: Filter by the correct property 'SalesEmployeeName'
              .filter((e) =>
                e.SalesEmployeeName?.toLowerCase().includes(
                  searchTerms.sales.toLowerCase()
                )
              )
              .map((e) => (
                // Use 'id' or a guaranteed unique key like 'SalesEmployeeCode'
                <tr key={e.id} onClick={() => handleSelectSalesEmployee(e)}>
                  {/* THE FIX: Display the correct property 'SalesEmployeeName' */}
                  <td>{e.SalesEmployeeName}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </LookupModal>
    </>
  );
}

export default AddCustomers;
