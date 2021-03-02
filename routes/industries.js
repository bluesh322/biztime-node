const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

router.get("/", async function (req, res, next) {
  try {
    const {code} = req.params
    const result = await db.query(
      `SELECT ind.ind_code, ind.industry, c.code FROM industries AS ind
            LEFT JOIN
            company_industries AS ci
            ON ind.ind_code = ci.ind_code
            LEFT JOIN
            companies AS c
            ON ci.comp_code = c.code`
    );

    return res.json({ industries: result.rows });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { comp_code, ind_code } = req.body;
    const result = await db.query(
      `INSERT INTO company_industries (comp_code, ind_code)
             VALUES ($1, $2)
             RETURNING comp_code, ind_code`,
      [comp_code, ind_code]
    );
    return res.status(201).json({ company_industries: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
