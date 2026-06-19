const express = require("express");
const router = express.Router();
const { putItem, queryItems } = require("../services/dynamo");

// POST /workout/save
router.post("/save", async (req, res) => {
  try {
    let {
      day,
      exercise,
      weight,
      sets,
      reps,
      rpe,
      notes,
      fatigue_score
    } = req.body;

    if (!exercise || !weight || !fatigue_score) {
      return res.status(400).send("Exercise, Weight, and Fatigue Score are required");
    }

    // Query exercise definition to get category and muscle_group
    const exercises = await queryItems("USER#1", "EXERCISE#" + exercise);
    const exerciseDef = exercises[0];
    const category = exerciseDef ? exerciseDef.category : "compound";
    const muscle_group = exerciseDef ? exerciseDef.muscle_group : "chest";

    // Query latest workout log for this exercise to handle autofill
    const logs = await queryItems("USER#1", "WORKOUT#");
    const exerciseLogs = logs.filter(log => log.exercise === exercise);
    const latestLog = exerciseLogs[0]; // Sorted descending (latest first)

    // Autofill logic for sets, reps, rpe
    if (!sets) {
      sets = latestLog ? latestLog.sets : (exerciseDef ? exerciseDef.default_sets : 5);
    }
    if (!reps) {
      reps = latestLog ? latestLog.reps : (exerciseDef ? exerciseDef.default_reps : "5");
    }
    if (!rpe) {
      rpe = latestLog ? (latestLog.rpe || null) : (exerciseDef ? (exerciseDef.default_rpe || null) : null);
    }

    const item = {
      PK: "USER#1",
      SK: "WORKOUT#" + new Date().toISOString(),
      day: day || "Day 1",
      exercise,
      weight: Number(weight),
      sets: Number(sets),
      reps: String(reps),
      rpe: rpe ? Number(rpe) : null,
      notes: notes || "",
      category,
      muscle_group,
      fatigue_score: Number(fatigue_score)
    };

    await putItem(item);

    // If HTMX, return the updated logs partial
    if (req.headers["hx-request"]) {
      res.send(`
        <div class="status-pill animate-pop" style="background:rgba(34, 211, 238, 0.15); border: 1px solid var(--accent-cyan); width: 100%; display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; border-radius: var(--radius-md); box-sizing: border-box; text-align: left;">
          <span class="status-icon" style="font-size: 1.75rem; line-height: 1;">⚡</span>
          <div style="flex-grow: 1;">
            <div class="status-label" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Session Logged</div>
            <div class="status-detail" style="font-size: 0.825rem; color: var(--text-secondary); margin-block-start: 0.2rem;">Saved to training log database.</div>
          </div>
        </div>
      `);
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.error("Error saving workout log:", err);
    res.status(500).send("Error saving workout log");
  }
});

// GET /workout/defaults/:exerciseName
router.get("/defaults/:exerciseName", async (req, res) => {
  try {
    const { exerciseName } = req.params;
    const exercises = await queryItems("USER#1", "EXERCISE#" + exerciseName);
    const exerciseDef = exercises[0];

    const logs = await queryItems("USER#1", "WORKOUT#");
    const exerciseLogs = logs.filter(log => log.exercise === exerciseName);
    const latestLog = exerciseLogs[0];

    if (exerciseDef) {
      res.json({
        category: exerciseDef.category,
        muscle_group: exerciseDef.muscle_group,
        fatigue_score: latestLog ? latestLog.fatigue_score : exerciseDef.fatigue_score,
        sets: latestLog ? latestLog.sets : exerciseDef.default_sets,
        reps: latestLog ? latestLog.reps : exerciseDef.default_reps,
        rpe: latestLog ? (latestLog.rpe || null) : (exerciseDef.default_rpe || null),
        weight: latestLog ? latestLog.weight : (exerciseDef.default_weight || null)
      });
    } else {
      res.status(404).json({ error: "Exercise not found" });
    }
  } catch (err) {
    console.error("Error loading exercise defaults:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
