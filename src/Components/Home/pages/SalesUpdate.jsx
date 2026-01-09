import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./SalesUpdate.css"; // CRITICAL: Ensure SalesUpdate.css has ALL necessary styles
import {
  API_PRODUCTS_ENDPOINT,
  API_BASE_URL,
  API_UOM_ENDPOINT,
  API_WAREHOUSE_ENDPOINT,
} from "../../../config";

// --- Reusable Message Modal Component (prefixed for this page) ---
const MessageModal = ({ message, onClose, type = "info" }) => {
  if (!message) return null;
  return (
    <div className="so-update-modal-overlay">
      <div className={`so-update-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="so-update-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

// --- Icons (can be shared or page-specific) ---
const LookupIcon = () => (
  <span className="so-update__lookup-indicator-icon" title="Lookup value">
    ○
  </span>
);
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className="bi bi-trash" // Standard Bootstrap icon class, can be kept or prefixed
    viewBox="0 0 16 16"
    title="Remove Item"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

function SalesUpdate() {
  const navigate = useNavigate();
  const { soId } = useParams(); // Get Sales Order ID from URL
  const fileInputRef = useRef(null);
  const customerCodeInputRef = useRef(null);
  const customerNameInputRef = useRef(null);

  const initialFormDataState = {
    salesOrderNo: "", // Will be populated from fetched data, possibly read-only
    customerCode: "",
    customerName: "",
    soDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    customerRefNumber: "",
    shipToAddress: "",
    salesRemarks: "",
    salesEmployee: "",
    //uploadedFiles: [], // For NEW files added during update
  };
  const [formData, setFormData] = useState(initialFormDataState);

  // item.id here is the client-side unique ID for React keys and UI manipulation
  // item.dbId will store the actual database ID for existing items
  const initialEmptyItem = (clientSideId) => ({
    id: clientSideId, // Temporary client-side ID
    dbId: null, // Will hold actual DB ID for existing items, null/0 for new
    productCode: "",
    productName: "",
    quantity: "1",
    uom: "",
    price: "",
    warehouseLocation: "",
    taxCode: "",
    taxPrice: "0.00",
    total: "0.00",
    //showTaxLookup: false,
    isNew: true, // Flag to identify items added in the UI during this session
  });
  const [salesItems, setSalesItems] = useState([]); // Will be populated

  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [formErrors, setFormErrors] = useState({});

  const [isLoadingData, setIsLoadingData] = useState(true); // For initial SO data load
  const [pageError, setPageError] = useState(null); // For errors during SO data load

  const [existingFiles, setExistingFiles] = useState([]); // Store files fetched from backend
  const [fileIdsToDelete, setFileIdsToDelete] = useState([]); // Store IDs of existing files to remove

  // --- States for Lookups (Products, Customers, Tax Codes) ---
  const [allProducts, setAllProducts] = useState([]);
  const [isLoadingAllProducts, setIsLoadingAllProducts] = useState(true); // Start true
  const [allProductsError, setAllProductsError] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalTargetItemId, setModalTargetItemId] = useState(null); // client-side ID of item being edited
  const [searchTermModal, setSearchTermModal] = useState("");

  const [allCustomers, setAllCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true); // Start true
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerSuggestionsForCode, setShowCustomerSuggestionsForCode] =
    useState(false);
  const [showCustomerSuggestionsForName, setShowCustomerSuggestionsForName] =
    useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const [activeTaxCodes, setActiveTaxCodes] = useState([]);
  const [isLoadingTaxCodes, setIsLoadingTaxCodes] = useState(true); // Start true
  const [taxCodesError, setTaxCodesError] = useState(null);
  const [isTaxLookupModalOpen, setIsTaxLookupModalOpen] = useState(false);
  const [taxLookupTargetItemId, setTaxLookupTargetItemId] = useState(null); // client-side ID
  const [searchTermTaxLookupModal, setSearchTermTaxLookupModal] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [searchTermCustomerModal, setSearchTermCustomerModal] = useState("");
  const [allUOMs, setAllUOMs] = useState([]);
  const [isLoadingUOMs, setIsLoadingUOMs] = useState(true); // Start true, fetch with other lookups
  const [uomsError, setUOMsError] = useState(null);
  const [isUOMLookupModalOpen, setIsUOMLookupModalOpen] = useState(false);
  const [uomLookupTargetItemId, setUOMLookupTargetItemId] = useState(null); // client-side ID of the item row
  const [searchTermUOMLookupModal, setSearchTermUOMLookupModal] = useState("");

  const [allWarehouses, setAllWarehouses] = useState([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true); // Start true
  const [warehousesError, setWarehousesError] = useState(null);
  const [isWarehouseLookupModalOpen, setIsWarehouseLookupModalOpen] =
    useState(false);
  const [warehouseLookupTargetItemId, setWarehouseLookupTargetItemId] =
    useState(null); // client-side ID
  const [searchTermWarehouseLookupModal, setSearchTermWarehouseLookupModal] =
    useState("");
  const [originalSalesItems, setOriginalSalesItems] = useState([]);
  const [allSalesEmployees, setAllSalesEmployees] = useState([]);

  const showAppModal = (message, type = "info") =>
    setModalState({ message, type, isActive: true });

  const closeAppModal = () => {
    const wasSuccess =
      modalState.type === "success" &&
      modalState.message.toLowerCase().includes("successfully");
    setModalState({ message: "", type: "info", isActive: false });
    if (wasSuccess) {
      navigate("/salesorder", { state: { refreshSalesOrders: true } });
    }
  };

  // --- Fetch Callbacks for Dropdowns/Lookups ---
  const fetchAllProductsForModal = useCallback(async () => {
    setIsLoadingAllProducts(true);
    setAllProductsError(null);
    try {
      const response = await fetch(API_PRODUCTS_ENDPOINT);
      if (!response.ok)
        throw new Error(
          `Products API Error: ${response.statusText} (${response.status})`
        );
      const data = await response.json();
      setAllProducts(data);
    } catch (error) {
      console.error("Error fetching products for modal:", error);
      setAllProductsError(error.message);
    } finally {
      setIsLoadingAllProducts(false);
    }
  }, []);

  const fetchAllCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Customer`);
      if (!response.ok)
        throw new Error(
          `Customers API Error: ${response.statusText} (${response.status})`
        );
      const data = await response.json();
      setAllCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      showAppModal(`Error loading customers: ${error.message}`, "error");
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []); // Removed showAppModal from deps

  const fetchActiveTaxCodes = useCallback(async () => {
    setIsLoadingTaxCodes(true);
    setTaxCodesError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/TaxDeclarations`);
      if (!response.ok)
        throw new Error(
          `Tax Codes API Error: ${response.statusText} (${response.status})`
        );
      const allTaxData = await response.json();
      setActiveTaxCodes(
        allTaxData
          .filter((tax) => tax.isActive)
          .map((tax) => ({
            id: tax.id,
            taxCode: tax.taxCode,
            taxDescription: tax.taxDescription,
            cgst: tax.cgst,
            sgst: tax.sgst,
            igst: tax.igst,
            totalPercentage: tax.totalPercentage,
          }))
      );
    } catch (error) {
      console.error("Error fetching active tax codes:", error);
      setTaxCodesError(error.message);
      showAppModal(`Error loading tax codes: ${error.message}`, "error");
    } finally {
      setIsLoadingTaxCodes(false);
    }
  }, []); // Removed showAppModal from deps

  const fetchAllUOMs = useCallback(async () => {
    setIsLoadingUOMs(true);
    setUOMsError(null);
    try {
      const response = await fetch(API_UOM_ENDPOINT);
      if (!response.ok) {
        throw new Error(
          `UOMs API Error: ${response.statusText} (${response.status})`
        );
      }
      const data = await response.json();
      setAllUOMs(data.map((uom) => ({ id: uom.id, name: uom.name }))); // Adjust if your DTO differs
    } catch (error) {
      console.error("Error fetching UOMs for update page:", error);
      setUOMsError(error.message);
      // Optionally show an app modal for this error if critical for page function
      // showAppModal(`Error loading UOMs: ${error.message}`, "error");
    } finally {
      setIsLoadingUOMs(false);
    }
  }, []); // API_UOM_ENDPOINT is constant

  const fetchAllWarehouses = useCallback(async () => {
    setIsLoadingWarehouses(true);
    setWarehousesError(null);
    try {
      const response = await fetch(API_WAREHOUSE_ENDPOINT);
      if (!response.ok) {
        throw new Error(
          `Warehouses API Error: ${response.statusText} (${response.status})`
        );
      }
      const data = await response.json();
      setAllWarehouses(
        data.map((wh) => ({
          id: wh.id,
          code: wh.code,
          name: wh.name,
          address: wh.address,
        }))
      );
    } catch (error) {
      console.error("Error fetching warehouses for update page:", error);
      setWarehousesError(error.message);
      // showAppModal(`Error loading warehouses: ${error.message}`, "error"); // Optional
    } finally {
      setIsLoadingWarehouses(false);
    }
  }, []);
  // --- useEffect to Fetch Sales Order Data for Update AND dependent lookups ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/SalesEmployee`); // Ensure this endpoint is correct
        if (res.ok) {
          const data = await res.json();
          // Handle both OData {value: []} and direct array [] formats
          setAllSalesEmployees(Array.isArray(data) ? data : data.value || []);
        }
      } catch (e) {
        console.error("Failed to load employees", e);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!soId) {
      setPageError("Sales Order ID not found in URL.");
      setIsLoadingData(false);
      return;
    }

    const fetchOrderAndDependencies = async () => {
      setIsLoadingData(true);
      setPageError(null);
      try {
        // Fetch lookups first or in parallel if desired and independent
        await Promise.all([
          fetchAllProductsForModal(),
          fetchAllCustomers(),
          fetchActiveTaxCodes(),
          fetchAllUOMs(), // Fetch UOMs for the update page
          fetchAllWarehouses(),
        ]);
        // Then fetch the main sales order data
        const response = await fetch(`${API_BASE_URL}/SalesOrders/${soId}`);

        if (!response.ok) {
          if (response.status === 404)
            throw new Error("Sales Order not found.");
          const errorData = await response.text();
          throw new Error(
            `HTTP error fetching sales order: ${response.status} - ${errorData}`
          );
        }
        const data = await response.json();
        console.log("✅ Full API Response:", data);

        let slpName = "";
        if (data.SalesPersonCode > 0 && allSalesEmployees.length > 0) {
          const emp = allSalesEmployees.find(
            (e) =>
              e.code === data.SalesPersonCode || e.id === data.SalesPersonCode
          );
          if (emp) slpName = emp.name;
        } else {
          // Fallback if list not loaded yet or not found
          slpName = data.SalesPersonCode || "";
        }

        setFormData({
          salesOrderNo: data.DocNum || "",
          customerCode: data.CardCode || "",
          customerName: data.CardName || "",
          soDate: data.DocDate
            ? new Date(data.DocDate).toISOString().split("T")[0]
            : "",
          deliveryDate: data.DocDueDate
            ? new Date(data.DocDueDate).toISOString().split("T")[0]
            : "",
          customerRefNumber: data.NumAtCard || "",
          shipToAddress: data.Address2 || "", // Address2 is typically the Ship To address
          salesRemarks: data.Comments || "",
          salesEmployeeCode: data.SalesPersonCode || -1,
          salesEmployee: slpName, // Set the NAME here
          //uploadedFiles: [],
        });

        // Backend returns items in `salesItems` (as per previous successful debug)
        // ✅ Correct usage based on your backend response:
        if (Array.isArray(data.DocumentLines)) {
          const fetchedItems = data.DocumentLines.map((item) => {
            // Precise Calculation
            const qty = parseFloat(item.Quantity) || 0;
            const price = parseFloat(item.UnitPrice) || 0;
            const tax = parseFloat(item.TaxTotal) || 0;
            // Total = (Qty * Price) + Tax
            const lineTotal = qty * price + tax;

            return {
              id: Date.now() + item.LineNum, // Unique key
              sapLineNum: item.LineNum, // Keep track of SAP Line Number
              productCode: item.ItemCode || "",
              productName: item.ItemDescription || "",
              quantity: qty,
              uom: item.UoMCode || "",
              price: price,
              warehouseLocation: item.WarehouseCode || "",
              taxCode: item.TaxCode || "",
              // Map calculated values for display
              taxPrice: tax.toFixed(2),
              total: lineTotal.toFixed(2),
              isNew: false,
            };
          });
          setSalesItems(fetchedItems);
          setOriginalSalesItems(JSON.parse(JSON.stringify(fetchedItems)));
        } else {
          setSalesItems([]);
        }

        setExistingFiles(data.attachments || []);
        setFileIdsToDelete([]);
      } catch (error) {
        console.error(
          "Failed to fetch sales order data or dependencies:",
          error
        );
        setPageError(error.message);
        showAppModal(`Error: ${error.message}`, "error");
      } finally {
        setIsLoadingData(false);
      }
    };
    if (allSalesEmployees.length > 0 || !isLoadingData) {
      fetchOrderAndDependencies();
    }
  }, [
    soId,
    fetchAllProductsForModal,
    fetchAllCustomers,
    fetchActiveTaxCodes,
    fetchAllUOMs,
    fetchAllWarehouses,
    allSalesEmployees,
  ]); // Add fetch callbacks to dependency array

  // --- Input Handlers (Header, Items, Files) ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));

    const searchTerm = value.trim().toLowerCase();
    if (name === "customerCode") {
      if (searchTerm) {
        const f = allCustomers.filter((c) =>
          c.code?.toLowerCase().includes(searchTerm)
        );
        setCustomerSuggestions(f);
        setShowCustomerSuggestionsForCode(f.length > 0);
        setShowCustomerSuggestionsForName(false);
      } else setShowCustomerSuggestionsForCode(false);
      setActiveSuggestionIndex(0);
    } else if (name === "customerName") {
      if (searchTerm) {
        const f = allCustomers.filter((c) =>
          c.name?.toLowerCase().includes(searchTerm)
        );
        setCustomerSuggestions(f);
        setShowCustomerSuggestionsForName(f.length > 0);
        setShowCustomerSuggestionsForCode(false);
      } else setShowCustomerSuggestionsForName(false);
      setActiveSuggestionIndex(0);
    }
  };

  const handleCustomerSuggestionClick = (customer) => {
    const addressParts = [
      customer.address1,
      customer.address2,
      customer.street,
      customer.city,
      customer.state,
      customer.postBox,
      customer.country,
    ];
    setFormData((prev) => ({
      ...prev,
      customerCode: customer.code || "",
      customerName: customer.name || "",
      shipToAddress: addressParts.filter(Boolean).join(", "),
      salesEmployee: customer.employee || "",
    }));
    setCustomerSuggestions([]);
    setShowCustomerSuggestionsForCode(false);
    setShowCustomerSuggestionsForName(false);
    setFormErrors((prev) => ({
      ...prev,
      customerCode: null,
      customerName: null,
    }));
  };

  const handleCustomerKeyDown = (e) => {
    const currentSuggestionsOpen =
      showCustomerSuggestionsForCode || showCustomerSuggestionsForName;
    if (currentSuggestionsOpen && customerSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev === customerSuggestions.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev === 0 ? customerSuggestions.length - 1 : prev - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (customerSuggestions[activeSuggestionIndex])
          handleCustomerSuggestionClick(
            customerSuggestions[activeSuggestionIndex]
          );
      } else if (e.key === "Escape") {
        setShowCustomerSuggestionsForCode(false);
        setShowCustomerSuggestionsForName(false);
      }
    }
  };

  useEffect(() => {
    // Effect for closing customer suggestions on outside click
    const handleClickOutside = (event) => {
      const isOutsideCode =
        customerCodeInputRef.current &&
        !customerCodeInputRef.current.contains(event.target) &&
        !event.target.closest(".so-update__customer-suggestions-list-code");
      const isOutsideName =
        customerNameInputRef.current &&
        !customerNameInputRef.current.contains(event.target) &&
        !event.target.closest(".so-update__customer-suggestions-list-name");
      if (isOutsideCode) setShowCustomerSuggestionsForCode(false);
      if (isOutsideName) setShowCustomerSuggestionsForName(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // const handleFileInputChange = (e) => {
  //   const files = Array.from(e.target.files);
  //   if (files.length > 0) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       uploadedFiles: [
  //         ...prev.uploadedFiles,
  //         ...files.filter(
  //           (file) =>
  //             !prev.uploadedFiles.some(
  //               (ef) => ef.name === file.name && ef.size === file.size
  //             )
  //         ),
  //       ],
  //     }));
  //   }
  //   if (fileInputRef.current) fileInputRef.current.value = "";
  // };

  // const handleRemoveNewFile = (fileNameToRemove) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     uploadedFiles: prev.uploadedFiles.filter(
  //       (file) => file.name !== fileNameToRemove
  //     ),
  //   }));
  // };

  // const handleRemoveExistingFile = (fileIdToRemove) => {
  //   setExistingFiles((prev) => prev.filter((f) => f.id !== fileIdToRemove)); // Remove from display
  //   setFileIdsToDelete((prev) => [...new Set([...prev, fileIdToRemove])]); // Add to removal list, ensure unique
  // };

  // const handleBrowseClick = () => {
  //   if (fileInputRef.current) fileInputRef.current.click();
  // };

  // --- Item Calculation and Manipulation ---
  const calculateItemTotal = useCallback((itemId) => {
    // itemId is client-side ID
    setSalesItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const qty = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const tax = parseFloat(item.taxPrice) || 0;
          return { ...item, total: (qty * price + tax).toFixed(2) };
        }
        return item;
      })
    );
  }, []);

  const updateItemTaxAndTotal = useCallback(
    (itemIdToUpdate) => {
      // itemIdToUpdate is client-side ID
      setSalesItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === itemIdToUpdate) {
            let calculatedTaxPrice = 0;
            const quantity = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.price) || 0;
            const baseAmount = quantity * price;

            if (item.taxCode && price > 0 && quantity > 0) {
              const selectedTax = activeTaxCodes.find(
                (tc) => tc.taxCode === item.taxCode
              );
              if (
                selectedTax &&
                selectedTax.totalPercentage !== null &&
                selectedTax.totalPercentage !== undefined
              ) {
                calculatedTaxPrice =
                  baseAmount * (parseFloat(selectedTax.totalPercentage) / 100);
              }
            }
            const newTotal = baseAmount + calculatedTaxPrice;
            return {
              ...item,
              taxPrice: calculatedTaxPrice.toFixed(2),
              total: newTotal.toFixed(2),
            };
          }
          return item;
        })
      );
    },
    [activeTaxCodes]
  ); // Dependency on activeTaxCodes

  const handleItemChange = (e, itemId, fieldName) => {
    // itemId is client-side ID
    const { value } = e.target;
    setSalesItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, [fieldName]: value } : item
      )
    );
    if (formErrors[`item_${itemId}_${fieldName}`]) {
      setFormErrors((prev) => ({
        ...prev,
        [`item_${itemId}_${fieldName}`]: null,
      }));
    }

    if (
      fieldName === "quantity" ||
      fieldName === "price" ||
      fieldName === "taxCode"
    ) {
      setTimeout(() => updateItemTaxAndTotal(itemId), 0); // Use client-side ID
    } else if (fieldName === "taxPrice") {
      setTimeout(() => calculateItemTotal(itemId), 0); // Use client-side ID
    }
  };

  const handleRemoveSalesItem = (itemIdToRemove) => {
    // itemIdToRemove is client-side ID
    // If the item has a dbId, it means it was an existing item.
    // We should add its dbId to a list of items to be deleted on the backend,
    // instead of just removing it from the UI state directly if you want true DB deletes.
    // For this example, we'll just remove from UI. Backend update logic needs to handle this.
    // A more robust way is to have a `markedForDeletion` flag on items.
    const itemToRemove = salesItems.find((item) => item.id === itemIdToRemove);
    if (itemToRemove && itemToRemove.dbId) {
      // If you had a separate list for items to delete by DB ID:
      // setItemDbIdsToDelete(prev => [...new Set([...prev, itemToRemove.dbId])]);
      console.log(
        "Marking item with DB ID for deletion (conceptual):",
        itemToRemove.dbId
      );
    }
    setSalesItems((prevItems) =>
      prevItems.filter((item) => item.id !== itemIdToRemove)
    );
  };

  const handleAddItemRow = () => {
    setSalesItems((prevItems) => [
      ...prevItems,
      initialEmptyItem(Date.now() + prevItems.length),
    ]);
  };

  // --- Lookup Modal Handlers ---
  const openProductLookupModal = (itemId) => {
    // itemId is client-side ID
    setModalTargetItemId(itemId);
    setSearchTermModal("");
    setIsProductModalOpen(true);
  };

  const handleSelectProductFromModal = (product) => {
    if (modalTargetItemId === null) return; // modalTargetItemId is client-side ID
    setSalesItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === modalTargetItemId) {
          // Compare with client-side ID
          return {
            ...item,
            productCode: product.sku || "",
            productName: product.name || "",
            uom: product.uom || "",
            price: product.retailPrice?.toString() ?? "0.00",
          };
        }
        return item;
      })
    );
    setTimeout(() => updateItemTaxAndTotal(modalTargetItemId), 0); // Use client-side ID
    setIsProductModalOpen(false);
    setModalTargetItemId(null);
  };

  const openTaxLookupModal = (itemId) => {
    // itemId is client-side ID
    setTaxLookupTargetItemId(itemId);
    setSearchTermTaxLookupModal("");
    setIsTaxLookupModalOpen(true);
  };

  const handleSelectTaxCodeFromModal = (tax) => {
    if (taxLookupTargetItemId === null) return; // taxLookupTargetItemId is client-side ID
    setSalesItems((prevItems) =>
      prevItems.map(
        (item) =>
          item.id === taxLookupTargetItemId
            ? { ...item, taxCode: tax.taxCode }
            : item // Compare with client-side ID
      )
    );
    setTimeout(() => updateItemTaxAndTotal(taxLookupTargetItemId), 0); // Use client-side ID
    setIsTaxLookupModalOpen(false);
    setTaxLookupTargetItemId(null);
  };

  const openCustomerLookupModal = () => {
    setSearchTermCustomerModal(""); // Clear previous search
    setIsCustomerModalOpen(true);
    // Optionally close existing text-based suggestions if they are open
    setShowCustomerSuggestionsForCode(false);
    setShowCustomerSuggestionsForName(false);
  };

  const handleSelectCustomerFromModal = (customer) => {
    const addressParts = [
      customer.address1,
      customer.address2,
      customer.street,
      customer.city,
      customer.state,
      customer.postBox,
      customer.country,
    ];
    const displayAddress = addressParts.filter(Boolean).join(", ");

    setFormData((prev) => ({
      ...prev,
      customerCode: customer.code || "",
      customerName: customer.name || "",
      shipToAddress: displayAddress,
      salesEmployee: customer.employee || "",
    }));
    setFormErrors((prev) => ({
      // Clear potential errors after selection
      ...prev,
      customerCode: null,
      customerName: null,
    }));
    setIsCustomerModalOpen(false);
  };

  const openUOMLookupModal = (itemId) => {
    // itemId is client-side ID
    setUOMLookupTargetItemId(itemId);
    setSearchTermUOMLookupModal("");
    setIsUOMLookupModalOpen(true);
  };

  const handleSelectUOMFromModal = (selectedUOM) => {
    // selectedUOM is an object like { id: ..., name: ... }
    if (uomLookupTargetItemId === null) return;

    setSalesItems((prevItems) =>
      prevItems.map((item) =>
        item.id === uomLookupTargetItemId
          ? { ...item, uom: selectedUOM.name } // Update UOM field
          : item
      )
    );

    setIsUOMLookupModalOpen(false);
    setUOMLookupTargetItemId(null);
  };

  const openWarehouseLookupModal = (itemId) => {
    // itemId is client-side ID
    setWarehouseLookupTargetItemId(itemId);
    setSearchTermWarehouseLookupModal("");
    setIsWarehouseLookupModalOpen(true);
  };

  const handleSelectWarehouseFromModal = (selectedWarehouse) => {
    if (warehouseLookupTargetItemId === null) return;

    setSalesItems((prevItems) =>
      prevItems.map((item) =>
        item.id === warehouseLookupTargetItemId
          ? { ...item, warehouseLocation: selectedWarehouse.code } // Populate with warehouse code
          : item
      )
    );
    setIsWarehouseLookupModalOpen(false);
    setWarehouseLookupTargetItemId(null);
  };

  // --- Validation ---
  // PLACEMENT: In SalesUpdate.jsx, replace the entire validateForm function with this one.

  const validateForm = () => {
    // A fresh errors object for this validation run.
    const errors = {};

    // --- Validate header fields ---
    if (!formData.customerCode.trim()) {
      errors.customerCode = "Customer Code is required.";
    }
    if (!formData.customerName.trim()) {
      errors.customerName = "Customer Name is required.";
    }
    if (!formData.soDate) {
      errors.soDate = "S.O Date is required.";
    }
    // This field was missing from your provided validation, adding it back
    // to ensure consistency with your request.
    if (!formData.deliveryDate) {
      errors.deliveryDate = "Delivery Date is required.";
    } else if (isNaN(new Date(formData.deliveryDate).getTime())) {
      errors.deliveryDate = "Invalid Delivery Date format.";
    } else if (
      formData.soDate &&
      new Date(formData.deliveryDate) < new Date(formData.soDate)
    ) {
      // This block only runs if both dates are valid and delivery date is before S.O. date
      errors.deliveryDate = "Delivery Date cannot be before the S.O. Date.";
    }

    // --- Validate sales items ---
    if (salesItems.length === 0) {
      errors.salesItemsGeneral =
        "At least one item must be added to the sales order.";
    } else {
      salesItems.forEach((item) => {
        // For each item, check all its fields for errors.
        if (!item.productCode.trim() && !item.productName.trim()) {
          errors[`item_${item.id}_product`] = "Product is required.";
        }
        if (
          isNaN(parseFloat(item.quantity)) ||
          parseFloat(item.quantity) <= 0
        ) {
          errors[`item_${item.id}_quantity`] =
            "Quantity must be a positive number.";
        }
        if (isNaN(parseFloat(item.price)) || parseFloat(item.price) < 0) {
          errors[`item_${item.id}_price`] = "Price must be a valid number.";
        }
        if (!item.uom.trim()) {
          errors[`item_${item.id}_uom`] = "UOM is required.";
        }
        if (!item.warehouseLocation.trim()) {
          errors[`item_${item.id}_warehouseLocation`] =
            "Warehouse is required.";
        }
      });
    }

    // Update the state to show red borders on the UI in the next render.
    setFormErrors(errors);

    // Return the fresh, up-to-date errors object for immediate use.
    return errors;
  };

  // 📍 Starts around line ~690
  const handleSave = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      // We DO NOT send DocumentLines anymore.
      // Only Header fields are allowed to update.
      const updatePayload = {
        DocDueDate: formData.deliveryDate,
        Comments: formData.salesRemarks, // No need to append total, SAP keeps old total
        NumAtCard: formData.customerRefNumber,
        SalesPersonCode:
          formData.salesEmployeeCode > 0
            ? formData.salesEmployeeCode
            : undefined,
      };

      console.log(
        "Sending Header Update...",
        JSON.stringify(updatePayload, null, 2)
      );

      // Use PUT to match your controller, backend executes PATCH
      const response = await fetch(`${API_BASE_URL}/SalesOrders/${soId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Update Failed: ${errorData}`);
      }

      showAppModal("Remarks & Details Updated Successfully!", "success");
    } catch (error) {
      console.error("Update Error:", error);
      let displayMsg = error.message;
      if (displayMsg.includes("{")) {
        try {
          displayMsg = JSON.parse(displayMsg.substring(displayMsg.indexOf("{")))
            .error.message.value;
        } catch (e) {}
      }
      showAppModal(displayMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // End of handleSave function

  // } // End of SalesUpdate component
  const handleCancel = () => navigate("/salesorder");

  // --- Calculated Totals for Summary ---
  const productTotalSummary = salesItems
    .reduce(
      (sum, item) =>
        sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
      0
    )
    .toFixed(2);
  const taxTotalSummary = salesItems
    .reduce((sum, item) => sum + (parseFloat(item.taxPrice) || 0), 0)
    .toFixed(2);
  const grandTotalSummary = salesItems
    .reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
    .toFixed(2);
  const filteredModalProducts = allProducts.filter((p) => {
    const term = searchTermModal.toLowerCase();
    return (
      p.sku?.toLowerCase().includes(term) ||
      p.name?.toLowerCase().includes(term)
    );
  });

  // --- Loading and Error States for Page ---
  if (isLoadingData && !pageError) {
    return (
      <div className="so-update__page-loading">
        Loading Sales Order details...
      </div>
    );
  }
  if (pageError) {
    return (
      <div className="so-update__page-error">
        Error: {pageError}
        <button
          onClick={() => navigate("/salesorder")}
          style={{ marginLeft: "10px" }}
        >
          Back to Sales Orders
        </button>
      </div>
    );
  }

  // --- JSX Structure ---
  return (
    <>
      <MessageModal
        message={modalState.message}
        onClose={closeAppModal}
        type={modalState.type}
      />
      <div className="so-update__detail-page-container">
        {/* <div className="so-update__detail-page-header-bar">
          <h1 className="so-update__detail-page-main-title">
            Update Sales Order
          </h1> */}
        {/* Optional: Display SO Number here if it's significant and read-only */}
        {/* {formData.salesOrderNo && <span className="so-update__header-so-number">SO #: {formData.salesOrderNo}</span>} */}
        {/* </div> */}

        {/* Form Header */}
        <div className="so-update__form-header">
          <div className="so-update__entry-header-column">
            {/* Customer Code */}
            <div
              className="so-update__entry-header-field so-update__autocomplete-container"
              ref={customerCodeInputRef}
            >
              <label htmlFor="customerCode">Customer Code :</label>
              <div className="so-update__input-icon-wrapper">
                <input
                  type="text"
                  id="customerCode"
                  name="customerCode"
                  className={`so-update__form-input-styled ${
                    formErrors.customerCode ? "so-update__input-error" : ""
                  }`}
                  value={formData.customerCode}
                  onChange={handleInputChange}
                  onKeyDown={handleCustomerKeyDown}
                  onFocus={() => {
                    if (formData.customerCode.trim() && allCustomers.length) {
                      const f = allCustomers.filter((c) =>
                        c.code
                          ?.toLowerCase()
                          .includes(formData.customerCode.trim().toLowerCase())
                      );
                      setCustomerSuggestions(f);
                      setShowCustomerSuggestionsForCode(f.length > 0);
                      setShowCustomerSuggestionsForName(false);
                    }
                  }}
                  autoComplete="off"
                  readOnly
                />
                {/* <button
                  type="button"
                  className="so-update__header-lookup-indicator so-update__internal" // Added classes
                  onClick={openCustomerLookupModal}
                  title="Lookup Customer"
                >
                  <LookupIcon />
                </button> */}
                {showCustomerSuggestionsForCode &&
                  customerSuggestions.length > 0 && (
                    <ul className="so-update__customer-suggestions-list so-update__customer-suggestions-list-code">
                      {customerSuggestions.map((c, i) => (
                        <li
                          key={c.id || c.code}
                          className={
                            i === activeSuggestionIndex
                              ? "so-update__active-suggestion"
                              : ""
                          }
                          onClick={() => handleCustomerSuggestionClick(c)}
                          onMouseEnter={() => setActiveSuggestionIndex(i)}
                        >
                          {c.code} - {c.name}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </div>
            {formErrors.customerCode && (
              <span className="so-update__field-error so-update__field-error-shift">
                {formErrors.customerCode}
              </span>
            )}

            {/* Customer Name */}
            <div
              className="so-update__entry-header-field so-update__autocomplete-container"
              ref={customerNameInputRef}
            >
              <label htmlFor="customerName">Customer Name :</label>
              <div className="so-update__input-icon-wrapper">
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  className={`so-update__form-input-styled  ${
                    formErrors.customerName ? "so-update__input-error" : ""
                  }`}
                  value={formData.customerName}
                  onChange={handleInputChange}
                  onKeyDown={handleCustomerKeyDown}
                  onFocus={() => {
                    if (formData.customerName.trim() && allCustomers.length) {
                      const f = allCustomers.filter((c) =>
                        c.name
                          ?.toLowerCase()
                          .includes(formData.customerName.trim().toLowerCase())
                      );
                      setCustomerSuggestions(f);
                      setShowCustomerSuggestionsForName(f.length > 0);
                      setShowCustomerSuggestionsForCode(false);
                    }
                  }}
                  autoComplete="off"
                  readOnly
                />
                {/* <button
                  type="button"
                  className="so-update__header-lookup-indicator so-update__internal" // Added classes
                  onClick={openCustomerLookupModal}
                  title="Lookup Customer"
                >
                  <LookupIcon />
                </button> */}
                {showCustomerSuggestionsForName &&
                  customerSuggestions.length > 0 && (
                    <ul className="so-update__customer-suggestions-list so-update__customer-suggestions-list-name">
                      {customerSuggestions.map((c, i) => (
                        <li
                          key={c.id || c.name}
                          className={
                            i === activeSuggestionIndex
                              ? "so-update__active-suggestion"
                              : ""
                          }
                          onClick={() => handleCustomerSuggestionClick(c)}
                          onMouseEnter={() => setActiveSuggestionIndex(i)}
                        >
                          {c.name} ({c.code})
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </div>
            {formErrors.customerName && (
              <span className="so-update__field-error so-update__field-error-shift">
                {formErrors.customerName}
              </span>
            )}

            <div className="so-update__entry-header-field">
              <label htmlFor="customerRefNumber">Customer Ref No :</label>
              <input
                type="text"
                id="customerRefNumber"
                name="customerRefNumber"
                className="so-update__form-input-styled"
                value={formData.customerRefNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="so-update__entry-header-field">
              <label htmlFor="shipToAddress">Bill to Address :</label>
              <textarea
                id="shipToAddress"
                name="shipToAddress"
                className="so-update__form-textarea-styled"
                rows="2"
                value={formData.shipToAddress}
                onChange={handleInputChange}
                readOnly
              />
            </div>
            <div className="so-update__entry-header-field">
              <label htmlFor="salesRemarks">Remarks :</label>
              <textarea
                id="salesRemarks"
                name="salesRemarks"
                className="so-update__form-textarea-styled"
                rows="2"
                value={formData.salesRemarks}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="so-update__entry-header-column">
            <div className="so-update__entry-header-field">
              <label htmlFor="salesOrderNo">S.O Number :</label>
              <input
                type="text"
                id="salesOrderNo"
                name="salesOrderNo"
                className="so-update__form-input-styled"
                value={formData.salesOrderNo}
                onChange={handleInputChange}
                readOnly
              />
              {/* SO Number is usually not editable once created, hence readOnly */}
            </div>
            <div className="so-update__entry-header-field">
              <label htmlFor="soDate">S.O Date :</label>
              <input
                type="date"
                id="soDate"
                name="soDate"
                className={`so-update__form-input-styled ${
                  formErrors.soDate ? "so-update__input-error" : ""
                }`}
                value={formData.soDate}
                onChange={handleInputChange}
              />
            </div>
            {formErrors.soDate && (
              <span className="so-update__field-error so-update__field-error-shift">
                {formErrors.soDate}
              </span>
            )}
            <div className="so-update__entry-header-field">
              <label htmlFor="deliveryDate">Delivery Date :</label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                className="so-update__form-input-styled"
                value={formData.deliveryDate}
                readOnly
                //onChange={handleInputChange}
              />
            </div>
            <div className="so-update__entry-header-field">
              <label htmlFor="salesEmployee">Sales Employee :</label>
              <input
                type="text"
                id="salesEmployee"
                name="salesEmployee"
                className="so-update__form-input-styled"
                value={formData.salesEmployee}
                onChange={handleInputChange}
                readOnly
              />
            </div>
            {/* <div className="so-update__entry-header-field so-update__file-input-container">
              <label htmlFor="uploadFilesInput">Attachment(s) :</label>
              <input
                type="file"
                id="uploadFilesInput"
                ref={fileInputRef}
                className="so-update__form-input-file-hidden"
                onChange={handleFileInputChange}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                multiple
              />
              <button
                type="button"
                className="so-update__browse-files-btn"
                onClick={handleBrowseClick}
              >
                Browse new files
              </button>

              {existingFiles.length > 0 && (
                <div className="so-update__file-names-display-area so-update__existing-files-area">
                  <p className="so-update__files-subheading">
                    Current attachments:
                  </p>
                  {existingFiles.map(
                    (
                      f // Use f.id from backend attachment DTO
                    ) => (
                      <div key={f.id} className="so-update__file-name-entry">
                        <span
                          className="so-update__file-name-display"
                          title={f.fileName}
                        >
                          <a
                            href={f.downloadUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {f.fileName}
                          </a>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingFile(f.id)}
                          className="so-update__remove-file-btn"
                          title="Mark to remove file on save"
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
              {formData.uploadedFiles.length > 0 && (
                <div className="so-update__file-names-display-area so-update__new-files-area">
                  <p className="so-update__files-subheading">
                    New files to upload:
                  </p>
                  {formData.uploadedFiles.map((f, i) => (
                    <div
                      key={f.name + i}
                      className="so-update__file-name-entry"
                    >
                      <span
                        className="so-update__file-name-display"
                        title={f.name}
                      >
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(f.name)}
                        className="so-update__remove-file-btn"
                        title="Remove new file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div> */}
          </div>
        </div>

        {/* Items Section */}
        <div className="so-update__detail-form-content-area">
          <div className="so-update__items-section">
            <div className="so-update__product-details-header">
              {/* Removed "Add Row" button to prevent SAP Errors */}
              <h3 className="so-update__form-section-title">
                Product Details (Read Only)
              </h3>
            </div>

            <div className="so-update__table-responsive-container">
              <table className="so-update__items-table">
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>UOM</th>
                    <th>Price</th>
                    <th>Warehouse</th>
                    <th>Tax Code</th>
                    <th>Tax Price</th> {/* Correct Header Position */}
                    <th>Total</th> {/* Correct Header Position */}
                  </tr>
                </thead>
                <tbody>
                  {salesItems.map((item) => (
                    <tr key={item.id}>
                      {/* 1. Product Code */}
                      <td className="so-update__editable-cell">
                        <input
                          type="text"
                          className="so-update__table-input"
                          value={item.productCode}
                          readOnly
                        />
                      </td>

                      {/* 2. Product Name */}
                      <td className="so-update__editable-cell">
                        <input
                          type="text"
                          className="so-update__table-input"
                          value={item.productName}
                          readOnly
                        />
                      </td>

                      {/* 3. Quantity */}
                      <td className="so-update__editable-cell">
                        <input
                          type="text"
                          className="so-update__table-input"
                          value={item.quantity}
                          readOnly
                        />
                      </td>

                      {/* 4. UOM */}
                      <td className="so-update__editable-cell">
                        <input
                          type="text"
                          className="so-update__table-input"
                          value={item.uom}
                          readOnly
                        />
                      </td>

                      {/* 5. Price */}
                      <td className="so-update__editable-cell">
                        <input
                          type="text"
                          className="so-update__table-input"
                          value={item.price}
                          readOnly
                        />
                      </td>

                      {/* 6. Warehouse */}
                      <td className="so-update__editable-cell">
                        <input
                          type="text"
                          className="so-update__table-input"
                          value={item.warehouseLocation}
                          readOnly
                        />
                      </td>

                      {/* 7. Tax Code */}
                      <td className="so-update__editable-cell">
                        <input
                          type="text"
                          className="so-update__table-input"
                          value={item.taxCode}
                          readOnly
                        />
                      </td>

                      {/* 8. Tax Price (Aligned correctly) */}
                      <td className="so-update__editable-cell">
                        <input
                          type="text"
                          className="so-update__table-input"
                          value={item.taxPrice}
                          readOnly
                        />
                      </td>

                      {/* 9. Total (Aligned correctly) */}
                      <td className="so-update__total-cell">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="so-update__tax-summary-container">
              <div className="so-update__summary-item">
                {" "}
                <label
                  htmlFor="productTotalSummary"
                  className="so-update__summary-label"
                >
                  Product Total w/o Tax :
                </label>{" "}
                <input
                  type="text"
                  id="productTotalSummary"
                  className="so-update__summary-input"
                  readOnly
                  value={productTotalSummary}
                />{" "}
              </div>
              <div className="so-update__summary-item">
                {" "}
                <label
                  htmlFor="taxTotalSummary"
                  className="so-update__summary-label"
                >
                  Tax Total :
                </label>{" "}
                <input
                  type="text"
                  id="taxTotalSummary"
                  className="so-update__summary-input"
                  readOnly
                  value={taxTotalSummary}
                />{" "}
              </div>
              <div className="so-update__summary-item">
                {" "}
                <label
                  htmlFor="grandTotalSummary"
                  className="so-update__summary-label"
                >
                  Net Total :
                </label>{" "}
                <input
                  type="text"
                  id="grandTotalSummary"
                  className="so-update__summary-input"
                  readOnly
                  value={grandTotalSummary}
                />{" "}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="so-update__detail-page-footer">
          <div className="so-update__footer-actions-main">
            <button
              className="so-update__footer-btn so-update__primary"
              onClick={handleSave}
              disabled={isSaving || isLoadingData}
            >
              {isSubmitting ? "Updating..." : "Update Sales Order"}
            </button>
          </div>
          <button
            className="so-update__footer-btn so-update__secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Product Lookup Modal */}
      {isProductModalOpen && (
        <div className="so-update__modal-overlay so-update__modal-overlay">
          <div className="so-update__modal-content so-update__product-lookup-modal">
            <div className="so-update__modal-header">
              <h2>Select Product</h2>
              <button
                className="so-update__modal-close-btn"
                onClick={() => setIsProductModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="so-update__modal-body">
              <input
                type="text"
                placeholder="Search by Code or Name..."
                className="so-update__modal-search-input"
                value={searchTermModal}
                onChange={(e) => setSearchTermModal(e.target.value)}
                autoFocus
              />
              {isLoadingAllProducts && <p>Loading products...</p>}
              {allProductsError && (
                <p className="so-update__modal-error-text">
                  Error: {allProductsError}
                </p>
              )}
              {!isLoadingAllProducts && !allProductsError && (
                <div className="so-update__product-lookup-table-container">
                  <table className="so-update__product-lookup-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>UOM</th>
                        <th>Retail Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModalProducts.length > 0 ? (
                        filteredModalProducts.map((product) => (
                          <tr
                            key={product.id}
                            onClick={() =>
                              handleSelectProductFromModal(product)
                            }
                          >
                            <td>{product.sku}</td>
                            <td>{product.name}</td>
                            <td>{product.uom}</td>
                            <td>{product.retailPrice?.toFixed(2) ?? "N/A"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="so-update__modal-no-data">
                            No products found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tax Code Lookup Modal */}
      {isTaxLookupModalOpen && (
        <div className="so-update__modal-overlay so-update__tax-lookup-modal-overlay">
          <div className="so-update__modal-content so-update__tax-lookup-modal">
            <div className="so-update__modal-header">
              <h2>Select Tax Code</h2>
              <button
                className="so-update__modal-close-btn"
                onClick={() => setIsTaxLookupModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="so-update__modal-body">
              <input
                type="text"
                placeholder="Search by Tax Code or Description..."
                className="so-update__modal-search-input"
                value={searchTermTaxLookupModal}
                onChange={(e) => setSearchTermTaxLookupModal(e.target.value)}
                autoFocus
              />
              {isLoadingTaxCodes && <p>Loading tax codes...</p>}
              {taxCodesError && (
                <p className="so-update__modal-error-text">
                  Error: {taxCodesError}
                </p>
              )}
              {!isLoadingTaxCodes && !taxCodesError && (
                <div className="so-update__product-lookup-table-container">
                  <table className="so-update__product-lookup-table">
                    <thead>
                      <tr>
                        <th>Tax Code</th>
                        <th>Description</th>
                        <th>Total %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTaxCodes.filter((tax) => {
                        const term = searchTermTaxLookupModal.toLowerCase();
                        if (!term) return true;
                        return (
                          tax.taxCode?.toLowerCase().includes(term) ||
                          tax.taxDescription?.toLowerCase().includes(term)
                        );
                      }).length > 0 ? (
                        activeTaxCodes
                          .filter((tax) => {
                            const term = searchTermTaxLookupModal.toLowerCase();
                            if (!term) return true;
                            return (
                              tax.taxCode?.toLowerCase().includes(term) ||
                              tax.taxDescription?.toLowerCase().includes(term)
                            );
                          })
                          .map((tax) => (
                            <tr
                              key={tax.id || tax.taxCode}
                              onClick={() => handleSelectTaxCodeFromModal(tax)}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{tax.taxCode}</td>
                              <td>{tax.taxDescription}</td>
                              <td style={{ textAlign: "right" }}>
                                {tax.totalPercentage !== null &&
                                tax.totalPercentage !== undefined
                                  ? `${parseFloat(tax.totalPercentage).toFixed(
                                      2
                                    )}%`
                                  : "N/A"}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="so-update__modal-no-data">
                            No active tax codes found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- NEW: Customer Lookup Modal for SalesUpdate --- */}
      {isCustomerModalOpen && (
        <div className="so-update__modal-overlay so-update__customer-lookup-modal-overlay">
          {" "}
          {/* Optional: specific class */}
          <div className="so-update__modal-content so-update__customer-lookup-modal">
            {" "}
            {/* Optional: specific class */}
            <div className="so-update__modal-header">
              <h2>Select Customer</h2>
              <button
                className="so-update__modal-close-btn"
                onClick={() => setIsCustomerModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="so-update__modal-body">
              <input
                type="text"
                placeholder="Search by Code, Name..."
                className="so-update__modal-search-input" // Reuse existing style
                value={searchTermCustomerModal}
                onChange={(e) => setSearchTermCustomerModal(e.target.value)}
                autoFocus
              />
              {isLoadingCustomers && <p>Loading customers...</p>}
              {!isLoadingCustomers && (
                <div className="so-update__product-lookup-table-container">
                  {" "}
                  {/* Reuse existing style */}
                  <table className="so-update__product-lookup-table">
                    {" "}
                    {/* Reuse existing style */}
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Bill to Address</th>
                        <th>Sales Employee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCustomers.filter((customer) => {
                        const term = searchTermCustomerModal.toLowerCase();
                        if (!term) return true;
                        return (
                          (customer.code &&
                            customer.code.toLowerCase().includes(term)) ||
                          (customer.name &&
                            customer.name.toLowerCase().includes(term))
                        );
                      }).length > 0 ? (
                        allCustomers
                          .filter((customer) => {
                            const term = searchTermCustomerModal.toLowerCase();
                            if (!term) return true;
                            return (
                              (customer.code &&
                                customer.code.toLowerCase().includes(term)) ||
                              (customer.name &&
                                customer.name.toLowerCase().includes(term))
                            );
                          })
                          .map((customer) => {
                            const addressParts = [
                              customer.address1,
                              customer.address2,
                              customer.street,
                              customer.city,
                              customer.state,
                              customer.postBox,
                              customer.country,
                            ];
                            const displayAddressInModal = addressParts
                              .filter(Boolean)
                              .join(", ");
                            return (
                              <tr
                                key={customer.id || customer.code}
                                onClick={() =>
                                  handleSelectCustomerFromModal(customer)
                                }
                                style={{ cursor: "pointer" }}
                              >
                                <td>{customer.code}</td>
                                <td>{customer.name}</td>
                                <td>{displayAddressInModal || "N/A"}</td>
                                <td>{customer.employee || "N/A"}</td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan="4" className="so-update__modal-no-data">
                            No customers found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isUOMLookupModalOpen && (
        <div className="so-update__modal-overlay so-update__uom-lookup-modal-overlay">
          {/* Optional: specific class */}
          <div className="so-update__modal-content so-update__uom-lookup-modal">
            {" "}
            {/* Optional: specific class */}
            <div className="so-update__modal-header">
              <h2>Select Unit of Measure (UOM)</h2>
              <button
                className="so-update__modal-close-btn"
                onClick={() => setIsUOMLookupModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="so-update__modal-body">
              <input
                type="text"
                placeholder="Search UOM..."
                className="so-update__modal-search-input" // Reuse existing style
                value={searchTermUOMLookupModal}
                onChange={(e) => setSearchTermUOMLookupModal(e.target.value)}
                autoFocus
              />
              {isLoadingUOMs && <p>Loading UOMs...</p>}
              {uomsError && (
                <p className="so-update__modal-error-text">
                  Error loading UOMs: {uomsError}
                </p>
              )}
              {!isLoadingUOMs && !uomsError && (
                <div className="so-update__product-lookup-table-container">
                  {" "}
                  {/* Reuse existing style */}
                  <table className="so-update__product-lookup-table">
                    {" "}
                    {/* Reuse existing style */}
                    <thead>
                      <tr>
                        <th>UOM Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUOMs.filter((uom) => {
                        const term = searchTermUOMLookupModal.toLowerCase();
                        if (!term) return true;
                        return (
                          uom.name && uom.name.toLowerCase().includes(term)
                        );
                      }).length > 0 ? (
                        allUOMs
                          .filter((uom) => {
                            const term = searchTermUOMLookupModal.toLowerCase();
                            if (!term) return true;
                            return (
                              uom.name && uom.name.toLowerCase().includes(term)
                            );
                          })
                          .map((uom) => (
                            <tr
                              key={uom.id}
                              onClick={() => handleSelectUOMFromModal(uom)}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{uom.name}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="1" className="so-update__modal-no-data">
                            No UOMs found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isWarehouseLookupModalOpen && (
        <div className="so-update__modal-overlay so-update__warehouse-lookup-modal-overlay">
          {" "}
          {/* Optional: specific class */}
          <div className="so-update__modal-content so-update__warehouse-lookup-modal">
            {" "}
            {/* Optional: specific class */}
            <div className="so-update__modal-header">
              <h2>Select Warehouse</h2>
              <button
                className="so-update__modal-close-btn"
                onClick={() => setIsWarehouseLookupModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="so-update__modal-body">
              <input
                type="text"
                placeholder="Search by Warehouse Code or Name..."
                className="so-update__modal-search-input" // Reuse existing style
                value={searchTermWarehouseLookupModal}
                onChange={(e) =>
                  setSearchTermWarehouseLookupModal(e.target.value)
                }
                autoFocus
              />
              {isLoadingWarehouses && <p>Loading warehouses...</p>}
              {warehousesError && (
                <p className="so-update__modal-error-text">
                  Error loading warehouses: {warehousesError}
                </p>
              )}
              {!isLoadingWarehouses && !warehousesError && (
                <div className="so-update__product-lookup-table-container">
                  {" "}
                  {/* Reuse existing style */}
                  <table className="so-update__product-lookup-table">
                    {" "}
                    {/* Reuse existing style */}
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allWarehouses.filter((wh) => {
                        const term =
                          searchTermWarehouseLookupModal.toLowerCase();
                        if (!term) return true;
                        return (
                          (wh.code && wh.code.toLowerCase().includes(term)) ||
                          (wh.name && wh.name.toLowerCase().includes(term)) ||
                          (wh.address &&
                            wh.address.toLowerCase().includes(term))
                        );
                      }).length > 0 ? (
                        allWarehouses
                          .filter((wh) => {
                            const term =
                              searchTermWarehouseLookupModal.toLowerCase();
                            if (!term) return true;
                            return (
                              (wh.code &&
                                wh.code.toLowerCase().includes(term)) ||
                              (wh.name &&
                                wh.name.toLowerCase().includes(term)) ||
                              (wh.address &&
                                wh.address.toLowerCase().includes(term))
                            );
                          })
                          .map((wh) => (
                            <tr
                              key={wh.id}
                              onClick={() => handleSelectWarehouseFromModal(wh)}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{wh.code}</td>
                              <td>{wh.name}</td>
                              <td>{wh.address}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="so-update__modal-no-data">
                            No warehouses found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default SalesUpdate;
