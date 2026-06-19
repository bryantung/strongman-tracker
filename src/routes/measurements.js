const express = require("express");
const router = express.Router();
const { putItem } = require("../services/dynamo");

router.post("/save", async (req, res) => {
  try {
    const { bodyweight, chest, arms, waist, neck, thigh, forearm } = req.body;
    const monthStr = new Date().toISOString().substring(0, 7); // YYYY-MM

    const item = {
      PK: "USER#1",
      SK: "MEASURE#" + monthStr,
      bodyweight: Number(bodyweight),
      chest: Number(chest),
      arms: Number(arms),
      waist: Number(waist),
      neck: neck ? Number(neck) : null,
      thigh: thigh ? Number(thigh) : null,
      forearm: forearm ? Number(forearm) : null
    };

    await putItem(item);

    let details = `BW ${bodyweight}kg · Chest ${chest}cm · Arms ${arms}cm · Waist ${waist}cm`;
    if (neck) details += ` · Neck ${neck}cm`;
    if (thigh) details += ` · Thigh ${thigh}cm`;
    if (forearm) details += ` · Forearm ${forearm}cm`;

    res.send(`
      <div class="status-pill animate-pop" style="background:rgba(34, 211, 238, 0.15);border:1px solid #22d3ee;">
        <span class="status-icon">📏</span>
        <div>
          <div class="status-label">Measurements Saved</div>
          <div class="status-detail">${details}</div>
        </div>
      </div>
    `);
  } catch (err) {
    console.error("Error saving measurements:", err);
    res.status(500).send("Error saving measurement data");
  }
});

module.exports = router;
