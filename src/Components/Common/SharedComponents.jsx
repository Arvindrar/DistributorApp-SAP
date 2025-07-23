import React from "react";

export const MessageModal = ({ message, onClose, type = "info" }) => {
  if (!message) return null;
  return (
    <div className="so-add-modal-overlay">
      <div className={`so-add-modal-content ${type}`}>
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <button onClick={onClose} className="so-add-modal-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

export const LookupIcon = () => (
  <span className="lookup-indicator-icon" title="Lookup value">
    ○
  </span>
);

export const LookupModal = ({
  isOpen,
  onClose,
  title,
  searchTerm,
  onSearchChange,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <input
            type="text"
            placeholder="Search..."
            className="modal-search-input"
            value={searchTerm}
            onChange={onSearchChange}
            autoFocus
          />
          {children}
        </div>
      </div>
    </div>
  );
};
