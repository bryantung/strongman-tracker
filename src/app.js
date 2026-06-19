const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const dashboard = require("./routes/dashboard");
const metrics = require("./routes/metrics");
const recovery = require("./routes/recovery");
const measurements = require("./routes/measurements");
const settings = require("./routes/settings");
const workout = require("./routes/workout");
const analytics = require("./routes/analytics");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, "../public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", dashboard);
app.use("/metrics", metrics);
app.use("/recovery", recovery);
app.use("/measurements", measurements);
app.use("/settings", settings);
app.use("/workout", workout);
app.use("/analytics", analytics);

module.exports = app;
