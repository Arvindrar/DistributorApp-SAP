import React from "react";
import "./Pagination.css"; // We'll create this generic CSS file next

const Pagination = ({ currentPage, totalPages, onNext, onPrevious }) => {
  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or less
  }

  return (
    <div className="pagination-container">
      <button
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="pagination-button"
      >
        Previous
      </button>
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="pagination-button"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
