const app = require("./app");
const os = require("os");

const PORT = process.env.PORT || 3999;
const HOST = process.env.HOST || "0.0.0.0";

function getNetworkUrls(port) {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((net) => net && net.family === "IPv4" && !net.internal)
    .map((net) => `http://${net.address}:${port}`);
}

const server = app.listen(PORT, HOST, () => {
  console.log(`[Server] Strongman Tracker listening locally at http://localhost:${PORT}`);

  if (HOST === "0.0.0.0") {
    const networkUrls = getNetworkUrls(PORT);

    if (networkUrls.length > 0) {
      console.log("[Server] On another device, use one of:");
      networkUrls.forEach((url) => console.log(`  ${url}`));
    }
  }
});

server.on("error", (error) => {
  console.error("[Server] Failed to start Strongman Tracker:", error);
  process.exitCode = 1;
});

server.on("close", () => {
  console.log("[Server] Strongman Tracker stopped.");
});

module.exports = server;
