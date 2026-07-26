export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number };

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  accessToken: string;
  body?: unknown;
};

async function request<T>(
  path: string,
  { method, accessToken, body }: RequestOptions,
): Promise<ApiResult<T>> {
  const response = await fetch(`${process.env.HONO_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  const data = (await response.json()) as T;
  return { ok: true, data };
}

export const honoApiClient = {
  get: <T>(path: string, accessToken: string) =>
    request<T>(path, { method: "GET", accessToken }),
  post: <T>(path: string, accessToken: string, body?: unknown) =>
    request<T>(path, { method: "POST", accessToken, body }),
  put: <T>(path: string, accessToken: string, body?: unknown) =>
    request<T>(path, { method: "PUT", accessToken, body }),
  patch: <T>(path: string, accessToken: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", accessToken, body }),
  delete: <T>(path: string, accessToken: string) =>
    request<T>(path, { method: "DELETE", accessToken }),
};
