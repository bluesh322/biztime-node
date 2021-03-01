/** Routes for users of pg-intro-demo. */

const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

/** GET  companies: {companies: [{code, name}, ...] }*/

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(`SELECT code, name FROM companies`);

    return res.json({ companies: result.rows });
  } catch (err) {
    return next(err);
  }
});

/** Get companies: {companies: [{code, name, description}, ...] }*/

router.get("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;

    const result = await db.query(
      `
        SELECT * FROM companies
        WHERE code = $1`,
      [code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can't find user with code of ${code}`, 404);
    }

    return res.json({ companies: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** Create new company, return {company: {code, name, description} */

router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;

    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ companies: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** Edit existing company, return {company: {code, name, description} */

router.put("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const { name, description } = req.body;

    const result = await db.query(
      `UPDATE companies SET name = $1, description = $2
               WHERE code = $3
               RETURNING code, name, description`,
      [name, description, code]
    );
    if (result.rows.length === 0) {
        throw new ExpressError(`Can't find user with code of ${code}`, 404);
    }

    return res.status(201).json({ companies: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** Delete existing company, return {status: "deleted"} */

router.delete("/:code", async function (req, res, next) {
    try {
      const { code } = req.params;
  
      const result = await db.query(
        `DELETE FROM companies WHERE code = $1 RETURNING code`,
        [code]
      );

      if (result.rows.length === 0) {
        throw new ExpressError(`Can't find user with code of ${code}`, 404);
      }
  
      return res.status(201).json({status: "deleted"});
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;
