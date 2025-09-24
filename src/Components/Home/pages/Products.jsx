import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Products.css";
import {
  API_PRODUCTS_ENDPOINT,
  API_PRODUCT_GROUPS_ENDPOINT,
  IMAGES_BASE_URL,
  PLACEHOLDER_IMG_PATH,
} from "../../../config";
import useDynamicPagination from "../../../hooks/useDynamicPagination";
import Pagination from "../../Common/Pagination";

function Products() {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedGroup, setSelectedGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [productGroupOptions, setProductGroupOptions] = useState([]);

  const [isLoading, setIsLoading] = useState(true); // isLoading for product list
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [error, setError] = useState(null);

  const searchTimeoutRef = useRef(null); // Ref for debouncing search
  const pagination = useDynamicPagination(products, {
    fixedItemsPerPage: 12,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const fetchProductGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    // setError(null); // Clear group-specific error if needed
    try {
      const response = await fetch(API_PRODUCT_GROUPS_ENDPOINT);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch product groups: ${response.status} ${errorText}`
        );
      }
      const data = await response.json();
      const options = data.map((group) => ({
        value: group.name,
        label: group.name,
      }));
      setProductGroupOptions(options);
    } catch (e) {
      console.error("Error fetching product groups:", e);
      //setError("Failed to load product groups. Filtering may be affected."); // Optional: set error for groups
      setProductGroupOptions([]);
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  // fetchProducts takes group and search as arguments
  const fetchProducts = useCallback(async (group, search) => {
    setIsLoading(true);
    setError(null); // Clear previous product fetch errors
    let url = `${API_PRODUCTS_ENDPOINT}?`;
    const params = new URLSearchParams();
    if (group) params.append("group", group);
    if (search) params.append("searchTerm", search);
    url += params.toString();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `Failed to fetch products: ${response.status}`;
        try {
          const errorData = await response.json();
          if (
            errorData?.message ||
            errorData?.title ||
            typeof errorData === "string"
          ) {
            errorMessage = errorData.message || errorData.title || errorData;
          }
        } catch (_) {
          /* Ignore if parsing error body fails */
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setProducts(data);
    } catch (e) {
      // Corrected: removed underscore
      console.error("Error fetching products:", e);
      setError(e.message || "Could not load products. Please try again later.");
      setProducts([]); // Clear products on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array: fetchProducts function reference is stable

  useEffect(() => {
    fetchProductGroups();
  }, [fetchProductGroups]);

  useEffect(() => {
    // When filters change, we should always go back to the first page of results.
    setCurrentPage(1);
  }, [selectedGroup, searchTerm, setCurrentPage]);

  // Debounced effect for fetching products based on searchTerm and selectedGroup
  useEffect(() => {
    // This effect handles initial fetch and subsequent filtered fetches
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      // Don't fetch if groups are still loading for the very first load,
      // as fetchProducts might depend on group selection logic not fully ready.
      // However, for subsequent searches, allow it.
      // This condition is a bit tricky; often it's fine to fetch even if groups are still loading
      // if the API handles empty group parameters gracefully.
      // For simplicity here, we assume initial fetch should wait for groups if that's a strict dependency.
      // But for search/filter changes, we proceed.
      // if (!isLoadingGroups || products.length > 0 || selectedGroup || searchTerm) {
      fetchProducts(selectedGroup, searchTerm);
      // }
    }, 400); // Debounce time in milliseconds

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedGroup, fetchProducts]); // fetchProducts is stable

  // Effect for refreshing products based on location state
  useEffect(() => {
    // Check if we were navigated here with a 'newProduct' in the state
    if (location.state && location.state.newProduct) {
      const { newProduct } = location.state;

      // Add the new product to the beginning of our existing products list
      setProducts((prevProducts) => [newProduct, ...prevProducts]);

      // Clear the state from the location so this doesn't run again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleGroupChange = (event) => setSelectedGroup(event.target.value);
  const handleSearchChange = (event) => setSearchTerm(event.target.value);
  const handleAddProductClick = () => navigate("/products/add");

  const formatCurrency = (price1, price2) => {
    const singleFormatter = (amount) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(amount || 0); // Handle null/undefined amount
    const p1 = typeof price1 === "number" ? price1 : null;
    const p2 = typeof price2 === "number" ? price2 : null;
    if (p1 !== null && p2 !== null) {
      return p1 === p2
        ? singleFormatter(p1)
        : `${singleFormatter(Math.min(p1, p2))} - ${singleFormatter(
            Math.max(p1, p2)
          )}`;
    } else if (p1 !== null) return singleFormatter(p1);
    else if (p2 !== null) return singleFormatter(p2);
    return "N/A";
  };

  const getProductImageSrc = (imageFileName) => {
    return imageFileName
      ? `${IMAGES_BASE_URL}/${imageFileName}`
      : PLACEHOLDER_IMG_PATH;
  };

  const handleProductCodeClick = (e, productId) => {
    e.preventDefault();
    navigate(`/products/update/${productId}`);
  };

  // --- Render Logic ---
  let content;
  if (error) {
    content = (
      <div
        className="error-message"
        style={{ color: "red", marginTop: "20px", textAlign: "center" }}
      >
        Error: {error}
      </div>
    );
  } else if (isLoading && products.length === 0) {
    // Show this only for initial load or if filters result in an empty list while loading
    content = (
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        Loading product data...
      </div>
    );
  } else if (!isLoading && products.length === 0) {
    content = (
      <div
        className="products-overview__no-results"
        style={{ marginTop: "20px", textAlign: "center" }}
      >
        <p>No products found matching your criteria.</p>
      </div>
    );
  } else {
    // Products exist or are being updated (isLoading might be true for updates)
    content = (
      <>
        {isLoading &&
          products.length >
            0 /* Show for updates if products already exist */ && (
            <div
              className="loading-indicator"
              style={{ textAlign: "center", margin: "10px 0" }}
            >
              Updating list...
            </div>
          )}
        <div className="products-overview__card-grid">
          {currentPageData.map((product) => (
            <div key={product.id} className="products-overview__product-card">
              <div className="products-overview__card-image-container">
                <img
                  src={getProductImageSrc(product.imageFileName)}
                  alt={product.name}
                  className="products-overview__card-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMG_PATH;
                  }}
                />
              </div>
              <div className="products-overview__card-details">
                <p className="products-overview__card-detail-item">
                  <strong>Code :</strong>
                  <a
                    href={`/products/update/${product.id}`}
                    onClick={(e) => handleProductCodeClick(e, product.id)}
                    className="products-overview__product-code-link"
                    title={`Update ${product.name}`}
                  >
                    {product.sku}
                  </a>
                </p>
                <p className="products-overview__card-detail-item products-overview__card-name">
                  <strong>Name:</strong> {product.name}
                </p>
                {/* <p className="products-overview__card-detail-item">
                  <strong>Group:</strong> {product.group}
                </p> */}
                <p className="products-overview__card-detail-item">
                  <strong>UOM:</strong> {product.uom}
                </p>
                {/* {product.hsn && (
                  <p className="products-overview__card-detail-item">
                    <strong>HSN:</strong> {product.hsn}
                  </p>
                )} */}

                <p className="products-overview__card-detail-item products-overview__card-price">
                  <strong>Retail Price:</strong>{" "}
                  {formatCurrency(product.retailPrice)}
                </p>
                <p className="products-overview__card-detail-item products-overview__card-price">
                  <strong>Wholesale Price:</strong>{" "}
                  {formatCurrency(product.wholesalePrice)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="products-overview__page-content">
      <h1>Products Details</h1>
      <div className="filter-controls-container-inline">
        <div className="products-overview__filter-item">
          <span className="products-overview__filter-label">
            Product group:
          </span>
          <select
            name="productGroup"
            className="products-overview__filter-select"
            value={selectedGroup}
            onChange={handleGroupChange}
            disabled={isLoadingGroups}
          >
            <option value="">
              {isLoadingGroups ? "Loading groups..." : "All Groups"}
            </option>
            {!isLoadingGroups &&
              productGroupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
        <div className="products-overview__filter-item">
          <span className="products-overview__filter-label">Search:</span>
          <input
            type="text"
            name="productSearch"
            className="products-overview__filter-input"
            placeholder="Search by name, SKU, group..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoComplete="off"
          />
        </div>
        <div className="add-new-action-group">
          <span className="add-new-label">Add</span>
          <button
            className="add-new-plus-button"
            onClick={handleAddProductClick}
            title="Add New Product"
          >
            +
          </button>
        </div>
      </div>

      {/* Render the content (error, loading, no results, or product grid) */}
      {content}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />
    </div>
  );
}

export default Products;
