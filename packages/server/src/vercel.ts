import { handleApiRequest } from "./app.js";

interface VercelRequest {
  readonly method?: string;
  readonly url?: string;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body?: unknown;
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  send: (body?: unknown) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const response = await handleApiRequest({
    method: req.method ?? "GET",
    url: req.url ?? "/",
    headers: req.headers,
    body: req.body
  });

  for (const [key, value] of Object.entries(response.headers ?? {})) {
    res.setHeader(key, value);
  }

  res.status(response.status).send(response.body);
}
