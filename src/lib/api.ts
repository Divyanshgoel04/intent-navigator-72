export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiHeaders = {
  'Content-Type': 'application/json'
};

export async function analyzeTicket(text: string, customerId?: string, orderId?: string) {
  const response = await fetch(`${API_BASE_URL}/agent/handle`, {
    method: 'POST',
    headers: apiHeaders,
    body: JSON.stringify({
      text,
      customer_id: customerId || null,
      order_id: orderId || null
    })
  });
  if (!response.ok) throw new Error('API request failed');
  return response.json();
}

export async function fetchMetrics() {
  const response = await fetch(`${API_BASE_URL}/metrics`, {
    headers: apiHeaders
  });
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
}

export async function fetchOrder(orderId: string) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: apiHeaders
  });
  if (!response.ok) throw new Error('Order not found');
  return response.json();
}
