const express = require("express");
const router = express.Router();
const { aggregateAllWeeks } = require("../analytics/aggregators/weeklyAggregator");
const { runAnalytics } = require("../analytics/engine/runAnalytics");

// POST /analytics/trigger-aggregate
router.post("/trigger-aggregate", async (req, res) => {
  try {
    const summaries = await aggregateAllWeeks();
    await runAnalytics();

    if (req.headers["hx-request"]) {
      res.send(`
        <div class="status-pill animate-pop" style="background:rgba(34, 197, 94, 0.15);border:1px solid #22c55e; margin-bottom: 1.5rem; width: 100%;">
          <span class="status-icon">⚙️</span>
          <div style="flex-grow: 1;">
            <div class="status-label">Aggregation Triggered</div>
            <div class="status-detail">Compiled ${summaries.length} weekly summary sheets. Rule-based insights updated.</div>
          </div>
          <button onclick="window.location.reload()" class="btn-primary" style="min-height: 38px; padding: 0 1rem; font-size: 0.8rem; margin-left: 1rem;">
            Refresh Dashboard
          </button>
        </div>
      `);
    } else {
      res.redirect("/dashboard");
    }
  } catch (err) {
    console.error("Error triggering aggregation:", err);
    res.status(500).send("Error compiling weekly summaries");
  }
});

module.exports = router;
