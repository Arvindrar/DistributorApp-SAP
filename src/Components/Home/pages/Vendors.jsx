import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Vendors.css"; // MODIFIED: CSS import
import useDynamicPagination from "../../../hooks/useDynamicPagination"; // Adjust path as needed
import Pagination from "../../Common/Pagination"; // Adjust path as needed

const API_BASE_URL = "https://localhost:7074/api"; // Your API Base URL

function Vendors() {
  // MODIFIED: Component Name
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState([]); // MODIFIED: State name
  const [vendorGroupOptions, setVendorGroupOptions] = useState([]); // MODIFIED: State name

  const [isLoading, setIsLoading] = useState(true); // For vendor list
  const [isLoadingGroups, setIsLoadingGroups] = useState(true); // For vendor groups
  const [error, setError] = useState(null);

  const searchTimeout = useRef(null);
  // --- Pagination Hook ---
  const pagination = useDynamicPagination(vendors, { fixedItemsPerPage: 8 });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const fetchVendorGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const response = await fetch(`${API_BASE_URL}/VendorGroup`); // MODIFIED: API Endpoint
      if (!response.ok) {
        throw new Error(
          `HTTP error fetching vendor groups! status: ${response.status}` // MODIFIED: Text
        );
      }
      const data = await response.json();
      const options = data.map((group) => ({
        value: group.name, // Assuming group object has 'name'
        label: group.name,
      }));
      setVendorGroupOptions(options); // MODIFIED: State setter
    } catch (e) {
      console.error("Failed to fetch vendor groups:", e); // MODIFIED: Log text
      // setError("Failed to load vendor groups. Filtering by group may not work.");
      setVendorGroupOptions([]); // MODIFIED: State setter
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  const fetchVendors = useCallback(async (group, search) => {
    setIsLoading(true);
    setError(null);
    let url = `${API_BASE_URL}/Vendor?`; // MODIFIED: API Endpoint for Vendors
    const params = new URLSearchParams();
    if (group) params.append("group", group); // Param name might need adjustment based on backend
    if (search) params.append("searchTerm", search); // Param name might need adjustment
    url += params.toString();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `HTTP error fetching vendors! status: ${response.status}`; // MODIFIED: Text
        try {
          const errorData = await response.json();
          if (
            errorData?.message ||
            errorData?.title ||
            typeof errorData === "string"
          ) {
            errorMessage = errorData.message || errorData.title || errorData;
          }
        } catch {}
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setVendors(data); // MODIFIED: State setter
    } catch (e) {
      console.error("Failed to fetch vendors:", e); // MODIFIED: Log text
      setError(
        e.message || "Failed to load vendors. Please try again later." // MODIFIED: Error text
      );
      setVendors([]); // MODIFIED: State setter
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendorGroups(); // MODIFIED: Function call
  }, [fetchVendorGroups]); // MODIFIED: Dependency

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchVendors(selectedGroup, searchTerm); // MODIFIED: Function call
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm, selectedGroup, fetchVendors]); // MODIFIED: Dependency

  const handleGroupChange = (event) => {
    setSelectedGroup(event.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleAddClick = () => {
    navigate("/vendor/add"); // MODIFIED: Navigation path
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const handleVendorCodeClick = (e, vendorId) => {
    // MODIFIED: Function name and param
    e.preventDefault();
    // console.log(`Vendor: ${vendorId}`);
    navigate(`/vendor/update/${vendorId}`); // MODIFIED: Navigation path
  };

  const getDisplayAddress = (vendor) => {
    // MODIFIED: Parameter name
    const parts = [
      vendor.address1,
      vendor.address2,
      vendor.street,
      vendor.city,
      vendor.state,
      vendor.postBox,
      vendor.country,
    ];
    return parts.filter(Boolean).join(", ");
  };

  return (
    <div className="vms-page-content">
      {/* MODIFIED: CSS Class */}
      <h1>Vendor Master Data</h1> {/* MODIFIED: Title */}
      <div className="vms-filter-controls-container-inline">
        {/* MODIFIED: CSS Class */}
        <div className="vms-filter-item-inline">
          {/* MODIFIED: CSS Class */}
          <span className="vms-filter-label-inline">Vendor Group:</span>{" "}
          {/* MODIFIED: Text & CSS Class */}
          <select
            name="vendorGroup" // MODIFIED: Name attribute
            className="vms-filter-select-inline" // MODIFIED: CSS Class
            value={selectedGroup}
            onChange={handleGroupChange}
            disabled={isLoadingGroups}
          >
            <option value="">
              {isLoadingGroups ? "Loading groups..." : "All Groups"}
            </option>
            {!isLoadingGroups &&
              vendorGroupOptions.map(
                (
                  option // MODIFIED: Variable name
                ) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )
              )}
          </select>
        </div>
        <div className="vms-filter-item-inline">
          {/* MODIFIED: CSS Class */}
          <span className="vms-filter-label-inline">Search:</span>{" "}
          {/* MODIFIED: CSS Class */}
          <input
            type="text"
            name="vendorSearch" // MODIFIED: Name attribute
            className="vms-filter-input-inline" // MODIFIED: CSS Class
            placeholder="Enter name or code..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoComplete="off"
          />
        </div>
        <div className="vms-add-new-action-group">
          {/* MODIFIED: CSS Class */}
          <span className="vms-add-new-label">Add</span>{" "}
          {/* MODIFIED: CSS Class */}
          <button
            className="vms-add-new-plus-button" // MODIFIED: CSS Class
            onClick={handleAddClick}
            title="Add New Vendor" // MODIFIED: Title text
          >
            +
          </button>
        </div>
      </div>
      {error && (
        <div
          className="vms-error-message" // MODIFIED: CSS Class
          style={{ color: "red", marginTop: "20px" }}
        >
          Error: {error}
        </div>
      )}
      {!error && isLoading && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          Loading vendor data... {/* MODIFIED: Text */}
        </div>
      )}
      {!error && !isLoading && (
        <div className="vms-table-responsive-container">
          {" "}
          {/* MODIFIED: CSS Class */}
          <table className="vms-data-table">
            {" "}
            {/* MODIFIED: CSS Class */}
            <thead>
              <tr>
                <th>Vendor Code</th> {/* MODIFIED: Header Text */}
                <th>Name</th>
                <th>Address</th>
                {/* REMOVED: Route */}
                {/* REMOVED: Sales Employee */}
                <th>Account Balance</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {currentPageData.length > 0 ? ( // MODIFIED: Variable name
                currentPageData.map(
                  (
                    vendor // MODIFIED: Variable name
                  ) => (
                    <tr key={vendor.id}>
                      <td>
                        <a
                          href="#"
                          onClick={
                            (e) => handleVendorCodeClick(e, vendor.id) // MODIFIED: Function call
                          }
                          className="vms-table-data-link" // MODIFIED: CSS Class
                          title="Click to update vendor" // MODIFIED: Title text
                        >
                          {vendor.code}
                        </a>
                      </td>
                      <td>{vendor.name}</td>
                      <td>{getDisplayAddress(vendor)}</td>{" "}
                      {/* MODIFIED: Parameter */}
                      {/* REMOVED: Route data cell */}
                      {/* REMOVED: Sales Employee data cell */}
                      <td>{formatCurrency(vendor.balance)}</td>
                      <td>{vendor.remarks || "N/A"}</td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td colSpan="5" className="vms-no-data-cell">
                    {" "}
                    {/* MODIFIED: colSpan & CSS Class */}
                    No vendors found matching your criteria.{" "}
                    {/* MODIFIED: Text */}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />
    </div>
  );
}

export default Vendors; // MODIFIED: Export name
