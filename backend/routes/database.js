const express = require("express");
const router = express.Router();
const dbService = require("../services/dbService");

// Connect to database
router.post("/connect", async (req, res) => {
  try {
    const { host, port, database, username, password } = req.body;
    const config = {
      host,
      port,
      database,
      user: username,
      password,
    };

    const result = await dbService.connect(config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get database schema
router.get("/schema", async (req, res) => {
  try {
    const schema = await dbService.getSchemaInfo();
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get table data
router.get("/table/:tableName/data", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 100 } = req.query;
    const data = await dbService.getTableData(tableName, parseInt(limit));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect from database
router.post("/disconnect", async (req, res) => {
  try {
    await dbService.disconnect();
    res.json({ success: true, message: "Disconnected successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
