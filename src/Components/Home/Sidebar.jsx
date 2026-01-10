import React, { useState } from "react";

// --- Icon Components (Paste the SVG components from above here, or import them) ---
const HomeIcon = ({ color = "currentColor", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="sidebar-nav-icon"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);
const CustomersIcon = ({ color = "currentColor", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="sidebar-nav-icon"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
const ProductsIcon = ({ color = "currentColor", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="sidebar-nav-icon"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);
const PurchaseIcon = ({ color = "currentColor", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="sidebar-nav-icon"
  >
    <circle cx="9" cy="21" r="1"></circle>{" "}
    <circle cx="20" cy="21" r="1"></circle>{" "}
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>{" "}
    {/* Shopping Cart Icon */}
  </svg>
);
const SalesIcon = ({ color = "currentColor", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="sidebar-nav-icon"
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>{" "}
    {/* Dollar Sign Icon */}
  </svg>
);
const InventoryIcon = ({ color = "currentColor", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="sidebar-nav-icon"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="3" y1="15" x2="21" y2="15"></line>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="15" y1="3" x2="15" y2="21"></line>
  </svg>
);
const ReportsIcon = ({ color = "currentColor", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="sidebar-nav-icon"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);
// --- End Icon Components ---

// Helper to map item name to its icon component
const getItemIcon = (itemName) => {
  switch (itemName) {
    case "Business Partners":
    case "Customers":
      return <CustomersIcon />;
    case "Products":
      return <ProductsIcon />;
    case "Purchase":
      return <PurchaseIcon />;
    case "Sales":
      return <SalesIcon />;
    case "Inventory":
      return <InventoryIcon />;
    case "Reports":
      return <ReportsIcon />;
    default:
      return null; // Or a default icon
  }
};

const Sidebar = ({ navItems, activePage, onPageChange }) => {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isBusinessPartnersOpen, setIsBusinessPartnersOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);

  // Close other submenus when one is opened (optional, but good UX)
  const toggleSubmenu = (setter, currentOpenState) => {
    setIsPurchaseOpen(false);
    setIsBusinessPartnersOpen(false);
    setIsProductsOpen(false);
    setIsSalesOpen(false);
    setter(!currentOpenState); // Toggle the selected one
  };

  return (
    <aside className="sidebar">
      <div
        className={`sidebar-header ${
          activePage === "Dashboard" ? "active-header" : ""
        }`}
        onClick={() => onPageChange("Dashboard")}
      >
        <HomeIcon />
        <span>Dashboard</span>
      </div>

      <ul className="sidebar-list">
        {navItems.map((item) => {
          const itemIcon = getItemIcon(item); // Get the icon for the current item

          if (item === "Purchase") {
            return (
              <React.Fragment key={item}>
                <li
                  className={`sidebar-item ${
                    activePage === item ? "active" : ""
                  }`}
                  onClick={() =>
                    toggleSubmenu(setIsPurchaseOpen, isPurchaseOpen)
                  }
                >
                  {itemIcon} {/* Icon for Purchase */}
                  <span className="sidebar-item-text">{item}</span>
                  <span className="submenu-arrow">
                    {isPurchaseOpen ? "▲" : "▼"}
                  </span>
                </li>
                {isPurchaseOpen && (
                  <div className="submenu open">
                    {/* Submenu items */}
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("Purchase Order")}
                    >
                      Purchase Order
                    </li>
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("GRPO")}
                    >
                      GRPO
                    </li>
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("APInvoice")}
                    >
                      AP Invoice
                    </li>
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("AP Credit Note")}
                    >
                      AP Credit Note
                    </li>
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("Outgoing Payment")}
                    >
                      Outgoing Payment
                    </li>
                  </div>
                )}
              </React.Fragment>
            );
          } else if (item === "Business Partners") {
            return (
              <React.Fragment key={item}>
                <li
                  className={`sidebar-item ${
                    activePage === item ? "active" : ""
                  }`}
                  onClick={() =>
                    toggleSubmenu(
                      setIsBusinessPartnersOpen,
                      isBusinessPartnersOpen
                    )
                  }
                >
                  {itemIcon} {/* Icon for Customers */}
                  <span className="sidebar-item-text">{item}</span>
                  <span className="submenu-arrow">
                    {isBusinessPartnersOpen ? "▲" : "▼"}
                  </span>
                </li>
                {isBusinessPartnersOpen && (
                  <div className="submenu open">
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("Vendor")}
                    >
                      Vendor Master Data
                    </li>
                    {/* <li
                      className="submenu-item"
                      onClick={() => onPageChange("Vendor Group")}
                    >
                      Vendor Group
                    </li> */}
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("Customer Relationship Mgmt")}
                    >
                      Customer Master Data
                    </li>
                    {/* <li
                      className="submenu-item"
                      onClick={() => onPageChange("Customer Group")}
                    >
                      Customer Group
                    </li> */}
                    {/* <li
                      className="submenu-item"
                      onClick={() => onPageChange("Routess")}
                    >
                      Route
                    </li> */}
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("Sales Employee")}
                    >
                      Sales Employee
                    </li>
                    {/* <li
                      className="submenu-item"
                      onClick={() => onPageChange("Shipping Type")}
                    >
                      Shipping Type
                    </li> */}
                    {/* <li
                      className="submenu-item"
                      onClick={() => onPageChange("Tax")}
                    >
                      Tax
                    </li> */}
                  </div>
                )}
              </React.Fragment>
            );
          } else if (item === "Products") {
            return (
              <React.Fragment key={item}>
                <li
                  className={`sidebar-item ${
                    activePage === item ? "active" : ""
                  }`}
                  onClick={() =>
                    toggleSubmenu(setIsProductsOpen, isProductsOpen)
                  }
                >
                  {itemIcon} {/* Icon for Products */}
                  <span className="sidebar-item-text">{item}</span>
                  <span className="submenu-arrow">
                    {isProductsOpen ? "▲" : "▼"}
                  </span>
                </li>
                {isProductsOpen && (
                  <div className="submenu open">
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("Product Details")}
                    >
                      Product Details
                    </li>
                    {/* <li
                      className="submenu-item"
                      onClick={() => onPageChange("Products Group")}
                    >
                      Products Group
                    </li>
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("UOM")}
                    >
                      UOM
                    </li>
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("UOM Group")}
                    >
                      UOM Group
                    </li> */}
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("Warehouse")}
                    >
                      Warehouse
                    </li>
                  </div>
                )}
              </React.Fragment>
            );
          } else if (item === "Sales") {
            return (
              <React.Fragment key={item}>
                <li
                  className={`sidebar-item ${
                    activePage === item ? "active" : ""
                  }`}
                  onClick={() => toggleSubmenu(setIsSalesOpen, isSalesOpen)}
                >
                  {itemIcon} {/* Icon for Sales */}
                  <span className="sidebar-item-text">{item}</span>
                  <span className="submenu-arrow">
                    {isSalesOpen ? "▲" : "▼"}
                  </span>
                </li>
                {isSalesOpen && (
                  <div className="submenu open">
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("Sales Order")}
                    >
                      Sales Order
                    </li>
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("ARInvoice")}
                    >
                      A/R Invoice
                    </li>
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("AR Credit Note")}
                    >
                      A/R Credit Note
                    </li>
                    <li
                      className="submenu-item"
                      onClick={() => onPageChange("Incoming Payment")}
                    >
                      Incoming Payment
                    </li>
                  </div>
                )}
              </React.Fragment>
            );
          } else {
            // For items without submenus like Inventory, Reports
            return (
              <li
                key={item}
                className={`sidebar-item ${
                  item === activePage ? "active" : ""
                }`}
                onClick={() => onPageChange(item)}
              >
                {itemIcon} {/* Icon for non-submenu items */}
                <span className="sidebar-item-text">{item}</span>
              </li>
            );
          }
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
