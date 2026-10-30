const BASE_URL = "http://localhost:3000";

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error("Could not connect to the server. Please check JSON Server.");
  }

  if (response.status === 204) return null;
  return response.json();
}

export const getItems = (resource) => request(`${BASE_URL}/${resource}`);
export const getItem = (resource, id) => request(`${BASE_URL}/${resource}/${id}`);

export const addItem = (resource, item) =>
  request(`${BASE_URL}/${resource}`, {
    method: "POST",
    body: JSON.stringify(item)
  });

export const updateItem = (resource, id, item) =>
  request(`${BASE_URL}/${resource}/${id}`, {
    method: "PUT",
    body: JSON.stringify(item)
  });

export const deleteItem = (resource, id) =>
  request(`${BASE_URL}/${resource}/${id}`, { method: "DELETE" });