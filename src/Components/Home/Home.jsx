// src/components/Home/Home.jsx
import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "../../styles/Home.css"; // Your existing Home.css
import Sidebar from "./Sidebar";
import {
  Grid,
  Users,
  Box,
  ShoppingCart,
  DollarSign,
  Archive,
  BarChart2,
  List,
} from "react-feather";

// Main pages
import Dashboard from "../Dashboard/Dashboard";
import Customers from "../Business Partners/Customers";
//import AddCustomers from "./AddCustomers";
import Products from "./pages/Products";
import ProductsAdd from "./pages/ProductsAdd";
import Purchase from "./pages/Purchase";
import Sales from "./pages/Sales";
import SalesAdd from "./pages/SalesAdd";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";

// Customer submenu pages
import CustomerRelationshipMgmt from "../Business Partners/Customers"; // Assuming this is the component for CRM
import CustomerGroup from "../Business Partners/CustomerGroup";

// Product submenu pages
import ProductsGroup from "./pages/ProductsGroup";

// Sales & Purchase submenu page components

import IncomingPayment from "./pages/IncomingPayment";
import PurchaseAdd from "./pages/PurchaseAdd";
import GRPO from "./pages/GRPO";
import GRPOadd from "./pages/GRPOadd";
// Placeholder for pages you might need for other submenu items
import OutgoingPayment from "./pages/OutgoingPayment";
import SalesEmployee from "../Business Partners/SalesEmployee";
import Routess from "./pages/Routess";
//import UpdateCustomers from "./UpdateCustomers";
import ProductsUpdate from "./pages/ProductsUpdate";
import ShippingType from "../Business Partners/ShippingType";
import UOM from "./pages/UOM";
import UOMGroup from "./pages/UOMGroup";
import APCreditNote from "./pages/APCreditNote";
import ARCreditNote from "./pages/ARCreditNote";
import Vendors from "../Business Partners/Vendors";
import VendorGroup from "../Business Partners/VendorGroup";
import Tax from "../Business Partners/Tax";
//mport VendorsAdd from "./pages/VendorsAdd";
//import VendorsUpdate from "./pages/VendorsUpdate";
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
import APInvoice from "./pages/APInvoice";
import APInvoiceAdd from "./pages/APInvoiceAdd";

const getPageIcon = (pathname) => {
  const defaultIcon = <List size={22} />;
  if (pathname === "/" || pathname === "/dashboard") return <Grid size={22} />;
  if (
    pathname.startsWith("/customers") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/salesemployee") ||
    pathname.startsWith("/route")
  )
    return <Users size={22} />;
  if (
    pathname.startsWith("/products") ||
    pathname.startsWith("/uom") ||
    pathname.startsWith("/warehouse")
  )
    return <Box size={22} />;
  if (
    pathname.startsWith("/purchaseorder") ||
    pathname.startsWith("/apinvoice") ||
    pathname.startsWith("/grpo") ||
    pathname.startsWith("/apcreditnote")
  )
    return <ShoppingCart size={22} />;
  if (
    pathname.startsWith("/salesorder") ||
    pathname.startsWith("/arinvoice") ||
    pathname.startsWith("/arcreditnote")
  )
    return <DollarSign size={22} />;
  if (pathname.startsWith("/inventory")) return <Archive size={22} />;
  if (pathname.startsWith("/reports")) return <BarChart2 size={22} />;
  return defaultIcon;
};

