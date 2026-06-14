const express = require("express");
const db = require("../db");

const router = express.Router();

function parseProductId(rawId) {
  const id = Number(rawId);

  if (!Number.isInteger(id) || id < 1) {
    const error = new Error("product_id doit être un entier positif");
    error.status = 400;
    throw error;
  }

  return id;
}

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id, name, description, price_cents FROM products ORDER BY id"
    );

    res.json({
      source: "database",
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const productId = parseProductId(req.params.id);
    const result = await db.query(
      "SELECT id, name, description, price_cents FROM products WHERE id = $1",
      [productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }

    res.json({
      source: "database",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  router,
  parseProductId
};
