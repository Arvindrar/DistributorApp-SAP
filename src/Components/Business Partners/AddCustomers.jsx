// PASTE THIS ENTIRE CODE BLOCK INTO YOUR AddCustomers.jsx FILE

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
//import "./AddCustomers.css"; // Your existing CSS file
import "../../styles/Create.css";
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
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="form-body">
          {/* --- Main Information Section --- */}
          <div className="form-section">
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  Customer Code<span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value="<Auto-generated by SAP>"
                  readOnly
                />
              </div>
              <div className="form-field">
                <label className="form-label">Credit Limit</label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Name<span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Shipping Type<span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  value={formData.shippingTypeName}
                  onClick={() => setIsShippingModalOpen(true)}
                  className="form-input"
                  readOnly
                  placeholder="Select Shipping Type"
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Customer Group<span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  value={formData.groupName}
                  onClick={() => setIsGroupModalOpen(true)}
                  className="form-input"
                  readOnly
                  placeholder="Select group"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Route</label>
                <input
                  type="text"
                  value={formData.routeName}
                  onClick={() => setIsRouteModalOpen(true)}
                  className="form-input"
                  readOnly
                  placeholder="Select route"
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Mail ID<span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  name="mailId"
                  value={formData.mailId}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Sales Employee</label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onClick={() => setIsSalesModalOpen(true)}
                  className="form-input"
                  readOnly
                  placeholder="Select employee"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Contact Number</label>
                <div className="input-group">
                  <span className="input-prefix">+91</span>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="10 digits"
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className="form-textarea"
                />
              </div>
            </div>
          </div>

          {/* --- Address Information Section --- */}
          <div className="form-section">
            <h2 className="form-section-title">Customer Address Information</h2>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Address 1</label>
                <input
                  type="text"
                  name="address1"
                  value={formData.address1}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Street</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Address 2</label>
                <input
                  type="text"
                  name="address2"
                  value={formData.address2}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Post Box</label>
                <input
                  type="text"
                  name="postBox"
                  value={formData.postBox}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">GSTIN</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/customers")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Customer"}
          </button>
        </div>
      </form>

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
