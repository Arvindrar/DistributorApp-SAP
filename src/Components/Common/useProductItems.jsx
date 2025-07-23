import React, { useState, useEffect, useCallback } from "react";
import {
  API_PRODUCTS_ENDPOINT,
  API_BASE_URL,
  API_UOM_ENDPOINT,
  API_WAREHOUSE_ENDPOINT,
} from "../../config";
import { LookupModal } from "./SharedComponents"; // Assuming SharedComponents.jsx is in the same folder

// vvv THIS IS THE CORRECTED LINE vvv
export const useProductItems = (initialItems = [], options = {}) => {
  // Now 'options' is a valid argument, defaulting to an empty object
  const { priceField = "wholesalePrice" } = options;

  const [items, setItems] = useState(
    initialItems.length > 0 ? initialItems : [initialEmptyItem(Date.now())]
  );

  const [allProducts, setAllProducts] = useState([]);
  const [activeTaxCodes, setActiveTaxCodes] = useState([]);
  const [allUOMs, setAllUOMs] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);

  const [productModal, setProductModal] = useState({
    isOpen: false,
    targetId: null,
    term: "",
  });
  const [uomModal, setUOMModal] = useState({
    isOpen: false,
    targetId: null,
    term: "",
  });
  const [warehouseModal, setWarehouseModal] = useState({
    isOpen: false,
    targetId: null,
    term: "",
  });
  const [taxModal, setTaxModal] = useState({
    isOpen: false,
    targetId: null,
    term: "",
  });

  const showAppModal = (message, type = "info") => {
    alert(`[${type.toUpperCase()}] ${message}`);
  };

  const fetchDataForLookups = useCallback(
    async (endpoint, setData, resourceName) => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`${resourceName} API Error`);
        const data = await response.json();
        setData(
          data.filter ? data.filter((item) => item.isActive !== false) : data
        );
      } catch (error) {
        showAppModal(
          `Error loading ${resourceName}: ${error.message}`,
          "error"
        );
      }
    },
    []
  );

  useEffect(() => {
    fetchDataForLookups(API_PRODUCTS_ENDPOINT, setAllProducts, "Products");
    fetchDataForLookups(
      `${API_BASE_URL}/TaxDeclarations`,
      setActiveTaxCodes,
      "Tax Codes"
    );
    fetchDataForLookups(API_UOM_ENDPOINT, setAllUOMs, "UOMs");
    fetchDataForLookups(API_WAREHOUSE_ENDPOINT, setAllWarehouses, "Warehouses");
  }, [fetchDataForLookups]);

  const updateItemTaxAndTotal = useCallback(
    (itemIdToUpdate, currentItems) => {
      const updatedItems = currentItems.map((item) => {
        if (item.id === itemIdToUpdate) {
          const qty = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const base = qty * price;
          const taxCodeData = activeTaxCodes.find(
            (tc) => tc.taxCode === item.taxCode
          );
          const tax = taxCodeData
            ? base * (parseFloat(taxCodeData.totalPercentage) / 100)
            : 0;
          return {
            ...item,
            taxPrice: tax.toFixed(2),
            total: (base + tax).toFixed(2),
          };
        }
        return item;
      });
      setItems(updatedItems);
    },
    [activeTaxCodes]
  );

  function initialEmptyItem(id) {
    return {
      id,
      productCode: "",
      productName: "",
      quantity: "1",
      uom: "",
      price: "",
      warehouseLocation: "",
      taxCode: "",
      taxPrice: "0",
      total: "0.00",
    };
  }

  const handleItemChange = (e, itemId, fieldName) => {
    const { value } = e.target;
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, [fieldName]: value } : item
    );
    setItems(newItems);
    if (["quantity", "price", "taxCode"].includes(fieldName)) {
      updateItemTaxAndTotal(itemId, newItems);
    }
  };

  const handleAddItemRow = () =>
    setItems((prev) => [...prev, initialEmptyItem(Date.now())]);
  const handleRemoveItem = (id) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const openProductModal = (itemId) =>
    setProductModal({ isOpen: true, targetId: itemId, term: "" });
  const openUOMModal = (itemId) =>
    setUOMModal({ isOpen: true, targetId: itemId, term: "" });
  const openWarehouseModal = (itemId) =>
    setWarehouseModal({ isOpen: true, targetId: itemId, term: "" });
  const openTaxModal = (itemId) =>
    setTaxModal({ isOpen: true, targetId: itemId, term: "" });

  const handleSelectProduct = (product) => {
    const newItems = items.map((item) =>
      item.id === productModal.targetId
        ? {
            ...item,
            productCode: product.sku,
            productName: product.name,
            uom: product.uom,
            price: product[priceField]?.toString() ?? "0", // Uses the configured price field
          }
        : item
    );
    updateItemTaxAndTotal(productModal.targetId, newItems);
    setProductModal({ isOpen: false, targetId: null, term: "" });
  };

  const handleSelectUOM = (uom) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === uomModal.targetId ? { ...item, uom: uom.name } : item
      )
    );
    setUOMModal({ isOpen: false, targetId: null, term: "" });
  };

  const handleSelectWarehouse = (wh) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === warehouseModal.targetId
          ? { ...item, warehouseLocation: wh.code }
          : item
      )
    );
    setWarehouseModal({ isOpen: false, targetId: null, term: "" });
  };

  const handleSelectTax = (tax) => {
    const newItems = items.map((item) =>
      item.id === taxModal.targetId ? { ...item, taxCode: tax.taxCode } : item
    );
    updateItemTaxAndTotal(taxModal.targetId, newItems);
    setTaxModal({ isOpen: false, targetId: null, term: "" });
  };

  const summary = items.reduce(
    (acc, item) => {
      const total = parseFloat(item.total) || 0;
      const taxPrice = parseFloat(item.taxPrice) || 0;
      acc.netTotal += total;
      acc.taxTotal += taxPrice;
      return acc;
    },
    { netTotal: 0, taxTotal: 0 }
  );
  summary.productTotal = summary.netTotal - summary.taxTotal;

  const renderModals = () => (
    <>
      <LookupModal
        isOpen={productModal.isOpen}
        onClose={() => setProductModal({ ...productModal, isOpen: false })}
        title="Select Product"
        searchTerm={productModal.term}
        onSearchChange={(e) =>
          setProductModal({ ...productModal, term: e.target.value })
        }
      >
        <div className="product-lookup-table-container">
          <table className="product-lookup-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {allProducts
                .filter(
                  (p) =>
                    p.name
                      .toLowerCase()
                      .includes(productModal.term.toLowerCase()) ||
                    p.sku
                      .toLowerCase()
                      .includes(productModal.term.toLowerCase())
                )
                .map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                  >
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                    <td>{product[priceField]?.toFixed(2) ?? "N/A"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </LookupModal>
      <LookupModal
        isOpen={uomModal.isOpen}
        onClose={() => setUOMModal({ ...uomModal, isOpen: false })}
        title="Select UOM"
        searchTerm={uomModal.term}
        onSearchChange={(e) =>
          setUOMModal({ ...uomModal, term: e.target.value })
        }
      >
        <div className="product-lookup-table-container">
          <table className="product-lookup-table">
            <thead>
              <tr>
                <th>UOM Name</th>
              </tr>
            </thead>
            <tbody>
              {allUOMs
                .filter((u) =>
                  u.name.toLowerCase().includes(uomModal.term.toLowerCase())
                )
                .map((uom) => (
                  <tr key={uom.id} onClick={() => handleSelectUOM(uom)}>
                    <td>{uom.name}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </LookupModal>
      <LookupModal
        isOpen={warehouseModal.isOpen}
        onClose={() => setWarehouseModal({ ...warehouseModal, isOpen: false })}
        title="Select Warehouse"
        searchTerm={warehouseModal.term}
        onSearchChange={(e) =>
          setWarehouseModal({ ...warehouseModal, term: e.target.value })
        }
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
              {allWarehouses
                .filter(
                  (w) =>
                    w.name
                      .toLowerCase()
                      .includes(warehouseModal.term.toLowerCase()) ||
                    w.code
                      .toLowerCase()
                      .includes(warehouseModal.term.toLowerCase())
                )
                .map((wh) => (
                  <tr key={wh.id} onClick={() => handleSelectWarehouse(wh)}>
                    <td>{wh.code}</td>
                    <td>{wh.name}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </LookupModal>
      <LookupModal
        isOpen={taxModal.isOpen}
        onClose={() => setTaxModal({ ...taxModal, isOpen: false })}
        title="Select Tax Code"
        searchTerm={taxModal.term}
        onSearchChange={(e) =>
          setTaxModal({ ...taxModal, term: e.target.value })
        }
      >
        <div className="product-lookup-table-container">
          <table className="product-lookup-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Rate (%)</th>
              </tr>
            </thead>
            <tbody>
              {activeTaxCodes
                .filter((t) =>
                  t.taxCode.toLowerCase().includes(taxModal.term.toLowerCase())
                )
                .map((tax) => (
                  <tr key={tax.id} onClick={() => handleSelectTax(tax)}>
                    <td>{tax.taxCode}</td>
                    <td>{tax.taxDescription}</td>
                    <td>{tax.totalPercentage?.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </LookupModal>
    </>
  );

  return {
    items,
    setItems,
    handleItemChange,
    handleAddItemRow,
    handleRemoveItem,
    openProductModal,
    openUOMModal,
    openWarehouseModal,
    openTaxModal,
    summary: {
      netTotal: summary.netTotal.toFixed(2),
      taxTotal: summary.taxTotal.toFixed(2),
      productTotal: summary.productTotal.toFixed(2),
    },
    renderModals,
  };
};
