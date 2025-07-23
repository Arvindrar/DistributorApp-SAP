import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import "./Dashboard.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

// --- Adjusted Sample Data ---
const customersData = [
  {
    id: 1,
    code: "CUST-001",
    name: "Acme Corp",
    group: "Wholesale", // 1 Wholesale
    balance: 15025.5,
  },
  {
    id: 2,
    code: "CUST-002",
    name: "Beta Solutions",
    group: "Retail", // 1st Retail
    balance: 8750.0,
  },
  {
    id: 3,
    code: "CUST-003",
    name: "Gianna Corp",
    group: "Retail", // Changed to Retail - 2nd Retail
    balance: 1025.5,
  },
  {
    id: 4,
    code: "CUST-004",
    name: "Davis Solutions",
    group: "Retail", // 3rd Retail
    balance: 870.0,
  },
  {
    // Added one more retail to make it clearly larger
    id: 5,
    code: "CUST-005",
    name: "Epsilon Mart",
    group: "Retail", // 4th Retail
    balance: 5300.0,
  },
];

const productsData = [
  // This data isn't directly tied to "Total Payable" for this example
  { id: "SKU001", name: "Monkey 555 Steel Broom", group: "Brooms" },
  { id: "SKU002", name: "Monkey 555 Mach 3 Broom", group: "Brooms" },
  { id: "SKU003", name: "Monkey 555 T-Mop", group: "Mops" },
  {
    id: "SKU004",
    name: "Black Belt Phenolic Cleaner",
    group: "Floor Cleaners",
  },
  { id: "SKU021", name: "Black Belt Toilet Cleaner", group: "Bathroom Care" },
  { id: "SKU022", name: "Monkey VVV Detergent", group: "Laundry Care" },
  { id: "SKU005", name: "Monkey 555 Soft Broom", group: "Brooms" },
  { id: "SKU006", name: "Monkey 555 Spin Mop", group: "Mops" },
  { id: "SKU007", name: "Generic Brush", group: "Bathroom Care" },
  { id: "SKU008", name: "Fabric Softener", group: "Laundry Care" },
  { id: "SKU009", name: "Hand Soap", group: "Personal Care" },
  { id: "SKU010", name: "Shampoo", group: "Personal Care" },
];

const purchaseOrdersData = [
  {
    id: 1,
    vendorName: "Tech Solutions Inc.",
    poNumber: "PO2024-001",
    date: "2025-01-15",
    accountBalance: 12500.5,
    remarks: "Partial shipment",
  },
  {
    id: 2,
    vendorName: "Global Office Supplies",
    poNumber: "PO2024-002",
    date: "2025-01-25",
    accountBalance: 8700.0,
    remarks: "Awaiting confirmation",
  },
  {
    id: 3,
    vendorName: "Creative Designs Ltd.",
    poNumber: "PO2024-003",
    date: "2025-02-15",
    accountBalance: 0.0,
    remarks: "Order fully paid",
  }, // This won't contribute to payable if we only sum positive balances
  {
    id: 4,
    vendorName: "Industrial Parts Co.",
    poNumber: "PO2024-004",
    date: "2025-03-18",
    accountBalance: 10350.75,
    remarks: "Backordered",
  }, // Reduced to help Sales > Purchase
  {
    id: 5,
    vendorName: "Tech Solutions Inc.",
    poNumber: "PO2024-005",
    date: "2025-04-15",
    accountBalance: 500.0,
    remarks: "New order",
  },
  {
    id: 6,
    vendorName: "Parts and More",
    poNumber: "PO2024-006",
    date: "2025-02-15",
    accountBalance: 1200.0,
    remarks: "Urgent",
  },
];

