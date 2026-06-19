const express = require("express");
const router = express.Router();
const { putItem } = require("../services/dynamo");
const { recoveryStatus } = require("../services/logic");

router.post("/save", async (req, res) => {
  try {
    const { sleep, energy, joint } = req.body;

    const status = recoveryStatus(
      Number(sleep),
      Number(energy),
      Number(joint)
    );

    const item = {
      PK: "USER#1",
      SK: "RECOVERY#" + new Date().toISOString(),
      sleep: Number(sleep),
      energy: Number(energy),
      joint: Number(joint),
      status: status.label,
      level: status.level
    };

    await putItem(item);

    // Return styled status fragment for HTMX swap
    const levelColors = {
      excellent: { bg: "rgba(34, 197, 94, 0.15)", border: "#22c55e", icon: "⚡" },
      good:      { bg: "rgba(34, 211, 238, 0.15)", border: "#22d3ee", icon: "💪" },
      caution:   { bg: "rgba(251, 191, 36, 0.15)", border: "#fbbf24", icon: "⚠️" },
      rest:      { bg: "rgba(239, 68, 68, 0.15)",  border: "#ef4444", icon: "🛌" }
    };
    const c = levelColors[status.level] || levelColors.caution;

    res.send(`
      <div class="status-pill animate-pop" style="background:${c.bg};border:1px solid ${c.border};">
        <span class="status-icon">${c.icon}</span>
        <div>
          <div class="status-label">${status.label}</div>
          <div class="status-detail">Sleep ${sleep}h · Energy ${energy}/5 · Joint Fatigue ${joint}/5</div>
        </div>
      </div>
    `);
  } catch (err) {
    console.error("Error saving recovery:", err);
    res.status(500).send("Error saving recovery data");
  }
});

module.exports = router;
