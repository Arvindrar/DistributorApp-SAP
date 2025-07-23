import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductsAdd.css"; // Using your provided CSS
import {
  API_PRODUCTS_ENDPOINT,
  API_PRODUCT_GROUPS_ENDPOINT,
  API_UOM_ENDPOINT,
  API_UOM_GROUP_ENDPOINT,
  PLACEHOLDER_IMG_PATH,
} from "../../../config";

const MANUAL_UOM_ENTRY_VALUE = "__MANUAL_ENTRY__";

const Modal = ({ message, onClose, type = "success" }) => {
  if (!message) return null;
  return (
    <div className="pa-modal-overlay">
      <div className={`pa-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="pa-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

function ProductsAdd() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const initialFormData = {
    productCode: "",
    productName: "",
    productGroup: "",
    uomGroup: "",
    uom: "",
    hsn: "",
    retailPrice: "",
    wholesalePrice: "",
    imageFileName: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [manualUomValue, setManualUomValue] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(PLACEHOLDER_IMG_PATH);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [productGroupOptions, setProductGroupOptions] = useState([]);
  const [isLoadingProductGroups, setIsLoadingProductGroups] = useState(true);

  const [uomOptions, setUomOptions] = useState([]);
  const [isLoadingUoms, setIsLoadingUoms] = useState(true);

  const [uomGroupOptions, setUomGroupOptions] = useState([]);
  const [isLoadingUomGroups, setIsLoadingUomGroups] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");

  const fetchDropdownOptions = useCallback(
    async (
      endpoint,
      setOptions,
      setLoading,
      resourceName,
      addManualOption = false
    ) => {
      setLoading(true);
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch ${resourceName}: ${response.status} ${errorText}`
          );
        }
        const data = await response.json();
        let options = data.map((item) => ({
          value: item.name,
          label: item.name,
        }));

        if (addManualOption) {
          options.unshift({ value: "", label: "Select UOM from list..." });
          options.push({
            value: MANUAL_UOM_ENTRY_VALUE,
            label: "Enter text manually...",
          });
        }
        setOptions(options);
      } catch (e) {
        console.error(`Failed to fetch ${resourceName}:`, e);
        setModalMessage(e.message || `Failed to load ${resourceName}.`);
        setModalType("error");
        const defaultOptions = addManualOption
          ? [
              { value: "", label: "Select UOM from list..." },
              {
                value: MANUAL_UOM_ENTRY_VALUE,
                label: "Enter text manually...",
              },
            ]
          : [];
        setOptions(defaultOptions);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchDropdownOptions(
      API_PRODUCT_GROUPS_ENDPOINT,
      setProductGroupOptions,
      setIsLoadingProductGroups,
      "product groups"
    );
    fetchDropdownOptions(
      API_UOM_ENDPOINT,
      setUomOptions,
      setIsLoadingUoms,
      "UOMs",
      true
    );
    fetchDropdownOptions(
      API_UOM_GROUP_ENDPOINT,
      setUomGroupOptions,
      setIsLoadingUomGroups,
      "UOM groups"
    );
  }, [fetchDropdownOptions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "hsn") {
      const sanitizedValue = value.replace(/[^0-9.]/g, "");
      if (sanitizedValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
      }
    } else if (name === "manualUomValue") {
      setManualUomValue(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === "uom" && value !== MANUAL_UOM_ENTRY_VALUE) {
        setManualUomValue("");
      }
    }

    if (modalMessage && modalType === "error") {
      setModalMessage("");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        setModalMessage(
          "Invalid file type. Please upload a PNG, JPG, or WEBP image."
        );
        setModalType("error");
        e.target.value = null;
        return;
      }
      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setModalMessage("File is too large. Maximum size is 5MB.");
        setModalType("error");
        e.target.value = null;
        return;
      }
      setIsImageLoading(true);
      setImageFile(file);
      setFormData((prev) => ({ ...prev, imageFileName: file.name }));
      setCurrentImageUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setFormData((prev) => ({ ...prev, imageFileName: "" }));
      setCurrentImageUrl(PLACEHOLDER_IMG_PATH);
    }
  };

  const handleBrowseClick = () => fileInputRef.current.click();

  const handleSave = async () => {
    setModalMessage("");

    if (!formData.productCode.trim()) {
      setModalMessage("Product Code is required.");
      setModalType("error");
      return;
    }
    if (!formData.productName.trim()) {
      setModalMessage("Product Name is required.");
      setModalType("error");
      return;
    }
    if (!formData.productGroup) {
      setModalMessage("Product Group is required.");
      setModalType("error");
      return;
    }

    const finalUom =
      formData.uom === MANUAL_UOM_ENTRY_VALUE
        ? manualUomValue.trim()
        : formData.uom;
    if (!finalUom) {
      setModalMessage("UOM (Unit of Measure) is required.");
      setModalType("error");
      return;
    }

    const hsnValue = formData.hsn.trim();
    if (hsnValue && !/^\d{4}\.\d{2}\.\d{2}$/.test(hsnValue)) {
      setModalMessage(
        "HSN must be in the format xxxx.xx.xx (e.g., 1234.56.78) if provided."
      );
      setModalType("error");
      return;
    }
    const retailPrice = parseFloat(formData.retailPrice);
    if (
      formData.retailPrice.trim() &&
      (isNaN(retailPrice) || retailPrice < 0)
    ) {
      setModalMessage(
        "Retail Price must be a valid positive number if entered."
      );
      setModalType("error");
      return;
    }
    const wholesalePrice = parseFloat(formData.wholesalePrice);
    if (
      formData.wholesalePrice.trim() &&
      (isNaN(wholesalePrice) || wholesalePrice < 0)
    ) {
      setModalMessage(
        "Wholesale Price must be a valid positive number if entered."
      );
      setModalType("error");
      return;
    }

    setIsSubmitting(true);
    const dataToSubmit = new FormData();
    dataToSubmit.append("SKU", formData.productCode.trim());
    dataToSubmit.append("ProductName", formData.productName.trim());
    dataToSubmit.append("ProductGroup", formData.productGroup);
    dataToSubmit.append("UOM", finalUom);
    if (formData.uomGroup) dataToSubmit.append("UOMGroup", formData.uomGroup);
    if (hsnValue) dataToSubmit.append("HSN", hsnValue);
    if (formData.retailPrice.trim())
      dataToSubmit.append("RetailPrice", retailPrice);
    if (formData.wholesalePrice.trim())
      dataToSubmit.append("WholesalePrice", wholesalePrice);
    if (imageFile)
      dataToSubmit.append("ProductImage", imageFile, imageFile.name);

    try {
      const response = await fetch(API_PRODUCTS_ENDPOINT, {
        method: "POST",
        body: dataToSubmit,
      });
      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.errors)
            errorMessage = Object.entries(errorData.errors)
              .map(
                ([field, messages]) =>
                  `${field}: ${
                    Array.isArray(messages) ? messages.join(", ") : messages
                  }`
              )
              .join("; ");
          else if (errorData?.title) errorMessage = errorData.title;
          else if (errorData?.SKU && Array.isArray(errorData.SKU))
            errorMessage = `SKU: ${errorData.SKU.join(", ")}`;
          else if (errorData?.message && typeof errorData.message === "string")
            errorMessage = errorData.message;
          else if (typeof errorData === "string" && errorData.trim() !== "")
            errorMessage = errorData.trim();
          else
            errorMessage =
              response.statusText ||
              `Request failed with status ${response.status}`;
        } catch (e) {
          errorMessage =
            response.statusText ||
            `Request failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      setModalMessage("Product Added Successfully!");
      setModalType("success");
    } catch (e) {
      console.error("Failed to save product:", e);
      setModalMessage(e.message || "Failed to save product. Please try again.");
      setModalType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) navigate("/products");
  };

  const closeModal = () => {
    const currentModalType = modalType;
    setModalMessage("");
    if (currentModalType === "success") {
      setFormData(initialFormData);
      setManualUomValue("");
      setImageFile(null);
      setCurrentImageUrl(PLACEHOLDER_IMG_PATH);
      if (fileInputRef.current) fileInputRef.current.value = "";
      navigate("/products", { state: { refreshProducts: true } });
    }
  };

  const anyDropdownLoading =
    isLoadingProductGroups || isLoadingUoms || isLoadingUomGroups;

  return (
    <div className="pa-page-container">
      {modalMessage && (
        <Modal message={modalMessage} onClose={closeModal} type={modalType} />
      )}

      <div className="pa-header-bar">
        <h1 className="pa-main-title">New Product</h1>
      </div>

      <div className="pa-form-content-area">
        <div className="pa-form-grid">
          {/* Column 1 */}
          <div className="pa-form-column">
            <div className="pa-field-group">
              <label htmlFor="productCode">Product Code :</label>
              <input
                type="text"
                id="productCode"
                name="productCode"
                className="pa-input"
                value={formData.productCode}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="pa-field-group">
              <label htmlFor="productName">Product Name:</label>
              <input
                type="text"
                id="productName"
                name="productName"
                className="pa-input"
                value={formData.productName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="pa-field-group">
              <label htmlFor="productGroup">Product Group:</label>
              <select
                id="productGroup"
                name="productGroup"
                className="pa-select"
                value={formData.productGroup}
                onChange={handleInputChange}
                disabled={isLoadingProductGroups}
                required
              >
                <option value="">
                  {isLoadingProductGroups ? "Loading..." : "Select Group..."}
                </option>
                {productGroupOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pa-field-group">
              <label htmlFor="uomGroup">UOM Group:</label>
              <select
                id="uomGroup"
                name="uomGroup"
                className="pa-select"
                value={formData.uomGroup}
                onChange={handleInputChange}
                disabled={isLoadingUomGroups}
              >
                <option value="">
                  {isLoadingUomGroups
                    ? "Loading..."
                    : "Select UOM Group (Optional)"}
                </option>
                {uomGroupOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* UOM Field Group - Hybrid Input - Revised Structure */}
            <div className="pa-field-group pa-uom-hybrid-container">
              {" "}
              {/* Main container for label + inputs */}
              <label htmlFor="uom">UOM:</label>
              <div className="pa-uom-inputs-wrapper">
                {" "}
                {/* Wrapper for select and manual input */}
                <select
                  id="uom"
                  name="uom"
                  className="pa-select"
                  value={formData.uom}
                  onChange={handleInputChange}
                  disabled={isLoadingUoms}
                  required
                >
                  {isLoadingUoms && uomOptions.length <= 1 ? (
                    <option value="">Loading UOMs...</option>
                  ) : (
                    uomOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                  )}
                </select>
                {formData.uom === MANUAL_UOM_ENTRY_VALUE && (
                  <input
                    type="text"
                    name="manualUomValue"
                    className="pa-input pa-input-manual-uom"
                    value={manualUomValue}
                    onChange={handleInputChange}
                    placeholder="Enter UOM manually"
                    required
                  />
                )}
              </div>
            </div>

            <div className="pa-field-group">
              <label>Image Preview:</label>
              <img
                src={currentImageUrl}
                alt="Product image preview"
                className="pa-current-image-preview"
                onLoad={() => setIsImageLoading(false)}
                // Apply opacity style based on our loading state
                style={{ opacity: isImageLoading ? 0 : 1 }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = PLACEHOLDER_IMG_PATH;
                }}
              />
            </div>

            <div className="pa-field-group">
              <label htmlFor="uploadImage">Upload Image:</label>
              <div className="pa-file-input-wrapper">
                <input
                  type="text"
                  id="imageFileName"
                  name="imageFileName"
                  className="pa-input"
                  value={formData.imageFileName}
                  placeholder="No file chosen"
                  readOnly
                  onClick={handleBrowseClick}
                />
                <button
                  type="button"
                  className="pa-browse-button"
                  onClick={handleBrowseClick}
                >
                  Browse Files
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="pa-hidden-file-input"
                  accept="image/png, image/jpeg, image/webp, image/jpg"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="pa-form-column">
            <div className="pa-field-group">
              <label htmlFor="hsn">HSN:</label>
              <input
                type="text"
                id="hsn"
                name="hsn"
                className="pa-input"
                value={formData.hsn}
                onChange={handleInputChange}
                placeholder="e.g., 1234.56.78"
              />
            </div>

            <div className="pa-field-group">
              <label htmlFor="wholesalePrice">Wholesale Price:</label>
              <input
                type="number"
                id="wholesalePrice"
                name="wholesalePrice"
                className="pa-input"
                value={formData.wholesalePrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
            <div className="pa-field-group">
              <label htmlFor="retailPrice">Retail Price:</label>
              <input
                type="number"
                id="retailPrice"
                name="retailPrice"
                className="pa-input"
                value={formData.retailPrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pa-footer">
        <div className="pa-footer-actions-main">
          <button
            className="pa-btn primary"
            onClick={handleSave}
            disabled={isSubmitting || anyDropdownLoading}
          >
            {isSubmitting ? "Adding..." : "Add Product"}
          </button>
        </div>
        <button
          className="pa-btn cancel"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ProductsAdd;