// --- HELPER FUNCTION for Page Title (Corrected Logic) ---
const getPageTitle = (pathname) => {
  const titleMap = {
    "/customers/add": "New Customer",
    "/customers/update/": "Update Customer",
    "/vendor/add": "New Vendor",
    "/vendor/update/": "Update Vendor",
    "/products/add": "New Product",
    "/products/update/": "Update Product",
    "/purchaseorder/add": "Create Purchase Order",
    "/salesorder/add": "Create Sales Order",
    "/customers": "Customer Master Data",
    "/vendor": "Vendor Master Data",
    "/customergroup": "Customer Group Management",
    "/vendorgroup": "Vendor Group Management",
    "/products": "Product Master Data",
    "/purchaseorder": "Purchase Order Management",
    "/apinvoice": "A/P Invoice Management",
    "/apinvoice/add": "A/P Invoice Add",
    "/salesorder": "Sales Order Management",
    "/routess": "Route Management",
    "/salesemployee": "Sales Employee Management",
    "/shippingtype": "Shipping Type Management",
    "/tax": "Tax Management",
    "/uom": "UOM Management",
    "/uomgroup": "UOM Group Management",
    "/warehouse": "Warehouse Management",
    "/productsgroup": "Product Group Management",
    "/grpo": "GRPO",
    "/apcreditnote": "A/P Credit Note",
    "/arinvoice": "A/R Invoice",
    "/arcreditnote": "A/R Credit Note",
    "/incomingpayment": "Incoming Payments",
    "/outgoingpayment": "Outgoing Payments",
    "/inventory": "Inventory",
    "/reports": "Reports",
    "/customerrelationshipmgmt": "Customer Master Data",
    "/": "Dashboard",
    "/dashboard": "Dashboard",
  };

  // Prioritize longer (more specific) paths first to solve the logical error
  const sortedKeys = Object.keys(titleMap).sort((a, b) => b.length - a.length);
  const matchingKey = sortedKeys.find((key) => pathname.startsWith(key));

  return matchingKey ? titleMap[matchingKey] : "Distributor App";
};

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
    if (path === "/" || path === "/dashboard") {
      setActivePage("Dashboard");
      return;
    }
    const pathMappings = {
      Purchase: [
        "/purchaseorder",
        "/grpo",
        "/apcreditnote",
        "/outgoingpayment",
      ],
      Sales: ["/salesorder", "/arinvoice", "/arcreditnote", "/incomingpayment"],
      "Business Partners": [
        "/vendor",
        "/customer",
        "/route",
        "/salesemployee",
        "/shippingtype",
        "/tax",
      ],
      Products: ["/product", "/uom", "/warehouse"],
      Inventory: ["/inventory"],
      Reports: ["/reports"],
    };
    let currentNavItem = "Dashboard";
    for (const [navItem, prefixes] of Object.entries(pathMappings)) {
      if (prefixes.some((prefix) => path.startsWith(prefix))) {
        currentNavItem = navItem;
        break;
      }
    }
    setActivePage(currentNavItem);
  }, [location.pathname]);

  const handlePageChange = (pageName) => {
    if (pageName === "Dashboard") {
      navigate("/");
      return;
    }

    let pathSegment = pageName.toLowerCase().replace(/\s+/g, "");

    const pathMap = {
      "vendor master data": "vendor",
      vendorgroup: "vendorgroup",
      "purchase order": "purchaseorder",
      "business partners": "customers",
      "sales order": "salesorder",
      "customer master data": "customers",
      customergroup: "customergroup",
      uom: "uom",
      warehouse: "warehouse",
      uomgroup: "uomgroup",
      route: "routess",
      "sales employee": "salesemployee",
      "shipping type": "shippingtype",
      tax: "tax",
      "product details": "products",
      "products group": "productsgroup",
      grpo: "grpo",
      "ap credit note": "apcreditnote",
      "outgoing payment": "outgoingpayment",
      "ap invoice": "apinvoice",
      "a/r invoice": "arinvoice",
      "a/r credit note": "arcreditnote",
      "incoming payment": "incomingpayment",
    };

    pathSegment = pathMap[pathSegment] || pathSegment;
    navigate(`/${pathSegment}`);
  };

  const currentPageTitle = getPageTitle(location.pathname);
  const currentPageIcon = getPageIcon(location.pathname);
  const isDashboard =
    location.pathname === "/" || location.pathname === "/dashboard";

  return (
    <div className="home-container">
      <Sidebar
        navItems={sidebarNavItems}
        activePage={activePage}
        onPageChange={handlePageChange}
      />
      <main className="main-content">
        <div className={`content-header ${isDashboard ? "gradient" : ""}`}>
          <h1 className="content-header-title">
            {currentPageIcon}
            <span>{currentPageTitle}</span>
          </h1>
        </div>

        {/* The Routes now render inside a content-card, which is correct */}

        <div className="content-card">
          <Routes>
            {/* Dashboard Route (Root) */}
            <Route path="/" element={<Dashboard />} />
            {/* Ensure this is the first specific route */}
            <Route path="/dashboard" element={<Navigate replace to="/" />} />
            {/* Optional: redirect /dashboard to / */}
            {/* Customer Routes */}
            <Route path="/vendor" element={<Vendors />} />
            {/* <Route path="/vendor/add" element={<VendorsAdd />} />
            <Route
              path="/vendor/update/:vendorId"
              element={<VendorsUpdate />}
            /> */}
            <Route path="/vendorgroup" element={<VendorGroup />} />
            <Route path="/customers" element={<Customers />} />
            {/* <Route path="/customers/add" element={<AddCustomers />} /> */}
            {/* <Route
              path="/customers/update/:customerId"
              element={<UpdateCustomers />}
            /> */}
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
            <Route path="/apinvoice" element={<APInvoice />} />
            <Route path="/apinvoice/add" element={<APInvoiceAdd />} />
            <Route path="/apcreditnote" element={<APCreditNote />} />
            <Route path="/apcreditnote/add" element={<APCreditNoteAdd />} />
            <Route path="/outgoingpayment" element={<OutgoingPayment />} />
            {/* Sales Routes */}
            <Route path="/salesorder" element={<Sales />} />
            <Route path="/salesorder/add" element={<SalesAdd />} />
            <Route path="/salesorder/update/:soId" element={<SalesUpdate />} />
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
        </div>
      </main>
    </div>
  );
}

export default Home;
