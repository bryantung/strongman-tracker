const express = require("express");
const router = express.Router();
const { queryItems } = require("../services/dynamo");
const { runAnalytics } = require("../analytics/engine/runAnalytics");

// Helper function to query and format logs for view rendering
async function getFormattedLogs() {
  const workoutLogs = await queryItems("USER#1", "WORKOUT#");
  const metricLogs = await queryItems("USER#1", "METRIC#");

  const allLogs = [];
  workoutLogs.forEach(log => {
    const timestamp = log.SK.replace("WORKOUT#", "");
    allLogs.push({
      ...log,
      timestamp,
      type: "workout"
    });
  });

  metricLogs.forEach(log => {
    const timestamp = log.SK.replace("METRIC#", "");
    allLogs.push({
      ...log,
      timestamp,
      type: "metric"
    });
  });

  allLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return allLogs.map(item => {
    let displayDate = "Unknown Date";
    try {
      const dateObj = new Date(item.timestamp);
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
}

// GET / - Simple logging landing page
router.get("/", async (req, res) => {
  try {
    const exercises = await queryItems("USER#1", "EXERCISE#");
    exercises.sort((a, b) => a.name.localeCompare(b.name));

    const formattedLogs = await getFormattedLogs();

    res.render("logger", {
      exercises,
      items: formattedLogs
    });
  } catch (err) {
    console.error("Error loading logger landing page:", err);
    res.status(500).send("Error loading logger content");
  }
});

// GET /dashboard - Dedicated dashboard page
router.get("/dashboard", async (req, res) => {
  try {
    const exercises = await queryItems("USER#1", "EXERCISE#");
    exercises.sort((a, b) => a.name.localeCompare(b.name));

    const formattedLogs = await getFormattedLogs();
    const analyticsResult = await runAnalytics();

    res.render("dashboard", {
      exercises,
      items: formattedLogs,
      latestSummary: analyticsResult.latestSummary,
      insights: analyticsResult.insights,
      summaries: analyticsResult.history,
      autoPlateaus: analyticsResult.autoPlateaus || [],
      autoPhysique: analyticsResult.autoPhysique || null,
      autoMeasurements: analyticsResult.autoMeasurements || null
    });
  } catch (err) {
    console.error("Error loading dashboard content:", err);
    res.status(500).send("Error loading dashboard content");
  }
});

module.exports = router;
