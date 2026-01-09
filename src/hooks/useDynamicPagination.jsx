import { useState, useMemo, useCallback } from "react";

/**
 * A custom hook to manage client-side pagination, sorting, and multi-field searching.
 * @param {Array} data The full, unfiltered array of data.
 * @param {Object} options Configuration options.
 * @param {number} options.fixedItemsPerPage The number of items to show per page.
 * @returns An object with pagination state and control functions.
 */
function useDynamicPagination(data, options = {}) {
  const { fixedItemsPerPage = 10 } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerms, setSearchTerms] = useState({}); // Stores search strings for multiple fields, e.g., { DocNum: '123', CardName: 'Maxi' }

  // This is the core filtering logic. It re-runs only when the source data or search terms change.
  const filteredData = useMemo(() => {
    // Get an array of search terms that actually have a value.
    const activeSearchTerms = Object.entries(searchTerms).filter(
      ([, value]) => value
    );

    // If no one is searching for anything, return the original full dataset.
    if (activeSearchTerms.length === 0) {
      return data;
    }

    // Otherwise, filter the data.
    return data.filter((item) => {
      // The 'every' method ensures an item must match ALL active search criteria to be included.
      return activeSearchTerms.every(([key, value]) => {
        const itemValue = item[key];

        // This check is robust:
        // 1. It won't crash if the property (itemValue) is null or undefined.
        // 2. It converts the property to a string to ensure .toLowerCase() and .includes() work.
        // 3. It performs a case-insensitive search.
        return (
          itemValue != null &&
          String(itemValue).toLowerCase().includes(value.toLowerCase())
        );
      });
    });
  }, [data, searchTerms]);

  // Calculate total pages based on the *filtered* data's length.
  const totalPages = Math.ceil(filteredData.length / fixedItemsPerPage);

  // Get the slice of data for the current page from the *filtered* results.
  const currentPageData = useMemo(() => {
    const startIndex = (currentPage - 1) * fixedItemsPerPage;
    const endIndex = startIndex + fixedItemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [currentPage, filteredData, fixedItemsPerPage]);

  // --- Control Functions (wrapped in useCallback for performance) ---

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages || 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (pageNumber) => {
      const page = Math.max(1, Math.min(pageNumber, totalPages || 1));
      setCurrentPage(page);
    },
    [totalPages]
  );

  // This is the function called by your <input> fields.
  const setSearchTerm = useCallback((value, key) => {
    // It updates the state with the new search value for a specific key (e.g., 'DocNum').
    setSearchTerms((prevTerms) => ({
      ...prevTerms,
      [key]: value,
    }));
    // Crucially, it resets the view to page 1 whenever a filter is changed.
    setCurrentPage(1);
  }, []);

  // Return everything the component needs to manage the UI.
  return {
    currentPage,
    totalPages,
    currentPageData,
    nextPage,
    prevPage,
    goToPage,
    setSearchTerm,
    searchTerms, // Expose searchTerms so the input's `value` can be controlled.
    setCurrentPage,
  };
}

export default useDynamicPagination;