const salesOrdersData = [
  {
    id: 1,
    customerName: "Alpha Retailers",
    soNumber: "SO2024-101",
    date: "2025-01-20",
    orderTotal: 17500.75,
    remarks: "Awaiting payment",
  }, // Increased
  {
    id: 2,
    customerName: "Beta Goods Co.",
    soNumber: "SO2024-102",
    date: "2025-02-05",
    orderTotal: 25200.0,
    remarks: "Shipped",
  }, // Increased
  {
    id: 3,
    customerName: "Gamma Services",
    soNumber: "SO2024-103",
    date: "2025-02-28",
    orderTotal: 5350.0,
    remarks: "Delivered",
  }, // Increased
  {
    id: 4,
    customerName: "Alpha Retailers",
    soNumber: "SO2024-104",
    date: "2025-03-10",
    orderTotal: 11200.0,
    remarks: "Processing",
  }, // Increased
  {
    id: 5,
    customerName: "Delta Supplies",
    soNumber: "SO2024-105",
    date: "2025-04-01",
    orderTotal: 10980.5,
    remarks: "New customer",
  }, // Increased
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

function Dashboard() {
  // KPI Calculations
  const totalOutstanding = customersData.reduce(
    // Sum of customer balances
    (sum, customer) => sum + customer.balance,
    0
  );
  const totalPayable = purchaseOrdersData.reduce(
    // Sum of purchase order account balances (assuming these are amounts to be paid)
    (sum, order) => sum + order.accountBalance, // If only positive balances: (sum, order) => sum + (order.accountBalance > 0 ? order.accountBalance : 0),
    0
  );
  const totalSalesValue = salesOrdersData.reduce(
    (sum, order) => sum + order.orderTotal,
    0
  );
  const totalPurchaseValue = purchaseOrdersData.reduce(
    // This is the sum of PO values, which could be different from totalPayable if some are paid
    (sum, order) => sum + order.accountBalance, // For consistency, using the same logic as totalPayable for now
    0
  );

  // Customer Distribution Pie Chart
  const customerGroupCounts = customersData.reduce((acc, customer) => {
    acc[customer.group] = (acc[customer.group] || 0) + 1;
    return acc;
  }, {});
  const customerPieData = {
    labels: Object.keys(customerGroupCounts),
    datasets: [
      {
        label: "Customers",
        data: Object.values(customerGroupCounts),
        backgroundColor: [
          "#36A2EB",
          "#FF6384",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ], // Adjusted order if needed for visuals
        hoverBackgroundColor: [
          "#36A2EB",
          "#FF6384",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
      },
    ],
  };

  // Product Distribution Pie Chart (data for this chart is not directly changed by KPI name changes)
  const productGroupCounts = productsData.reduce((acc, product) => {
    acc[product.group] = (acc[product.group] || 0) + 1;
    return acc;
  }, {});
  const productPieData = {
    labels: Object.keys(productGroupCounts),
    datasets: [
      {
        label: "Products",
        data: Object.values(productGroupCounts),
        backgroundColor: [
          "#FF9F40",
          "#4BC0C0",
          "#F7464A",
          "#FF6384",
          "#949FB1",
          "#4D5360",
          "#36A2EB",
        ],
        hoverBackgroundColor: [
          "#FF9F40",
          "#4BC0C0",
          "#F7464A",
          "#FF6384",
          "#949FB1",
          "#4D5360",
          "#36A2EB",
        ],
      },
    ],
  };

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Sales by Month Bar Chart
  const salesByMonth = salesOrdersData.reduce((acc, order) => {
    const date = new Date(order.date);
    const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    acc[monthName] = (acc[monthName] || 0) + order.orderTotal;
    return acc;
  }, {});
  const sortedSalesMonths = Object.keys(salesByMonth).sort((a, b) => {
    const [aMonthStr, aYear] = a.split(" ");
    const [bMonthStr, bYear] = b.split(" ");
    return (
      new Date(`${aMonthStr} 1, ${aYear}`) -
      new Date(`${bMonthStr} 1, ${bYear}`)
    );
  });
  const salesBarData = {
    labels: sortedSalesMonths,
    datasets: [
      {
        label: "Total Sales (INR)",
        data: sortedSalesMonths.map((month) => salesByMonth[month]),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Purchases by Month Bar Chart
  const purchasesByMonth = purchaseOrdersData.reduce((acc, order) => {
    const date = new Date(order.date);
    const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    acc[monthName] = (acc[monthName] || 0) + order.accountBalance;
    return acc;
  }, {});
  const sortedPurchaseMonths = Object.keys(purchasesByMonth).sort((a, b) => {
    const [aMonthStr, aYear] = a.split(" ");
    const [bMonthStr, bYear] = b.split(" ");
    return (
      new Date(`${aMonthStr} 1, ${aYear}`) -
      new Date(`${bMonthStr} 1, ${bYear}`)
    );
  });
  const purchaseBarData = {
    labels: sortedPurchaseMonths,
    datasets: [
      {
        label: "Total Purchases (INR)",
        data: sortedPurchaseMonths.map((month) => purchasesByMonth[month]),
        backgroundColor: "rgba(255, 159, 64, 0.6)",
        borderColor: "rgba(255, 159, 64, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart Options (same as before)
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { boxWidth: 15, padding: 10, font: { size: 10 } },
      },
      title: {
        display: true,
        font: { size: 14 },
        padding: { top: 8, bottom: 8 },
      },
      tooltip: { bodyFont: { size: 10 }, titleFont: { size: 12 } },
    },
  };
  const barChartOptions = (titleText) => ({
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: { ...commonChartOptions.plugins.title, text: titleText },
      tooltip: {
        ...commonChartOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null)
              label += formatCurrency(context.parsed.y);
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            if (Math.abs(value) >= 10000000)
              return formatCurrency(value / 10000000).replace("₹", "₹") + "Cr";
            else if (Math.abs(value) >= 100000)
              return formatCurrency(value / 100000).replace("₹", "₹") + "L";
            else if (Math.abs(value) >= 1000)
              return formatCurrency(value / 1000).replace("₹", "₹") + "K";
            return formatCurrency(value).replace(".00", "");
          },
          font: { size: 10 },
        },
      },
      x: { ticks: { font: { size: 10 } } },
    },
  });
  const pieChartOptions = (titleText) => ({
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: { ...commonChartOptions.plugins.title, text: titleText },
    },
  });

  const recentSales = [...salesOrdersData]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  const recentPurchases = [...purchaseOrdersData]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="dashboard-container">
      {/* KPIs Row - Updated Text and Values */}
      <div className="dashboard-row kpi-row">
        <div className="dashboard-widget kpi-widget">
          <h3>Total Outstanding</h3> {/* CHANGED TEXT */}
          <p className="kpi-value">{formatCurrency(totalOutstanding)}</p>{" "}
          {/* Uses new calculation */}
        </div>
        <div className="dashboard-widget kpi-widget">
          <h3>Total Payable</h3> {/* CHANGED TEXT */}
          <p className="kpi-value">{formatCurrency(totalPayable)}</p>{" "}
          {/* Uses new calculation */}
        </div>
        <div className="dashboard-widget kpi-widget">
          <h3>Total Sales Value</h3>
          <p className="kpi-value">{formatCurrency(totalSalesValue)}</p>{" "}
          {/* Value adjusted via data */}
        </div>
        <div className="dashboard-widget kpi-widget">
          <h3>Total Purchase Value</h3>
          <p className="kpi-value">{formatCurrency(totalPurchaseValue)}</p>{" "}
          {/* Value adjusted via data */}
        </div>
      </div>

      {/* Charts Row 1 (Pie Charts) */}
      <div className="dashboard-row chart-row">
        <div className="dashboard-widget chart-widget">
          <div className="chart-wrapper">
            <Pie
              data={customerPieData}
              options={pieChartOptions("Customer Distribution")}
            />{" "}
            {/* Data adjusted for Retail > Wholesale */}
          </div>
        </div>
        <div className="dashboard-widget chart-widget">
          <div className="chart-wrapper">
            <Pie
              data={productPieData}
              options={pieChartOptions("Product Distribution")}
            />
          </div>
        </div>
      </div>

      {/* Charts Row 2 (Bar Charts) */}
      <div className="dashboard-row chart-row">
        <div className="dashboard-widget chart-widget">
          <div className="chart-wrapper">
            <Bar
              data={salesBarData}
              options={barChartOptions("Monthly Sales Performance")}
            />
          </div>
        </div>
        <div className="dashboard-widget chart-widget">
          <div className="chart-wrapper">
            <Bar
              data={purchaseBarData}
              options={barChartOptions("Monthly Purchase Activity")}
            />
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="dashboard-row table-row">
        <div className="dashboard-widget table-widget">
          <h3 className="widget-title">Recent Sales Orders</h3>
          <div className="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th>SO Number</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((order) => (
                  <tr key={`sale-${order.id}`}>
                    <td>{order.soNumber}</td>
                    <td>{order.customerName}</td>
                    <td>{order.date}</td>
                    <td>{formatCurrency(order.orderTotal)}</td>
                    <td>{order.remarks}</td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan="5">No recent sales.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="dashboard-widget table-widget">
          <h3 className="widget-title">Recent Purchase Orders</h3>
          <div className="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((order) => (
                  <tr key={`purchase-${order.id}`}>
                    <td>{order.poNumber}</td>
                    <td>{order.vendorName}</td>
                    <td>{order.date}</td>
                    <td>{formatCurrency(order.accountBalance)}</td>
                    <td>{order.remarks}</td>
                  </tr>
                ))}
                {recentPurchases.length === 0 && (
                  <tr>
                    <td colSpan="5">No recent purchases.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
