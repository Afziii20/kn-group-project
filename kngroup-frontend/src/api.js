import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000'; // Make sure this matches your FastAPI port!

// Helper to securely attach your Admin Token
const getAuthHeader = () => {
    const token = localStorage.getItem('admin_token');
    return { Authorization: `Bearer ${token}` };
};

// --- AUTH ---
export const loginAdmin = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await axios.post(`${API_URL}/login`, formData);
    return response.data;
};

// --- PRODUCTS ---
export const getProducts = async (params = {}) => {
    // 1. Create a clean object
    const cleanParams = {};

    // 2. Only add the parameter if it actually exists and isn't empty
    if (params.search) {
        cleanParams.search = params.search;
    }
    if (params.category_id) {
        cleanParams.category_id = params.category_id;
    }

    // 3. Send the clean parameters to FastAPI
    const response = await axios.get(`${API_URL}/products/`, { params: cleanParams });
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await axios.post(`${API_URL}/products/`, productData, {
        headers: getAuthHeader()
    });
    return response.data;
};

// --- NEW: Upload Image ---
export const uploadProductImage = async (id, file) => {
    const token = localStorage.getItem('admin_token')
    const formData = new FormData()
    formData.append('file', file)

        const response = await axios.post(`${API_URL}/products/${id}/image`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data' // Required for sending files!
            }
        })
        return response.data
}

export const deleteProduct = async (id) => {
    const response = await axios.delete(`${API_URL}/products/${id}`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// --- CATEGORIES ---
export const getCategories = async () => {
    const response = await axios.get(`${API_URL}/categories/`);
    return response.data;
};

export const createCategory = async (categoryData) => {
    const response = await axios.post(`${API_URL}/categories/`, categoryData, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const updateCategory = async (id, categoryData) => {
    const response = await axios.patch(`${API_URL}/categories/${id}`, categoryData, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await axios.delete(`${API_URL}/categories/${id}`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// --- ORDERS ---
export const createOrder = async (orderData) => {
    const response = await axios.post(`${API_URL}/orders/`, orderData);
    return response.data;
};

export const getOrders = async () => {
    const response = await axios.get(`${API_URL}/orders/`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// --- NEW: Edit Product ---
export const updateProduct = async (id, productData) => {
    const token = localStorage.getItem('admin_token')
    const response = await axios.put(`${API_URL}/products/${id}`, productData, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
}

