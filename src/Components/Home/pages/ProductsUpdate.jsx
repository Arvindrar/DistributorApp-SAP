import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProductsUpdate.css";
import {
  API_PRODUCTS_ENDPOINT,
  API_PRODUCT_GROUPS_ENDPOINT,
  API_UOM_ENDPOINT,
  API_UOM_GROUP_ENDPOINT,
  IMAGES_BASE_URL,
  PLACEHOLDER_IMG_PATH,
} from "../../../config";

const MANUAL_UOM_ENTRY_VALUE = "__MANUAL_ENTRY__";

// --- Modal Components ---
const MessageModal = ({ message, onClose, type = "success" }) => {
  if (!message) return null;
  return (
    <div className="pu-modal-overlay">
      <div className={`pu-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="pu-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  isConfirming,
}) => {
  if (!isOpen) return null;
  return (
    <div className="pu-modal-overlay">
      <div className="pu-modal-content pu-confirmation-modal">
        {title && <h4 className="pu-modal-title">{title}</h4>}
        <p className="pu-modal-message">{message}</p>
        <div className="pu-modal-actions">
          <button
            onClick={onClose}
            className="pu-modal-button pu-modal-button-cancel"
            disabled={isConfirming}
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className="pu-modal-button pu-modal-button-confirm pu-modal-button-danger"
            disabled={isConfirming}
          >
            {isConfirming ? "Processing..." : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
// --- End Modal Components ---

function ProductsUpdate() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const fileInputRef = useRef(null);

  const [initialFetchedData, setInitialFetchedData] = useState(null);

  const initialFormDataState = {
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

  const [formData, setFormData] = useState(initialFormDataState);
  const [manualUomValue, setManualUomValue] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(PLACEHOLDER_IMG_PATH);

  const [productGroupOptions, setProductGroupOptions] = useState([]);
  const [isLoadingProductGroups, setIsLoadingProductGroups] = useState(true);

  const [uomOptions, setUomOptions] = useState([]);
  const [isLoadingUoms, setIsLoadingUoms] = useState(true);

  const [uomGroupOptions, setUomGroupOptions] = useState([]);
  const [isLoadingUomGroups, setIsLoadingUomGroups] = useState(true);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const fetchDropdownOptions = useCallback(
    async (
      endpoint,
      setOptions,
      setLoading,
      resourceName,
      addManualOption = false
    ) => {
      console.log(`[FETCH Dropdown ${resourceName}] START`);
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
        console.log(`[FETCH Dropdown ${resourceName}] SUCCESS - Options set.`);
      } catch (e) {
        console.error(`[FETCH Dropdown ${resourceName}] ERROR:`, e);
        setModalMessage(e.message || `Could not load ${resourceName}.`);
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
        console.log(
          `[FETCH Dropdown ${resourceName}] FINALLY - setting loading to false`
        );
        setLoading(false);
      }
    },
    []
  );

  const fetchProductData = useCallback(async () => {
    if (!productId) {
      setModalMessage("Product ID is missing for fetching data.");
      setModalType("error");
      setIsLoadingData(false);
      return;
    }
    console.log(`[FETCH ProductData] START - ID: ${productId}`);
    setIsLoadingData(true);
    try {
      const response = await fetch(`${API_PRODUCTS_ENDPOINT}/${productId}`);
      console.log(`[FETCH ProductData] Response status: ${response.status}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Product not found.");
        throw new Error(
          `HTTP error fetching product! status: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("[FETCH ProductData] SUCCESS - Fetched data:", data);
      const fetchedData = {
        productCode: data.sku || "",
        productName: data.name || "",
        productGroup: data.group || "",
        uomGroup: data.uomGroup || "",
        uom: data.uom || "",
        hsn: data.hsn || "",
        retailPrice: data.retailPrice !== null ? String(data.retailPrice) : "",
        wholesalePrice:
          data.wholesalePrice !== null ? String(data.wholesalePrice) : "",
        imageFileName: data.imageFileName || "",
      };
      setFormData(fetchedData);
      setInitialFetchedData(fetchedData);
      setCurrentImageUrl(
        data.imageFileName
          ? `${IMAGES_BASE_URL}/${data.imageFileName}`
          : PLACEHOLDER_IMG_PATH
      );
    } catch (e) {
      console.error("[FETCH ProductData] ERROR:", e);
      if (!modalMessage) {
        setModalMessage(e.message || "Failed to load product data.");
        setModalType("error");
      }
    } finally {
      console.log(
        "[FETCH ProductData] FINALLY - setting isLoadingData to false"
      );
      setIsLoadingData(false);
    }
  }, [productId, modalMessage]);

  useEffect(() => {
    console.log("[EFFECT Main Fetch] Running fetches...");
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
    fetchProductData(); // Fetch main product data
  }, [fetchDropdownOptions, fetchProductData]); // fetchProductData is now primarily dependent on productId

  useEffect(() => {
    if (
      initialFetchedData &&
      initialFetchedData.uom &&
      uomOptions.length > 0 &&
      !isLoadingUoms
    ) {
      console.log(
        "[EFFECT UOM Reconcile] Running. Initial UOM:",
        initialFetchedData.uom,
        "UOM Options available:",
        uomOptions.length
      );
      const currentUomValue = initialFetchedData.uom;
      const isStandardOption = uomOptions.some(
        (opt) =>
          opt.value === currentUomValue &&
          opt.value !== MANUAL_UOM_ENTRY_VALUE &&
          opt.value !== ""
      );

      console.log(
        "[EFFECT UOM Reconcile] Is standard option:",
        isStandardOption
      );

      if (!isStandardOption) {
        const manualOptionExists = uomOptions.find(
          (o) => o.value === MANUAL_UOM_ENTRY_VALUE
        );
        if (manualOptionExists) {
          console.log(
            "[EFFECT UOM Reconcile] Setting UOM to manual entry. Value:",
            currentUomValue
          );
          setFormData((prev) => ({ ...prev, uom: MANUAL_UOM_ENTRY_VALUE }));
          setManualUomValue(currentUomValue);
        } else {
          console.log(
            "[EFFECT UOM Reconcile] Manual option not found in uomOptions yet."
          );
        }
      } else {
        setFormData((prev) => ({ ...prev, uom: currentUomValue }));
        setManualUomValue("");
        console.log(
          "[EFFECT UOM Reconcile] UOM is a standard option. Clearing manualUomValue."
        );
      }
    } else {
      // console.log("[EFFECT UOM Reconcile] Skipping: initialFetchedData:", !!initialFetchedData, "uomOptions.length:", uomOptions.length, "!isLoadingUoms:", !isLoadingUoms);
    }
  }, [initialFetchedData, uomOptions, isLoadingUoms]);

  const handleInputChange = (e) => {
    /* ... same as before ... */
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
    if (modalMessage && modalType === "error" && !showDeleteConfirmModal) {
      setModalMessage("");
    }
  };
  const handleFileChange = (e) => {
    /* ... same as before ... */
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
      setImageFile(file);
      setFormData((prev) => ({ ...prev, imageFileName: file.name }));
      setCurrentImageUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      const originalFileName = initialFetchedData?.imageFileName || "";
      setFormData((prev) => ({ ...prev, imageFileName: originalFileName }));
      setCurrentImageUrl(
        originalFileName
          ? `${IMAGES_BASE_URL}/${originalFileName}`
          : PLACEHOLDER_IMG_PATH
      );
    }
  };
  const handleBrowseClick = () => fileInputRef.current.click();

  const validateForm = () => {
    /* ... same as before, uses manualUomValue if needed ... */
    if (!formData.productCode.trim()) {
      setModalMessage("Product Code (SKU) is required.");
      setModalType("error");
      return false;
    }
    if (!formData.productName.trim()) {
      setModalMessage("Product Name is required.");
      setModalType("error");
      return false;
    }
    if (!formData.productGroup) {
      setModalMessage("Product Group is required.");
      setModalType("error");
      return false;
    }
    const finalUom =
      formData.uom === MANUAL_UOM_ENTRY_VALUE
        ? manualUomValue.trim()
        : formData.uom;
    if (!finalUom) {
      setModalMessage("UOM (Unit of Measure) is required.");
      setModalType("error");
      return false;
    }
    const hsnValue = formData.hsn.trim();
    if (hsnValue && !/^\d{4}\.\d{2}\.\d{2}$/.test(hsnValue)) {
      setModalMessage(
        "HSN must be in the format xxxx.xx.xx (e.g., 1234.56.78) if provided."
      );
      setModalType("error");
      return false;
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
      return false;
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
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    /* ... same as before, uses manualUomValue ... */
    setModalMessage("");
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    const dataToSubmit = new FormData();
    dataToSubmit.append("SKU", formData.productCode.trim());
    dataToSubmit.append("ProductName", formData.productName.trim());
    dataToSubmit.append("ProductGroup", formData.productGroup);
    const finalUom =
      formData.uom === MANUAL_UOM_ENTRY_VALUE
        ? manualUomValue.trim()
        : formData.uom;
    dataToSubmit.append("UOM", finalUom);
    if (formData.uomGroup) dataToSubmit.append("UOMGroup", formData.uomGroup);
    const hsnValue = formData.hsn.trim();
    if (hsnValue) dataToSubmit.append("HSN", hsnValue);
    if (formData.retailPrice.trim())
      dataToSubmit.append("RetailPrice", parseFloat(formData.retailPrice));
    if (formData.wholesalePrice.trim())
      dataToSubmit.append(
        "WholesalePrice",
        parseFloat(formData.wholesalePrice)
      );
    if (imageFile)
      dataToSubmit.append("ProductImage", imageFile, imageFile.name);

    try {
      const response = await fetch(`${API_PRODUCTS_ENDPOINT}/${productId}`, {
        method: "PUT",
        body: dataToSubmit,
      });
      const responseBodyText = await response.text();
      if (!response.ok) {
        /* ... error handling ... */
        let errorMessage = `API Error (${response.status})`;
        try {
          const errorData = JSON.parse(responseBodyText);
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
            errorMessage = `Update failed. Status: ${
              response.status
            }. Response: ${responseBodyText.substring(0, 200)}`;
        } catch (e) {
          errorMessage = `Update failed. Status: ${
            response.status
          }. Could not parse error. Raw: ${responseBodyText.substring(0, 200)}`;
        }
        throw new Error(errorMessage);
      }
      setModalMessage("Product Updated Successfully!");
      setModalType("success");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchProductData();
    } catch (e) {
      setModalMessage(
        e.message || "Failed to update product. Please try again."
      );
      setModalType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveClick = () => {
    /* ... same as before ... */
    setModalMessage("");
    setShowDeleteConfirmModal(true);
  };
  const confirmDelete = async () => {
    /* ... same as before ... */
    setIsRemoving(true);
    setModalMessage("");
    try {
      const response = await fetch(`${API_PRODUCTS_ENDPOINT}/${productId}`, {
        method: "DELETE",
      });
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorMessage = `API Error (${response.status})`;
        try {
          const errorData = JSON.parse(responseBodyText);
          if (errorData?.title) errorMessage = errorData.title;
          else if (errorData?.message) errorMessage = errorData.message;
          else if (typeof errorData === "string" && errorData.trim() !== "")
            errorMessage = errorData.trim();
          else
            errorMessage = `Delete failed. Status: ${
              response.status
            }. Response: ${responseBodyText.substring(0, 200)}`;
        } catch {
          errorMessage = `Delete failed. Status: ${
            response.status
          }. Could not parse. Raw: ${responseBodyText.substring(0, 200)}`;
        }
        throw new Error(errorMessage);
      }
      setModalMessage("Product Removed Successfully!");
      setModalType("success");
    } catch (e) {
      setModalMessage(e.message || "Failed to remove product.");
      setModalType("error");
    } finally {
      setIsRemoving(false);
      setShowDeleteConfirmModal(false);
    }
  };
  const handleCancel = () => {
    /* ... same as before ... */
    if (!isSubmitting && !isRemoving) navigate("/products");
  };
  const closeModal = () => {
    /* ... same as before ... */
    const currentModalType = modalType;
    const currentMessage = modalMessage;
    setModalMessage("");
    if (
      currentModalType === "success" &&
      (currentMessage === "Product Updated Successfully!" ||
        currentMessage === "Product Removed Successfully!")
    ) {
      navigate("/products", { state: { refreshProducts: true } });
    }
  };

  const anyDropdownLoading =
    isLoadingProductGroups || isLoadingUoms || isLoadingUomGroups;

  console.log("--- ProductsUpdate Render ---");
  console.log("productId:", productId);
  console.log("isLoadingData:", isLoadingData);
  console.log("isLoadingProductGroups:", isLoadingProductGroups);
  console.log("isLoadingUoms:", isLoadingUoms);
  console.log("isLoadingUomGroups:", isLoadingUomGroups);
  console.log("anyDropdownLoading:", anyDropdownLoading);
  console.log("initialFetchedData IS NULL:", initialFetchedData === null);

  if (isLoadingData || (anyDropdownLoading && !initialFetchedData)) {
    return <div className="pu-page-container">Loading product data...</div>;
  }

  if (!initialFetchedData && !isLoadingData && productId) {
    return (
      <div className="pu-page-container error-message">
        <p>
          Could not load product data.{" "}
          {modalMessage ||
            "Please try again later or check if the product exists."}
        </p>
        <button onClick={() => navigate("/products")}>Back to Products</button>
      </div>
    );
  }

  return (
    <div className="pu-page-container">
      {modalMessage && !showDeleteConfirmModal && (
        <MessageModal
          message={modalMessage}
          onClose={closeModal}
          type={modalType}
        />
      )}
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to remove product "${
          formData.productName || "this product"
        }" (Code: ${
          formData.productCode || "N/A"
        })? This action cannot be undone.`}
        confirmButtonText="Yes, Remove"
        isConfirming={isRemoving}
      />

      {/* <div className="pu-header-bar">
        <h1 className="pu-main-title">Update Product</h1>
      </div> */}

      <div className="pu-form-content-area">
        <div className="pu-form-grid">
          {/* Column 1 */}
          <div className="pu-form-column">
            <div className="pu-field-group">
              <label htmlFor="productCode">Product Code (SKU):</label>
              <input
                type="text"
                id="productCode"
                name="productCode"
                className="pu-input"
                value={formData.productCode}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="pu-field-group">
              <label htmlFor="productName">Product Name:</label>
              <input
                type="text"
                id="productName"
                name="productName"
                className="pu-input"
                value={formData.productName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="pu-field-group">
              <label htmlFor="productGroup">Product Group:</label>
              <select
                id="productGroup"
                name="productGroup"
                className="pu-select"
                value={formData.productGroup}
                onChange={handleInputChange}
                disabled={isLoadingProductGroups}
                required
              >
                <option value="">
                  {isLoadingProductGroups ? "Loading..." : "Select Group"}
                </option>
                {productGroupOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="pu-field-group">
              <label htmlFor="uomGroup">UOM Group:</label>
              <select
                id="uomGroup"
                name="uomGroup"
                className="pu-select"
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
            <div className="pu-field-group">
              <label>Current Image:</label>
              <img
                src={currentImageUrl}
                alt={formData.productName || "Product image"}
                className="pu-current-image-preview"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = PLACEHOLDER_IMG_PATH;
                }}
              />
            </div>
            <div className="pu-field-group">
              <label htmlFor="uploadImage">Change Image:</label>
              <div className="pu-file-input-wrapper">
                <input
                  type="text"
                  id="imageFileNameDisplay"
                  name="imageFileNameDisplay"
                  className="pu-input"
                  value={formData.imageFileName}
                  placeholder="No file chosen"
                  readOnly
                  onClick={handleBrowseClick}
                />
                <button
                  type="button"
                  className="pu-browse-button"
                  onClick={handleBrowseClick}
                >
                  Browse
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="pu-hidden-file-input"
                  accept="image/png, image/jpeg, image/webp, image/jpg"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="pu-form-column">
            <div className="pu-field-group">
              <label htmlFor="hsn">HSN:</label>
              <input
                type="text"
                id="hsn"
                name="hsn"
                className="pu-input"
                value={formData.hsn}
                onChange={handleInputChange}
                placeholder="e.g., 1234.56.78"
              />
            </div>

            <div className="pu-field-group pu-uom-hybrid-container">
              <label htmlFor="uom">UOM:</label>
              <div className="pu-uom-inputs-wrapper">
                <select
                  id="uom"
                  name="uom"
                  className="pu-select"
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
                    className="pu-input pu-input-manual-uom"
                    value={manualUomValue}
                    onChange={handleInputChange}
                    placeholder="Enter UOM manually"
                    required
                  />
                )}
              </div>
            </div>

            <div className="pu-field-group">
              <label htmlFor="wholesalePrice">Wholesale Price:</label>
              <input
                type="number"
                id="wholesalePrice"
                name="wholesalePrice"
                className="pu-input"
                value={formData.wholesalePrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
            <div className="pu-field-group">
              <label htmlFor="retailPrice">Retail Price:</label>
              <input
                type="number"
                id="retailPrice"
                name="retailPrice"
                className="pu-input"
                value={formData.retailPrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pu-footer">
        <div className="pu-footer-actions-main">
          <button
            className="pu-btn primary"
            onClick={handleUpdate}
            disabled={
              isSubmitting || isLoadingData || isRemoving || anyDropdownLoading
            }
          >
            {isSubmitting ? "Updating..." : "Update Product"}
          </button>
          <button
            className="pu-btn danger"
            onClick={handleRemoveClick}
            disabled={isSubmitting || isLoadingData || isRemoving}
          >
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </div>
        <button
          className="pu-btn cancel"
          onClick={handleCancel}
          disabled={isSubmitting || isRemoving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ProductsUpdate;
