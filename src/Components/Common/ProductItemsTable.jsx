// src/pages/Purchase/ProductItemsTable.js
import React from "react";

// You can keep these icon components here or move them to a shared 'icons.js' file
const LookupIcon = () => (
  <span className="lookup-indicator-icon" title="Lookup value">
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
    title="Remove Item"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

const ProductItemsTable = ({
  items,
  summary,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onOpenProductModal,
  onOpenUOMModal,
  onOpenWarehouseModal,
  onOpenTaxModal,
  formErrors = {}, // Pass form errors for highlighting
}) => {
  return (
    <div className="purchase-order-add__items-section">
      <div className="product-details-header">
        <h3 className="form-section-title">Product Details</h3>
        <button type="button" className="add-item-row-btn" onClick={onAddItem}>
          + Add Row
        </button>
      </div>
      <div className="table-responsive-container">
        <table className="po-add__items-table">
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
              <th className="action-column-header">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {/* Product Code/Name Cells */}
                {["productCode", "productName"].map((field) => (
                  <td key={field} className="editable-cell">
                    <div className="po-add-input-with-icon-wrapper">
                      <input
                        type="text"
                        value={item[field]}
                        className={`po-add__table-input ${
                          formErrors[`item_${item.id}_product`]
                            ? "input-error"
                            : ""
                        }`}
                        readOnly
                        onClick={() => onOpenProductModal(item.id)}
                      />
                      <button
                        type="button"
                        className="po-add__lookup-indicator"
                        onClick={() => onOpenProductModal(item.id)}
                      >
                        <LookupIcon />
                      </button>
                    </div>
                  </td>
                ))}

                {/* Other Input Cells */}
                <td className="editable-cell">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onItemChange(e, item.id, "quantity")}
                    className={`po-add__table-input po-quantity-input ${
                      formErrors[`item_${item.id}_quantity`]
                        ? "input-error"
                        : ""
                    }`}
                  />
                </td>
                <td className="editable-cell">
                  <div className="po-add-input-with-icon-wrapper">
                    <input
                      type="text"
                      value={item.uom}
                      onChange={(e) => onItemChange(e, item.id, "uom")}
                      className={`po-add__table-input po-uom-input ${
                        formErrors[`item_${item.id}_uom`] ? "input-error" : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="po-add__lookup-indicator"
                      onClick={() => onOpenUOMModal(item.id)}
                      title="Lookup UOM"
                    >
                      <LookupIcon />
                    </button>
                  </div>
                </td>
                <td className="editable-cell">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => onItemChange(e, item.id, "price")}
                    className={`po-add__table-input po-price-input ${
                      formErrors[`item_${item.id}_price`] ? "input-error" : ""
                    }`}
                  />
                </td>
                <td className="editable-cell">
                  <div className="po-add-input-with-icon-wrapper">
                    <input
                      type="text"
                      value={item.warehouseLocation}
                      onChange={(e) =>
                        onItemChange(e, item.id, "warehouseLocation")
                      }
                      onClick={() => onOpenWarehouseModal(item.id)}
                      className={`po-add__table-input ${
                        formErrors[`item_${item.id}_warehouseLocation`]
                          ? "input-error"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="po-add__lookup-indicator"
                      onClick={() => onOpenWarehouseModal(item.id)}
                      title="Lookup Warehouse"
                    >
                      <LookupIcon />
                    </button>
                  </div>
                </td>
                <td className="editable-cell tax-cell">
                  <div className="po-add-input-with-icon-wrapper">
                    <input
                      type="text"
                      value={item.taxCode}
                      onChange={(e) => onItemChange(e, item.id, "taxCode")}
                      onClick={() => onOpenTaxModal(item.id)}
                      className="po-add__table-input po-tax-input"
                    />
                    <button
                      type="button"
                      className="po-add__lookup-indicator"
                      onClick={() => onOpenTaxModal(item.id)}
                    >
                      <LookupIcon />
                    </button>
                  </div>
                </td>

                <td className="editable-cell">
                  <input
                    type="number"
                    value={item.taxPrice}
                    readOnly
                    className="po-add__table-input po-tax-input"
                  />
                </td>
                <td className="total-cell">{item.total}</td>
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
            ))}
          </tbody>
        </table>
      </div>
      <div className="tax-summary-container">
        <div className="summary-item">
          <label>Product Total without Tax :</label>
          <input
            type="text"
            readOnly
            value={summary.productTotal}
            className="summary-input"
          />
        </div>
        <div className="summary-item">
          <label>Tax Total :</label>
          <input
            type="text"
            readOnly
            value={summary.taxTotal}
            className="summary-input"
          />
        </div>
        <div className="summary-item">
          <label>Net Total : </label>
          <input
            type="text"
            readOnly
            value={summary.netTotal}
            className="summary-input"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductItemsTable;
