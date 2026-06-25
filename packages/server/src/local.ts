import { createServer } from "node:http";
import { handleApiRequest } from "./app.js";

const port = Number(process.env.PORT ?? 8787);

const server = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");
  const response = await handleApiRequest({
    method: req.method ?? "GET",
    url: req.url ?? "/",
    headers: req.headers,
    body: body.length > 0 ? body : undefined
  });

  res.statusCode = response.status;
  for (const [key, value] of Object.entries(response.headers ?? {})) {
    res.setHeader(key, value);
  }
  res.end(response.body === undefined ? undefined : JSON.stringify(response.body));
});

server.listen(port, () => {
  console.log(`Territory Wars API listening on http://localhost:${port}`);
});
