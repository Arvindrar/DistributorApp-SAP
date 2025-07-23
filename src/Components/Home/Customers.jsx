import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Customers.css";
//import useDynamicPagination from "../../hooks/useDynamicPagination"; // Assuming you have this hook
import Pagination from "../Common/Pagination"; // Assuming you have this component

const API_BASE_URL = "https://localhost:7074/api"; // Your ASP.NET Core API URL
const ITEMS_PER_PAGE = 8;

function Customers() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchTimeout = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  // This fetch logic now talks to your API, which in turn talks to SAP
  const fetchCustomers = useCallback(async (group, search, page) => {
    setIsLoading(true);
    setError(null);
    let url = `${API_BASE_URL}/Customer?`;
    const params = new URLSearchParams();

    // Add search and filter params
    if (group) params.append("group", group);
    if (search) params.append("searchTerm", search);

    // Add pagination params
    params.append("pageNumber", page);
    params.append("pageSize", ITEMS_PER_PAGE);

    url += params.toString();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      const data = await response.json();
      // IMPORTANT: SAP data is nested under a 'value' property
      setCustomers(data.value || []);

      setTotalRecords(data["@odata.count"] || 0);
    } catch (e) {
      console.error("Failed to fetch customers from SAP:", e);
      setError(
        e.message || "Failed to load customers. Please try again later."
      );
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchCustomers(selectedGroup, searchTerm, currentPage);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm, selectedGroup, currentPage, fetchCustomers]);

  const handleGroupChange = (event) => {
    setSelectedGroup(event.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleAddClick = () => {
    navigate("/customers/add");
  };
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR", // Or whatever currency is appropriate
    }).format(amount || 0);
  };

  const handleCustomerCodeClick = (e, cardCode) => {
    e.preventDefault();
    // We navigate using the CardCode now, which is SAP's primary key.
    // This will take you to a future UpdateCustomer page.
    // navigate(`/customers/update/${cardCode}`);
    alert(`Navigate to update page for CardCode: ${cardCode}`); // Placeholder
  };

  // Helper to get the first address from the nested BPAddresses array
  const getDisplayAddress = (customer) => {
    if (customer.BPAddresses && customer.BPAddresses.length > 0) {
      const billToAddress =
        customer.BPAddresses.find((a) => a.AddressType === "bo_BillTo") ||
        customer.BPAddresses[0];
      return [
        billToAddress.Street,
        billToAddress.City,
        billToAddress.State,
        billToAddress.Country,
      ]
        .filter(Boolean)
        .join(", ");
    }
    return "N/A";
  };

  return (
    <div className="page-content">
      <h1>Customer Master Data</h1>
      <div className="filter-controls-container-inline">
        <div className="filter-item-inline">
          <span className="filter-label-inline">Customer Group:</span>
          <select
            name="customerGroup"
            className="filter-select-inline"
            value={selectedGroup}
            onChange={handleGroupChange}
          >
            <option value="">All Groups</option>
            {/* Note: This should be populated from SAP's BusinessPartnerGroups endpoint */}
          </select>
        </div>

        <div className="filter-item-inline">
          <span className="filter-label-inline">Search:</span>
          <input
            type="text"
            name="customerSearch"
            className="filter-input-inline"
            placeholder="Enter name or code..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoComplete="off"
          />
        </div>

        <div className="add-new-action-group">
          <span className="add-new-label">Add</span>
          <button
            className="add-new-plus-button"
            onClick={handleAddClick}
            title="Add New Customer"
          >
            +
          </button>
        </div>
      </div>

      {error && (
        <div
          className="error-message"
          style={{ color: "red", marginTop: "20px", textAlign: "center" }}
        >
          Error: {error}
        </div>
      )}

      {!error && isLoading && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          Loading customer data from SAP...
        </div>
      )}

      {!error && !isLoading && (
        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Code</th>
                <th>Name</th>
                <th>Address</th>
                <th>Route</th>
                <th>Sales Employee</th>
                <th>Account Balance</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {/* UPDATED: Map over the paginated data with NEW SAP field names */}
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.CardCode}>
                    {" "}
                    {/* Use CardCode for the key */}
                    <td>
                      <a
                        href="#"
                        onClick={(e) =>
                          handleCustomerCodeClick(e, customer.CardCode)
                        }
                        className="table-data-link"
                        title="Click to update customer"
                      >
                        {customer.CardCode} {/* SAP Field */}
                      </a>
                    </td>
                    <td>{customer.CardName}</td> {/* SAP Field */}
                    <td>{getDisplayAddress(customer)}</td>
                    <td>{"N/A"}</td>{" "}
                    {/* SAP Field: To be mapped from UDF or Territory */}
                    <td>
                      {customer.SalesPersonCode === -1
                        ? "N/A"
                        : customer.SalesPersonCode}
                    </td>{" "}
                    {/* SAP Field */}
                    <td>
                      {formatCurrency(customer.CurrentAccountBalance)}
                    </td>{" "}
                    {/* SAP Field */}
                    <td>{customer.Notes || "N/A"}</td> {/* SAP Field */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data-cell">
                    No customers found in SAP matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={handleNextPage}
        onPrevious={handlePrevPage}
      />
    </div>
  );
}

export default Customers;
