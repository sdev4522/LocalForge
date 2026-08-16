export async function apiFetch(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(endpoint, config);
    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    if (!response.ok || data.error) {
      const error = new Error(data.error || `HTTP ${response.status} Error`);
      error.status = response.status;
      error.details = data.details || null;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    throw err;
  }
}
