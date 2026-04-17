import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3001",
    headers: {
        "Content-Type": "application/json",
    },
});

// token attach
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("google_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// debug errors
api.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error("API ERROR:", err.response?.data || err.message);
        return Promise.reject(err);
    }
);

export default api;