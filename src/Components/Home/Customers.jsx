// PASTE THIS ENTIRE CODE BLOCK INTO YOUR Customers.jsx FILE

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Customers.css";
import Pagination from "../Common/Pagination";

const API_BASE_URL = "https://localhost:7074/api";
const ITEMS_PER_PAGE = 8;

function Customers() {
  const navigate = useNavigate();

  const [selectedGroup, setSelectedGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // --- SPOT THE CHANGE (1/4): Add new state to store all routes ---
  const [routes, setRoutes] = useState([]);
  const [initialDataLoading, setInitialDataLoading] = useState(true);

  const searchTimeout = useRef(null);
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  const fetchCustomers = useCallback(async (group, search, page) => {
    setIsLoading(true);
    setError(null);
    let url = `${API_BASE_URL}/Customer?`;
    const params = new URLSearchParams();
    if (group) params.append("group", group);
    if (search) params.append("searchTerm", search);
    params.append("pageNumber", page);
    params.append("pageSize", ITEMS_PER_PAGE);
    url += params.toString();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (jsonError) {
          console.warn("Could not parse error response JSON:", jsonError);
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setCustomers(data.value || []);
      setTotalRecords(data["@odata.count"] || 0);
    } catch (e) {
      console.error("Failed to fetch customers:", e);
      setError(
        e.message || "Failed to load customers. Please try again later."
      );
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- SPOT THE CHANGE (2/4): Fetch initial dropdown data in one place ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialDataLoading(true);
      try {
        const [groupsResponse, routesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/CustomerGroup`),
          fetch(`${API_BASE_URL}/Route`),
        ]);

        if (!groupsResponse.ok)
          throw new Error("Could not load customer groups");
        if (!routesResponse.ok) throw new Error("Could not load routes");

        const groupsData = await groupsResponse.json();
        const routesData = await routesResponse.json();

        setCustomerGroups(groupsData);
        setRoutes(routesData.value || []);
      } catch (e) {
        console.error("Failed to fetch initial data:", e);
        setError("Could not load filter data. Please refresh.");
      } finally {
        setInitialDataLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm]);

  // Only fetch customers after the initial data (like routes) has loaded
  useEffect(() => {
    if (!initialDataLoading) {
      fetchCustomers(selectedGroup, debouncedSearchTerm, currentPage);
    }
  }, [
    debouncedSearchTerm,
    selectedGroup,
    currentPage,
    fetchCustomers,
    initialDataLoading,
  ]);

  // --- SPOT THE CHANGE (3/4): New helper function to match Route ID to Name ---
  const getRouteNameById = (territoryId) => {
    if (!territoryId || routes.length === 0) {
      return "N/A";
    }
    const route = routes.find((r) => r.id === territoryId);
    return route ? route.name : "N/A";
  };

  const handleGroupChange = (event) => {
    setSelectedGroup(event.target.value);
    setCurrentPage(1);
  };
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  const handleAddClick = () => navigate("/customers/add");
  const handleCustomerCodeClick = (e, cardCode) => {
    e.preventDefault();
    alert(`Navigate to update page for CardCode: ${cardCode}`);
  };
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  const getDisplayAddress = (customer) => {
    if (customer.BPAddresses && customer.BPAddresses.length > 0) {
      const address =
        customer.BPAddresses.find((a) => a.AddressType === "bo_BillTo") ||
        customer.BPAddresses.find((a) => a.AddressType === "bo_ShipTo") ||
        customer.BPAddresses[0];
      return [
        address.Street,
        address.City,
        address.State,
        address.Country,
        address.ZipCode,
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
        {/* ... (Filter controls are fine) ... */}
        <div className="filter-item-inline">
          <span className="filter-label-inline">Customer Group:</span>
          <select
            name="customerGroup"
            className="filter-select-inline"
            value={selectedGroup}
            onChange={handleGroupChange}
          >
            <option value="">All Groups</option>
            {customerGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
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
      {(isLoading || initialDataLoading) && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          Loading customer data from SAP...
        </div>
      )}

      {!error && !isLoading && !initialDataLoading && (
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
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.CardCode}>
                    <td>
                      <a
                        href="#"
                        onClick={(e) =>
                          handleCustomerCodeClick(e, customer.CardCode)
                        }
                        className="table-data-link"
                        title="Click to update customer"
                      >
                        {customer.CardCode}
                      </a>
                    </td>
                    <td>{customer.CardName}</td>
                    <td>{getDisplayAddress(customer)}</td>

                    {/* --- SPOT THE CHANGE (4/4): Use the new helper function to display the name --- */}
                    <td>{getRouteNameById(customer.Territory)}</td>

                    <td>{customer.SalesPerson?.SalesEmployeeName || "N/A"}</td>
                    <td>{formatCurrency(customer.CurrentAccountBalance)}</td>
                    <td>{customer.Notes || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data-cell">
                    No customers found matching your criteria.
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
