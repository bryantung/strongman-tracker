const express = require("express");
const router = express.Router();
const { putItem, queryItems } = require("../services/dynamo");

// GET /settings/exercises
router.get("/exercises", async (req, res) => {
  try {
    const exercises = await queryItems("USER#1", "EXERCISE#");
    exercises.sort((a, b) => a.name.localeCompare(b.name));
    res.render("settings/exercises", { exercises });
  } catch (err) {
    console.error("Error loading exercises settings:", err);
    res.status(500).send("Error loading exercises settings");
  }
});

// POST /settings/exercises/save
router.post("/exercises/save", async (req, res) => {
  try {
    const {
      name,
      category,
      muscle_group,
      fatigue_score,
      default_day,
      default_sets,
      default_reps,
      default_rpe,
      default_weight
    } = req.body;

    if (!name || !category || !muscle_group || !fatigue_score || !default_day || !default_sets || !default_reps) {
      return res.status(400).send("Missing required fields");
    }

    const item = {
      PK: "USER#1",
      SK: "EXERCISE#" + name.trim(),
      name: name.trim(),
      category,
      muscle_group,
      fatigue_score: Number(fatigue_score),
      default_day,
      default_sets: Number(default_sets),
      default_reps: String(default_reps),
      default_rpe: default_rpe ? Number(default_rpe) : null,
      default_weight: default_weight ? Number(default_weight) : null
    };

    await putItem(item);

    if (req.headers["hx-request"]) {
      const exercises = await queryItems("USER#1", "EXERCISE#");
      exercises.sort((a, b) => a.name.localeCompare(b.name));
      res.render("settings/partials/exercise_list", { exercises });
    } else {
      res.redirect("/settings/exercises");
    }
  } catch (err) {
    console.error("Error saving exercise:", err);
    res.status(500).send("Error saving exercise settings");
  }
});

module.exports = router;
