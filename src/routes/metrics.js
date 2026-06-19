const express = require("express");
const router = express.Router();
const { putItem, getItems } = require("../services/dynamo");

router.post("/save", async (req, res) => {
  try {
    const { bench, deadlift, push_press, bodyweight } = req.body;

    const item = {
      PK: "USER#1",
      SK: "METRIC#" + new Date().toISOString(),
      bench: Number(bench) || 0,
      deadlift: Number(deadlift) || 0,
      push_press: Number(push_press) || 0,
      bodyweight: Number(bodyweight) || 0
    };

    await putItem(item);

    // Fetch updated items to render the refreshed logs list
    const items = await getItems();
    const formattedItems = items.map(item => {
      const timestamp = item.SK.replace("METRIC#", "");
      let displayDate = "Unknown Date";
      try {
        const dateObj = new Date(timestamp);
        if (!isNaN(dateObj.getTime())) {
          displayDate = dateObj.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        }
      } catch (err) {
        console.error("Error parsing date:", err);
      }
      return {
        ...item,
        displayDate
      };
    });

    // Check if it's an HTMX request
    if (req.headers["hx-request"]) {
      // Return the rendered EJS partial fragment to update the log table in-place
      res.render("partials/logs", { items: formattedItems });
    } else {
      // Normal form fallback redirect
      res.redirect("/");
    }
  } catch (err) {
    console.error("Error saving metric:", err);
    res.status(500).send("Error saving metric data");
  }
});

module.exports = router;
