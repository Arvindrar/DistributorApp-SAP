import { useState, useEffect, useMemo, useRef } from "react";

/**
 * A powerful pagination hook that supports both fixed and dynamic items-per-page.
 * @param {Array} data - The full array of data to be paginated.
 * @param {Object} options - Configuration options.
 * @param {number} [options.fixedItemsPerPage] - If provided, uses a fixed number of items per page.
 * @returns An object with pagination state, functions, and refs for dynamic calculation.
 */
const useDynamicPagination = (data, { fixedItemsPerPage } = {}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(fixedItemsPerPage || 1);

  // Refs for dynamic height calculation
  const containerRef = useRef(null);
  const itemRef = useRef(null);

  useEffect(() => {
    // If a fixed number is provided, just use it and do nothing else.
    if (fixedItemsPerPage) {
      setItemsPerPage(fixedItemsPerPage);
      return;
    }

    // --- Dynamic Calculation Logic ---
    const calculateItems = () => {
      if (containerRef.current && itemRef.current) {
        const containerHeight = containerRef.current.offsetHeight;
        const itemHeight = itemRef.current.offsetHeight;

        // Ensure itemHeight is not zero to avoid division by zero errors
        if (itemHeight > 0) {
          const newItemsPerPage = Math.max(
            1,
            Math.floor(containerHeight / itemHeight)
          );
          setItemsPerPage(newItemsPerPage);
        }
      }
    };

    // Calculate on mount and when data is available
    calculateItems();

    // Recalculate when the window is resized
    window.addEventListener("resize", calculateItems);

    // Cleanup the event listener when the component unmounts
    return () => window.removeEventListener("resize", calculateItems);
  }, [data, fixedItemsPerPage]); // Rerun effect if data or mode changes

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const currentPageData = useMemo(() => {
    const begin = (currentPage - 1) * itemsPerPage;
    const end = begin + itemsPerPage;
    return data.slice(begin, end);
  }, [data, currentPage, itemsPerPage]);

  const nextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  return {
    currentPage,
    totalPages,
    setCurrentPage,
    currentPageData,
    nextPage,
    prevPage,
    // Return refs so the component can attach them to DOM elements
    containerRef,
    itemRef,
  };
};

export default useDynamicPagination;
