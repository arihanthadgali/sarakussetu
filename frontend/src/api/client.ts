const API_BASE_URL = "http://localhost:8080";

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { authenticated = false, headers, ...requestOptions } = options;

  const token = localStorage.getItem("accessToken");

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (authenticated && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Request failed with status ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}