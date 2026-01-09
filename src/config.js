// src/config.js

// IMPORTANT: Replace "https://localhost:7074" with the actual URL and port your backend is running on.
const API_SERVER_BASE_URL = "https://localhost:7074";

export const API_BASE_URL = `${API_SERVER_BASE_URL}/api`;

export const API_CUSTOMER_ENDPOINT = `${API_BASE_URL}/Customer`;
export const API_CUSTOMER_GROUPS_ENDPOINT = `${API_BASE_URL}/CustomerGroup`;
export const API_WAREHOUSE_ENDPOINT = `${API_BASE_URL}/Warehouse`; // Example endpoint

export const IMAGES_BASE_URL = `${API_SERVER_BASE_URL}/images/products`;

export const API_PRODUCTS_ENDPOINT = `${API_BASE_URL}/Products`;
export const API_PRODUCT_GROUPS_ENDPOINT = `${API_BASE_URL}/ProductGroup`;

export const API_UOM_ENDPOINT = `${API_BASE_URL}/UOMs`;
export const API_UOM_GROUP_ENDPOINT = `${API_BASE_URL}/UOMGroups`;

// Make sure you have a placeholder.png in your /public/images/ folder
export const PLACEHOLDER_IMG_PATH = "/images/placeholder.png";
