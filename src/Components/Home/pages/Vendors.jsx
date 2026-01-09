// PASTE THIS ENTIRE CODE BLOCK INTO YOUR Vendors.jsx FILE

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/List.css";
//import "./Vendors.css"; // Your existing CSS file
import Pagination from "../../Common/Pagination"; // Adjust path if needed

const API_BASE_URL = "https://localhost:7074/api";
const ITEMS_PER_PAGE = 8; // Keep page size consistent

function Vendors() {
  const navigate = useNavigate();

  const [selectedGroup, setSelectedGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState([]);
  const [vendorGroups, setVendorGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const searchTimeout = useRef(null);
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  // Fetch Vendor Groups for the dropdown
  useEffect(() => {
    const fetchVendorGroups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/VendorGroup`);
        if (!response.ok) throw new Error("Could not load vendor groups");
        const data = await response.json();
        // SAP provides Code (ID) and Name. We'll use these.
        setVendorGroups(data);
      } catch (e) {
        console.error("Failed to fetch vendor groups:", e);
        setError("Could not load filter data. Please refresh.");
      }
    };
    fetchVendorGroups();
  }, []);

  // Fetch the list of vendors based on filters and page
  const fetchVendors = useCallback(async (group, search, page) => {
    setIsLoading(true);
    setError(null);
    let url = `${API_BASE_URL}/Vendor?`;
    const params = new URLSearchParams();
    if (group) params.append("group", group);
    if (search) params.append("searchTerm", search);
    params.append("pageNumber", page);
    params.append("pageSize", ITEMS_PER_PAGE);
    url += params.toString();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVendors(data.value || []);
      // Use the OData count from SAP for accurate pagination
      setTotalRecords(data["@odata.count"] || 0);
    } catch (e) {
      console.error("Failed to fetch vendors:", e);
      setError(e.message || "Failed to load vendors. Please try again later.");
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      // Trigger fetch when debounced term changes
      fetchVendors(selectedGroup, searchTerm, currentPage);
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm, selectedGroup, currentPage, fetchVendors]);

  const handleGroupChange = (event) => {
    setSelectedGroup(event.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleAddClick = () => navigate("/vendor/add"); // Navigate to add vendor page

  const handleVendorCodeClick = (e, cardCode) => {
    e.preventDefault();
    navigate(`/vendor/update/${cardCode}`);
  };

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", // Adjust currency as needed
    }).format(amount || 0);

  // Re-use the address logic from Customers.jsx, as the structure is the same
  const getDisplayAddress = (vendor) => {
    if (vendor.BPAddresses && vendor.BPAddresses.length > 0) {
      const address =
        vendor.BPAddresses.find((a) => a.AddressType === "bo_BillTo") ||
        vendor.BPAddresses[0];
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
    <div className="page-container">
      {/* CHANGED */}
      {/* <h1 className="page-title">Vendor Master Data</h1>  */}
      <div className="filter-controls">
        {/* CHANGED */}
        <div className="filter-item">
          {/* CHANGED */}
          <label className="form-label">Vendor Group:</label> {/* CHANGED */}
          <select
            name="vendorGroup"
            className="form-select" // CHANGED
            value={selectedGroup}
            onChange={handleGroupChange}
          >
            <option value="">All Groups</option>
            {vendorGroups.map((group) => (
              <option key={group.Code} value={group.Code}>
                {group.Name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          {/* CHANGED */}
          <label className="form-label">Search:</label> {/* CHANGED */}
          <input
            type="text"
            name="vendorSearch"
            className="form-input" // CHANGED
            placeholder="Enter name or code..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoComplete="off"
          />
        </div>
        <div className="filter-item" style={{ marginLeft: "auto" }}>
          {/* CHANGED */}
          <label className="form-label">Add</label> {/* CHANGED */}
          <button
            className="btn btn-icon" // CHANGED
            onClick={handleAddClick}
            title="Add New Vendor"
          >
            +
          </button>
        </div>
      </div>
      {error && (
        <div
          className="error-message"
          style={{ color: "red", marginTop: "20px" }}
        >
          Error: {error}
        </div>
      )}
      {isLoading && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          Loading vendor data from SAP...
        </div>
      )}
      {!error && !isLoading && (
        <div className="table-responsive-container">
          {/* No change needed, name was good */}
          <table className="data-table">
            {/* No change needed, name was good */}
            <thead>
              <tr>
                <th>Vendor Code</th>
                <th>Name</th>
                <th>Address</th>
                <th>Account Balance</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor.CardCode}>
                    <td>
                      <a
                        href="#"
                        onClick={(e) =>
                          handleVendorCodeClick(e, vendor.CardCode)
                        }
                        className="table-link" // CHANGED
                        title="Click to update vendor"
                      >
                        {vendor.CardCode}
                      </a>
                    </td>
                    <td>{vendor.CardName}</td>
                    <td>{getDisplayAddress(vendor)}</td>
                    <td className="text-right">
                      {formatCurrency(vendor.CurrentAccountBalance)}
                    </td>
                    {/* ADDED text-right for currency */}
                    <td>{vendor.Notes || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data-cell">
                    {/* No change needed, name was good */}
                    No vendors found matching your criteria.
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

export default Vendors;
