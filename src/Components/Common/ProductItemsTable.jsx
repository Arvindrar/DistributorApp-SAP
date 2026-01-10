// src/components/Common/ProductItemsTable.jsx (FULLY REFACTORED)

import React from "react";

// --- Icon Components ---
const LookupIcon = () => (
  <span className="lookup-icon" title="Lookup value">
    ○
  </span>
);
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

const ProductItemsTable = ({
  items,
  summary,
  onItemChange,
  onAddItem, // Renamed for clarity in the parent component
  onRemoveItem,
  onOpenProductModal,
  onOpenUOMModal,
  onOpenWarehouseModal,
  onOpenTaxModal,
  formErrors = {},
}) => {
  return (
    // This component now returns the full structure with generic class names
    <>
      <div className="items-header">
        <h3 className="section-title">Product Details</h3>
        <button type="button" className="add-row-btn" onClick={onAddItem}>
          + Add Row
        </button>
      </div>

      <div className="table-container">
        <table className="items-table">
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>UOM</th>
              <th>Price</th>
              <th>Warehouse</th>
              <th>Tax Code</th>
              <th>Tax Price</th>
              <th>Total</th>
              <th className="action-cell">Action</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id}>
                  {/* Product Code Cell */}
                  <td className="editable-cell">
                    <div className="table-input-wrapper">
                      <input
                        type="text"
                        value={item.productCode}
                        className={`table-input ${
                          formErrors[`item_${item.id}_product`]
                            ? "input-error"
                            : ""
                        }`}
                        readOnly
                        onClick={() => onOpenProductModal(item.id)}
                      />
                      <button
                        type="button"
                        className="lookup-btn"
                        onClick={() => onOpenProductModal(item.id)}
                      >
                        <LookupIcon />
                      </button>
                    </div>
                  </td>
                  {/* Product Name Cell */}
                  <td className="editable-cell">
                    <input
                      type="text"
                      value={item.productName}
                      className="table-input"
                      readOnly
                    />
                  </td>
                  {/* Quantity Cell */}
                  <td className="editable-cell">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onItemChange(e, item.id, "quantity")}
                      className={`table-input align-right ${
                        formErrors[`item_${item.id}_quantity`]
                          ? "input-error"
                          : ""
                      }`}
                    />
                  </td>
                  {/* UOM Cell */}
                  <td className="editable-cell">
                    <div className="table-input-wrapper">
                      <input
                        type="text"
                        value={item.uom}
                        onChange={(e) => onItemChange(e, item.id, "uom")}
                        className={`table-input align-center ${
                          formErrors[`item_${item.id}_uom`] ? "input-error" : ""
                        }`}
                      />
                      <button
                        type="button"
                        className="lookup-btn"
                        onClick={() => onOpenUOMModal(item.id)}
                      >
                        <LookupIcon />
                      </button>
                    </div>
                  </td>
                  {/* Price Cell */}
                  <td className="editable-cell">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => onItemChange(e, item.id, "price")}
                      className={`table-input align-right ${
                        formErrors[`item_${item.id}_price`] ? "input-error" : ""
                      }`}
                    />
                  </td>
                  {/* Warehouse Cell */}
                  <td className="editable-cell">
                    <div className="table-input-wrapper">
                      <input
                        type="text"
                        value={item.warehouseLocation}
                        onChange={(e) =>
                          onItemChange(e, item.id, "warehouseLocation")
                        }
                        onClick={() => onOpenWarehouseModal(item.id)}
                        className={`table-input ${
                          formErrors[`item_${item.id}_warehouseLocation`]
                            ? "input-error"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        className="lookup-btn"
                        onClick={() => onOpenWarehouseModal(item.id)}
                      >
                        <LookupIcon />
                      </button>
                    </div>
                  </td>
                  {/* Tax Code Cell */}
                  <td className="editable-cell">
                    <div className="table-input-wrapper">
                      <input
                        type="text"
                        value={item.taxCode}
                        onChange={(e) => onItemChange(e, item.id, "taxCode")}
                        onClick={() => onOpenTaxModal(item.id)}
                        className="table-input"
                      />
                      <button
                        type="button"
                        className="lookup-btn"
                        onClick={() => onOpenTaxModal(item.id)}
                      >
                        <LookupIcon />
                      </button>
                    </div>
                  </td>
                  {/* Tax Price Cell (Readonly) */}
                  <td className="readonly-cell">
                    <input
                      type="number"
                      value={item.taxPrice}
                      readOnly
                      className="table-input align-right"
                    />
                  </td>
                  {/* Total Cell (Readonly) */}
                  <td className="readonly-cell total-cell">
                    {parseFloat(item.total || 0).toFixed(2)}
                  </td>
                  {/* Action Cell */}
                  <td className="action-cell">
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="no-items-row">
                  Click '+ Add Row' to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="summary-container">
        <div className="summary-item">
          <label>Product Total (ex. Tax):</label>
          <input
            type="text"
            readOnly
            value={summary.productTotal.toFixed(2)}
            className="summary-input"
          />
        </div>
        <div className="summary-item">
          <label>Tax Total:</label>
          <input
            type="text"
            readOnly
            value={summary.taxTotal.toFixed(2)}
            className="summary-input"
          />
        </div>
        <div className="summary-item">
          <label>Net Total:</label>
          <input
            type="text"
            readOnly
            value={summary.netTotal.toFixed(2)}
            className="summary-input"
          />
        </div>
      </div>
    </>
  );
};

export default ProductItemsTable;
