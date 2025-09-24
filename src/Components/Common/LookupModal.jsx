// src/Components/Common/LookupModal.jsx

import React from "react";
import "./LookupModal.css"; // We will create this CSS file next

const LookupModal = ({
  isOpen,
  onClose,
  title,
  searchTerm,
  onSearchChange,
  children, // This will be the table of data
}) => {
  if (!isOpen) return null;

  return (
    <div className="lookup-modal-overlay">
      <div className="lookup-modal-content">
        <div className="lookup-modal-header">
          <h2>{title}</h2>
          <button className="lookup-modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="lookup-modal-body">
          <input
            type="text"
            placeholder="Search..."
            className="lookup-modal-search-input"
            value={searchTerm}
            onChange={onSearchChange}
            autoFocus
          />
          <div className="lookup-modal-table-container">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default LookupModal;
