// Tax.jsx
import React, { useState, useEffect, useCallback } from "react";
import "./Tax.css"; // Ensure this CSS file is created
import useDynamicPagination from "../../../hooks/useDynamicPagination"; // Adjust path as needed
import Pagination from "../../Common/Pagination"; // Adjust path as needed

const API_BASE_URL = "https://localhost:7074/api"; // <<<< ADJUST THIS TO YOUR BACKEND API PORT

// Simple Modal Component for messages
const MessageModal = ({ message, onClose, type = "success", isActive }) => {
  if (!isActive || !message) return null;
  return (
    <div className="taxd-modal-overlay">
      <div className={`taxd-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="taxd-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className="bi bi-trash"
    viewBox="0 0 16 16"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

const isLastDayOfMonth = (dateString) => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const parts = dateString.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  // Use UTC to create the date to avoid timezone issues when calculating month end
  const date = new Date(Date.UTC(year, month, day));
  // Get the last day of the month in UTC
  const lastDayInMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
  return date.getUTCDate() === lastDayInMonth;
};

const Tax = ({ onActiveTaxCodesChange }) => {
  const initialFormState = {
    taxCode: "",
    taxDescription: "",
    validFrom: "",
    validTo: "",
    cgst: "",
    sgst: "",
    igst: "",
    totalPercentage: "",
  };

  const [taxDeclarations, setTaxDeclarations] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    message: "",
    type: "info",
    isActive: false,
  });
  // --- Pagination Hook ---
  const pagination = useDynamicPagination(taxDeclarations, {
    fixedItemsPerPage: 4,
  });
  const { currentPageData, currentPage, setCurrentPage } = pagination;

  const showModal = (message, type = "info") => {
    setModalState({ message, type, isActive: true });
  };
  const closeModal = () => {
    setModalState({ message: "", type: "info", isActive: false });
  };

  const fetchTaxData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/TaxDeclarations`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to fetch tax data: ${response.status} ${
            errorData || response.statusText
          }`
        );
      }
      const data = await response.json();
      setTaxDeclarations(
        data.map((item, index) => ({ ...item, sNo: index + 1 }))
      );
    } catch (error) {
      console.error("Fetch error:", error);
      showModal(error.message || "Could not load tax declarations.", "error");
      setTaxDeclarations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxData();
  }, [fetchTaxData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    if (name === "cgst" || name === "sgst") {
      if (value.trim() !== "") newFormData.igst = "";
    } else if (name === "igst") {
      if (value.trim() !== "") {
        newFormData.cgst = "";
        newFormData.sgst = "";
      }
    }
    setFormData(newFormData);
  };

  const handleApiError = async (response, defaultMessage) => {
    let errorMessage = defaultMessage;
    try {
      const errorData = await response.json();
      if (errorData) {
        if (errorData.errors && typeof errorData.errors === "object") {
          const messages = [];
          for (const key in errorData.errors) {
            if (
              errorData.errors.hasOwnProperty(key) &&
              Array.isArray(errorData.errors[key])
            ) {
              const fieldName = key.includes(".") ? key.split(".").pop() : key;
              messages.push(
                `${fieldName}: ${errorData.errors[key].join(", ")}`
              );
            }
          }
          if (messages.length > 0) errorMessage = messages.join("\n");
        } else if (errorData.TaxLogic && Array.isArray(errorData.TaxLogic)) {
          errorMessage = errorData.TaxLogic.join("\n");
        } else if (
          errorData.TaxLogic &&
          typeof errorData.TaxLogic === "string"
        ) {
          errorMessage = errorData.TaxLogic;
        } else if (errorData.title && typeof errorData.title === "string") {
          errorMessage =
            errorData.title +
            (errorData.detail ? `\nDetails: ${errorData.detail}` : "");
        } else if (errorData.message && typeof errorData.message === "string") {
          errorMessage = errorData.message;
        } else if (typeof errorData === "string" && errorData.trim() !== "") {
          errorMessage = errorData;
        }
      }
    } catch (e) {
      if (!response.bodyUsed) {
        try {
          const textError = await response.text();
          if (textError.trim()) errorMessage = textError.trim();
        } catch (textE) {
          /* Fallback */
        }
      }
    }
    return errorMessage;
  };

  const handleAddTaxEntry = async () => {
    const errors = [];
    if (!(formData.taxCode ?? "").trim()) errors.push("Tax Code is required.");
    if (!(formData.taxDescription ?? "").trim())
      errors.push("Tax Description is required.");
    if (!formData.validFrom) errors.push("Valid From date is required.");
    if (!formData.validTo) {
      errors.push("Valid To date is required.");
    } else if (!isLastDayOfMonth(formData.validTo)) {
      errors.push("Valid To date must be the last day of the month.");
    }
    if (
      formData.validTo &&
      formData.validFrom &&
      new Date(formData.validTo) < new Date(formData.validFrom)
    ) {
      errors.push("Valid To date cannot be earlier than Valid From date.");
    }

    const cgstTrimmed = (formData.cgst ?? "").trim();
    const sgstTrimmed = (formData.sgst ?? "").trim();
    const igstTrimmed = (formData.igst ?? "").trim();
    const cgstVal = cgstTrimmed !== "" ? parseFloat(cgstTrimmed) : null;
    const sgstVal = sgstTrimmed !== "" ? parseFloat(sgstTrimmed) : null;
    const igstVal = igstTrimmed !== "" ? parseFloat(igstTrimmed) : null;

    if ((cgstVal !== null || sgstVal !== null) && igstVal !== null) {
      errors.push("Cannot provide (CGST or SGST) and IGST simultaneously.");
    } else if (cgstVal !== null && sgstVal === null && sgstTrimmed !== "0") {
      errors.push("SGST is required when CGST is provided (or set SGST to 0).");
    } else if (sgstVal !== null && cgstVal === null && cgstTrimmed !== "0") {
      errors.push("CGST is required when SGST is provided (or set CGST to 0).");
    } else if (cgstVal === null && sgstVal === null && igstVal === null) {
      errors.push("Either (CGST and SGST) or IGST must be provided.");
    }

    const totalPercentageTrimmed = (formData.totalPercentage ?? "").trim();
    if (
      totalPercentageTrimmed === "" ||
      isNaN(parseFloat(totalPercentageTrimmed))
    ) {
      errors.push("Total Percentage is required and must be a number.");
    } else if (parseFloat(totalPercentageTrimmed) < 0) {
      errors.push("Total Percentage cannot be negative.");
    }

    if (errors.length > 0) {
      showModal(errors.join("\n"), "error");
      return;
    }
    setIsSubmitting(true);

    const payload = {
      taxCode: (formData.taxCode ?? "").trim(),
      taxDescription: (formData.taxDescription ?? "").trim(),
      validFrom: formData.validFrom,
      validTo: formData.validTo,
      cgst: cgstTrimmed === "" ? null : parseFloat(cgstTrimmed),
      sgst: sgstTrimmed === "" ? null : parseFloat(sgstTrimmed),
      igst: igstTrimmed === "" ? null : parseFloat(igstTrimmed),
      totalPercentage: parseFloat(totalPercentageTrimmed),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/TaxDeclarations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errMsg = await handleApiError(
          response,
          `Failed to add tax entry. Status: ${response.status}`
        );
        throw new Error(errMsg);
      }
      showModal("Tax entry added successfully!", "success");
      setFormData(initialFormState);
      fetchTaxData();
      setCurrentPage(1); // Reset to page 1 after adding a new entry
    } catch (error) {
      console.error("Add error:", error);
      showModal(error.message || "Could not add tax entry.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id) => {
    const entryToUpdate = taxDeclarations.find((entry) => entry.id === id);
    if (!entryToUpdate) return;
    const payloadForUpdate = {
      taxCode: entryToUpdate.taxCode,
      taxDescription: entryToUpdate.taxDescription,
      validFrom: entryToUpdate.validFrom,
      validTo: entryToUpdate.validTo,
      cgst: entryToUpdate.cgst,
      sgst: entryToUpdate.sgst,
      igst: entryToUpdate.igst,
      totalPercentage: entryToUpdate.totalPercentage,
      isActive: !entryToUpdate.isActive,
    };
    try {
      const response = await fetch(`${API_BASE_URL}/TaxDeclarations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadForUpdate),
      });
      if (!response.ok) {
        const errMsg = await handleApiError(
          response,
          `Failed to update status. Status: ${response.status}`
        );
        throw new Error(errMsg);
      }
      setTaxDeclarations((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e))
      );
    } catch (error) {
      console.error("Update active status error:", error);
      showModal(error.message || "Could not update tax entry status.", "error");
    }
  };

  const handleDeleteTaxEntry = async (id, taxCode) => {
    if (
      !window.confirm(
        `Are you sure you want to delete Tax Code: ${taxCode}? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/TaxDeclarations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errMsg = await handleApiError(
          response,
          `Failed to delete tax entry. Status: ${response.status}`
        );
        throw new Error(errMsg);
      }
      showModal(`Tax Code '${taxCode}' deleted successfully!`, "success");
      fetchTaxData();
    } catch (error) {
      console.error("Delete error:", error);
      showModal(
        error.message || `Could not delete Tax Code '${taxCode}'.`,
        "error"
      );
    }
  };

  useEffect(() => {
    if (onActiveTaxCodesChange) {
      const activeCodes = taxDeclarations
        .filter((tax) => tax.isActive)
        .map((tax) => ({
          code: tax.taxCode,
          description: tax.taxDescription,
          cgst: tax.cgst,
          sgst: tax.sgst,
          igst: tax.igst,
          total: tax.totalPercentage,
        }));
      onActiveTaxCodesChange(activeCodes);
    }
  }, [taxDeclarations, onActiveTaxCodesChange]);

  const isIgstDisabled =
    !!(formData.cgst ?? "").trim() || !!(formData.sgst ?? "").trim();
  const isCgstSgstDisabled = !!(formData.igst ?? "").trim();

  return (
    <div className="taxd-page-content">
      <MessageModal
        message={modalState.message}
        onClose={closeModal}
        type={modalState.type}
        isActive={modalState.isActive}
      />
      <h1 className="taxd-main-title">Tax Determination</h1>

      <div className="taxd-table-responsive-container">
        <table className="taxd-data-table">
          <thead>
            <tr>
              <th className="taxd-th-sno">S.No.</th>
              <th className="taxd-th-code">Tax Code</th>
              <th className="taxd-th-desc">Tax Description</th>
              <th className="taxd-th-date">Valid From</th>
              <th className="taxd-th-date">Valid To</th>
              <th className="taxd-th-percent">CGST (%)</th>
              <th className="taxd-th-percent">SGST (%)</th>
              <th className="taxd-th-percent">IGST (%)</th>
              <th className="taxd-th-percent">TOTAL (%)</th>
              <th className="taxd-th-active">ACTIVE</th>
              <th className="taxd-th-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="11" className="taxd-loading-cell">
                  Loading tax entries...
                </td>
              </tr>
            )}
            {!isLoading &&
              currentPageData.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="taxd-td-sno">
                    {(currentPage - 1) * 4 + index + 1}
                  </td>
                  <td>{entry.taxCode}</td>
                  <td>{entry.taxDescription}</td>
                  {/* MODIFIED DATE DISPLAY */}
                  <td>
                    {entry.validFrom
                      ? new Date(entry.validFrom).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    {entry.validTo
                      ? new Date(entry.validTo).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="taxd-td-percent">
                    {entry.cgst !== null && entry.cgst !== undefined
                      ? `${entry.cgst}%`
                      : ""}
                  </td>
                  <td className="taxd-td-percent">
                    {entry.sgst !== null && entry.sgst !== undefined
                      ? `${entry.sgst}%`
                      : ""}
                  </td>
                  <td className="taxd-td-percent">
                    {entry.igst !== null && entry.igst !== undefined
                      ? `${entry.igst}%`
                      : ""}
                  </td>
                  <td className="taxd-td-percent">
                    {entry.totalPercentage !== null &&
                    entry.totalPercentage !== undefined
                      ? `${entry.totalPercentage}%`
                      : ""}
                  </td>
                  <td className="taxd-td-active">
                    <input
                      type="checkbox"
                      className="taxd-table-checkbox"
                      checked={entry.isActive}
                      onChange={() => handleToggleActive(entry.id)}
                    />
                  </td>
                  <td className="taxd-td-action">
                    <button
                      className="taxd-delete-button"
                      onClick={() =>
                        handleDeleteTaxEntry(entry.id, entry.taxCode)
                      }
                      title={`Delete Tax Code: ${entry.taxCode}`}
                      disabled={isSubmitting}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))}
            {!isLoading &&
              taxDeclarations.length === 0 &&
              !modalState.isActive && (
                <tr>
                  <td colSpan="11" className="taxd-no-data-cell">
                    No tax entries found. Add new ones below.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* --- ADD PAGINATION COMPONENT HERE --- */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onNext={pagination.nextPage}
        onPrevious={pagination.prevPage}
      />

      <div className="taxd-create-section">
        <h3 className="taxd-create-title">Create New Tax Entry</h3>
        <div className="taxd-form-grid">
          <div className="taxd-form-field">
            <label htmlFor="taxCodeInput" className="taxd-label">
              Tax Code:
            </label>
            <input
              type="text"
              id="taxCodeInput"
              name="taxCode"
              className="taxd-input"
              value={formData.taxCode}
              onChange={handleInputChange}
              placeholder="E.g., GST5, IGST12"
              disabled={isSubmitting}
            />
          </div>
          <div className="taxd-form-field">
            <label htmlFor="taxDescriptionInput" className="taxd-label">
              Tax Description:
            </label>
            <input
              type="text"
              id="taxDescriptionInput"
              name="taxDescription"
              className="taxd-input"
              value={formData.taxDescription}
              onChange={handleInputChange}
              placeholder="E.g., Standard GST 5%"
              disabled={isSubmitting}
            />
          </div>
          <div className="taxd-form-field">
            <label htmlFor="validFromInput" className="taxd-label">
              Valid From:
            </label>
            <input
              type="date"
              id="validFromInput"
              name="validFrom"
              className="taxd-input"
              value={formData.validFrom}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="taxd-form-field">
            <label htmlFor="validToInput" className="taxd-label">
              Valid To:
            </label>
            <input
              type="date"
              id="validToInput"
              name="validTo"
              className="taxd-input"
              value={formData.validTo}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="taxd-form-field">
            <label htmlFor="cgstInput" className="taxd-label">
              CGST (%):
            </label>
            <input
              type="number"
              id="cgstInput"
              name="cgst"
              className="taxd-input taxd-input-number"
              value={formData.cgst}
              onChange={handleInputChange}
              placeholder="E.g., 2.5"
              disabled={isSubmitting || isCgstSgstDisabled}
              step="any"
              min="0"
            />
          </div>
          <div className="taxd-form-field">
            <label htmlFor="sgstInput" className="taxd-label">
              SGST (%):
            </label>
            <input
              type="number"
              id="sgstInput"
              name="sgst"
              className="taxd-input taxd-input-number"
              value={formData.sgst}
              onChange={handleInputChange}
              placeholder="E.g., 2.5"
              disabled={isSubmitting || isCgstSgstDisabled}
              step="any"
              min="0"
            />
          </div>
          <div className="taxd-form-field">
            <label htmlFor="igstInput" className="taxd-label">
              IGST (%):
            </label>
            <input
              type="number"
              id="igstInput"
              name="igst"
              className="taxd-input taxd-input-number"
              value={formData.igst}
              onChange={handleInputChange}
              placeholder="E.g., 12"
              disabled={isSubmitting || isIgstDisabled}
              step="any"
              min="0"
            />
          </div>
          <div className="taxd-form-field">
            <label htmlFor="totalPercentageInput" className="taxd-label">
              TOTAL (%):
            </label>
            <input
              type="number"
              id="totalPercentageInput"
              name="totalPercentage"
              className="taxd-input taxd-input-number"
              value={formData.totalPercentage}
              onChange={handleInputChange}
              placeholder="E.g., 5 or 12"
              disabled={isSubmitting}
              step="any"
              min="0"
            />
          </div>
        </div>
        <button
          type="button"
          className="taxd-add-button"
          onClick={handleAddTaxEntry}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Adding..." : "Add Tax Entry"}
        </button>
      </div>
    </div>
  );
};

export default Tax;
