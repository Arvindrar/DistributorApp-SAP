// src/components/Home/Home.jsx
import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./Home.css"; // Your existing Home.css
import Sidebar from "./Sidebar";

// Main pages
import Dashboard from "../Dashboard/Dashboard";
import Customers from "./Customers";
import AddCustomers from "./AddCustomers";
import Products from "./pages/Products";
import ProductsAdd from "./pages/ProductsAdd";
import Purchase from "./pages/Purchase";
import Sales from "./pages/Sales";
import SalesAdd from "./pages/SalesAdd";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";

// Customer submenu pages
import CustomerRelationshipMgmt from "./Customers"; // Assuming this is the component for CRM
import CustomerGroup from "./CustomerGroup";

// Product submenu pages
import ProductsGroup from "./pages/ProductsGroup";

// Sales & Purchase submenu page components

import IncomingPayment from "./pages/IncomingPayment";
import PurchaseAdd from "./pages/PurchaseAdd";
import GRPO from "./pages/GRPO";
import GRPOadd from "./pages/GRPOadd";
// Placeholder for pages you might need for other submenu items
import OutgoingPayment from "./pages/OutgoingPayment";
import SalesEmployee from "./pages/SalesEmployee";
import Routess from "./pages/Routess";
import UpdateCustomers from "./UpdateCustomers";
import ProductsUpdate from "./pages/ProductsUpdate";
import ShippingType from "./pages/ShippingType";
import UOM from "./pages/UOM";
import UOMGroup from "./pages/UOMGroup";
import APCreditNote from "./pages/APCreditNote";
import ARCreditNote from "./pages/ARCreditNote";
import Vendors from "./pages/Vendors";
import VendorGroup from "./pages/VendorGroup";
import Tax from "./pages/Tax";
import VendorsAdd from "./pages/VendorsAdd";
import VendorsUpdate from "./pages/VendorsUpdate";
//import SalesView from "./pages/SalesView";
import SalesUpdate from "./pages/SalesUpdate";
import Warehouse from "./pages/Warehouse";
import SalesEmployeeUpdate from "./pages/SalesEmployeeUpdate";
import ARInvoice from "./pages/ARInvoice";
import ARInvoiceAdd from "./pages/ARInvoiceAdd";
import PurchaseUpdate from "./pages/PurchaseUpdate";
import GRPOupdate from "./pages/GRPOupdate";
import ARInvoiceUpdate from "./pages/ARInvoiceUpdate";
import APCreditNoteAdd from "./pages/APCreditNoteAdd";

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  // Initialize activePage - useEffect will refine this on mount and path changes
  const [activePage, setActivePage] = useState("Dashboard");

  const sidebarNavItems = [
    "Business Partners",
    "Products",
    "Purchase",
    "Sales",
    "Inventory",
    "Reports",
  ];

  useEffect(() => {
    const path = location.pathname.toLowerCase();

    // <<< MODIFIED: Handle Dashboard case first
    if (path === "/" || path === "/dashboard") {
      setActivePage("Dashboard");
      return; // Early exit if it's the dashboard
    }

    // --- Logic to determine active main navigation item based on path ---
    let currentNavItem = ""; // Default to empty or a specific default if preferred

    if (
      path.startsWith("/purchaseorder") ||
      path.startsWith("/grpo") ||
      path.startsWith("/apcreditnote") ||
      path.startsWith("/outgoingpayment") // Assuming this path exists
    ) {
      currentNavItem = "Purchase";
    } else if (
      path.startsWith("/salesorder") ||
      path.startsWith("/arinvoice") ||
      path.startsWith("/arcreditnote") ||
      path.startsWith("/incomingpayment")
    ) {
      currentNavItem = "Sales";
    } else if (
      path.startsWith("/vendor") ||
      path.startsWith("/vendorgroup") ||
      path.startsWith("/customerrelationshipmgmt") ||
      path.startsWith("/customergroup") ||
      path.startsWith("/routess") || // Assuming this path exists
      path.startsWith("/salesemployee") || // Assuming this path exists
      path.startsWith("/shippingtype") ||
      path.startsWith("/customers") || // Catches /customers, /customers/add
      path.startsWith("/tax")
    ) {
      currentNavItem = "Business Partners";
    } else if (
      path.startsWith("/productdetails") ||
      path.startsWith("/productsgroup") ||
      path.startsWith("/uom") ||
      path.startsWith("/uomgroup") ||
      path.startsWith("/products") || // Catches /products, /products/add
      path.startsWith("/warehouse") // Catches /products, /products/add
    ) {
      currentNavItem = "Products";
    } else {
      // Fallback for direct main item paths (e.g., /inventory, /reports)
      const matchedMain = sidebarNavItems.find((item) => {
        let itemPathSegment = item.toLowerCase().replace(/\s+/g, "");
        if (item === "Business Partners") itemPathSegment = "customers"; // Special case for Business Partners

        return path.startsWith(`/${itemPathSegment}`);
      });
      if (matchedMain) {
        currentNavItem = matchedMain;
      } else {
        // If no specific match, you might want a default or leave as is
        // For instance, default to the first item if no other match and not dashboard
        currentNavItem = sidebarNavItems[0]; // Default to "Customers"
      }
    }
    setActivePage(currentNavItem);
  }, [location.pathname, sidebarNavItems]); // Removed sidebarNavItems as it's constant within this scope

  const handlePageChange = (pageName) => {
    // <<< MODIFIED: Handle "Dashboard" navigation
    if (pageName === "Dashboard") {
      navigate("/");
      return;
    }

    let pathSegment = pageName.toLowerCase().replace(/\s+/g, "");

    // Specific mappings for submenu items to ensure correct navigation
    if (pageName === "Vendor") pathSegment = "vendor";
    if (pageName === "Vendor Group") pathSegment = "vendorgroup";
    if (pageName === "Purchase Order") pathSegment = "purchaseorder";
    if (pageName === "Business Partners") pathSegment = "customers";
    if (pageName === "Sales Order") pathSegment = "salesorder";
    if (pageName === "Customer Relationship Mgmt")
      pathSegment = "customerrelationshipmgmt";
    if (pageName === "Customer Group") pathSegment = "customergroup";
    if (pageName === "UOM") pathSegment = "uom";
    if (pageName === "Warehouse") pathSegment = "warehouse";
    if (pageName === "UOM Group") pathSegment = "uomgroup";
    if (pageName === "Routess") pathSegment = "routess"; // Ensure you have a route for '/route'
    if (pageName === "Sales Employee") pathSegment = "salesemployee"; // Ensure you have a route for '/salesemployee'
    if (pageName === "Shipping Type") pathSegment = "shippingtype";
    if (pageName === "Tax") pathSegment = "tax";
    if (pageName === "Product Details") pathSegment = "productdetails";
    if (pageName === "Products Group") pathSegment = "productsgroup";
    if (pageName === "GRPO") pathSegment = "grpo";
    if (pageName === "AP Credit Note") pathSegment = "apcreditnote";

    if (pageName === "Outgoing Payment") pathSegment = "outgoingpayment"; // Ensure you have a route
    if (pageName === "ARInvoice") pathSegment = "arinvoice";
    if (pageName === "AR Credit Note") pathSegment = "arcreditnote"; // Ensure you have a route for AR Credit Note
    if (pageName === "Incoming Payment") pathSegment = "incomingpayment";

    // For main items without specific overrides, the default pathSegment works
    navigate(`/${pathSegment}`);
  };

  return (
    <div className="home-container">
      <Sidebar
        navItems={sidebarNavItems}
        activePage={activePage}
        onPageChange={handlePageChange}
      />
      <main className="main-content">
        <Routes>
          {/* Dashboard Route (Root) */}
          <Route path="/" element={<Dashboard />} />
          {/* Ensure this is the first specific route */}
          <Route path="/dashboard" element={<Navigate replace to="/" />} />
          {/* Optional: redirect /dashboard to / */}
          {/* Customer Routes */}
          <Route path="/vendor" element={<Vendors />} />
          <Route path="/vendor/add" element={<VendorsAdd />} />
          <Route path="/vendor/update/:vendorId" element={<VendorsUpdate />} />
          <Route path="/vendorgroup" element={<VendorGroup />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/add" element={<AddCustomers />} />
          <Route
            path="/customers/update/:customerId"
            element={<UpdateCustomers />}
          />
          <Route
            path="/customerrelationshipmgmt"
            element={<CustomerRelationshipMgmt />}
          />
          <Route path="/customergroup" element={<CustomerGroup />} />
          {/* Add routes for RoutePage and SalesEmployeePage if they exist */}
          <Route path="/routess" element={<Routess />} />
          <Route path="/salesemployee" element={<SalesEmployee />} />
          <Route
            path="/salesemployee/update/:id"
            element={<SalesEmployeeUpdate />}
          />
          <Route path="/shippingtype" element={<ShippingType />} />
          <Route path="/tax" element={<Tax />} />
          {/* Assuming Routess handles Shipping Type */}
          {/* Product Routes */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/add" element={<ProductsAdd />} />
          <Route path="/productdetails" element={<Products />} />
          <Route
            path="/products/update/:productId"
            element={<ProductsUpdate />}
          />
          <Route path="/productsgroup" element={<ProductsGroup />} />
          <Route path="/uom" element={<UOM />} />
          <Route path="/uomgroup" element={<UOMGroup />} />
          <Route path="/warehouse" element={<Warehouse />} />
          {/* Purchase Routes */}
          <Route path="/purchaseorder" element={<Purchase />} />
          <Route path="/purchaseorder/add" element={<PurchaseAdd />} />
          <Route
            path="/purchaseorder/update/:poId"
            element={<PurchaseUpdate />}
          />
          <Route path="/grpo" element={<GRPO />} />
          <Route path="/grpo/add" element={<GRPOadd />} />
          <Route path="/grpo/update/:grpoId" element={<GRPOupdate />} />
          <Route path="/apcreditnote" element={<APCreditNote />} />
          <Route path="/apcreditnote/add" element={<APCreditNoteAdd />} />
          <Route path="/outgoingpayment" element={<OutgoingPayment />} />
          {/* Sales Routes */}
          <Route path="/salesorder" element={<Sales />} />
          <Route path="/salesorder/add" element={<SalesAdd />} />
          <Route path="/salesorder/view/:soId" element={<SalesUpdate />} />
          {/* This is the new route */}
          <Route path="/arinvoice" element={<ARInvoice />} />
          <Route path="/arinvoice/add" element={<ARInvoiceAdd />} />
          <Route
            path="/arinvoice/update/:invoiceId"
            element={<ARInvoiceUpdate />}
          />
          <Route path="/arcreditnote" element={<ARCreditNote />} />
          <Route path="/incomingpayment" element={<IncomingPayment />} />
          {/* Other Main Routes */}
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          {/* Fallback/Default Route - if you want to redirect unknown paths */}
          {/* <Route path="*" element={<Navigate replace to="/" />} /> */}
          {/* Or keep the current default if / is already Dashboard */}
          {/* The Navigate component as the last child of Routes or inside a specific Route
             is usually for unmatched paths, but here '/' is explicitly defined.
             The original Navigate to /customers is fine if / doesn't render Dashboard.
             But since / IS Dashboard, this specific Navigate might be redundant if Dashboard is the default.
          */}
          <Route path="*" element={<Navigate replace to="/" />} />
          {/* Redirect any unmatched path to Dashboard */}
        </Routes>
      </main>
    </div>
  );
}

export default Home;
