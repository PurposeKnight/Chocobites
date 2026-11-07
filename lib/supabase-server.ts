type QueryOptions = { method?: string; body?: unknown; headers?: Record<string, string> };

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing");
  return { url, key };
}

export async function supabase(path: string, options: QueryOptions = {}) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Database request failed (${response.status}): ${detail}`);
  }
  return response.status === 204 ? null : response.json();
}

export async function rpc<T>(name: string, body: unknown): Promise<T> {
  return supabase(`rpc/${name}`, { method: "POST", body }) as Promise<T>;
}
