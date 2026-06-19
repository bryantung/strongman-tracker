const app = require("./app");

const PORT = process.env.PORT || 3999;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Strongman Tracker listening on http://localhost:${PORT}`);
});
