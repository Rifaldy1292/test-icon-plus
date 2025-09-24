import axios from "axios";

// Base URL cukup "/api/metadata/workflow", tanpa http://localhost:8080
const API_URL = "/api/metadata/workflow";

export function getWorkflowRifky(name) {
  return axios.get(`${API_URL}/${name}`);
}

export function createItem(payload) {
  return axios.post(API_URL, payload);
}

export function updateItem(payload) {
  return axios.put(`${API_URL}`, payload);
}
