import axios from "axios";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
