const express = require("express");
const path = require("path");

const app = express();
const PORT = Number(process.env.FRONTEND_PORT) || 3000;
const publicDir = path.join(__dirname, "public");
const indexFile = path.join(publicDir, "index.html");

app.disable("x-powered-by");
app.use(express.static(publicDir));

// SPA fallback: serve index.html for non-API routes like /dashboard.
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(indexFile);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Frontend server running at http://localhost:${PORT}`);
});
