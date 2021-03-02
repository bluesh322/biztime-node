/** Routes for users of pg-intro-demo. */

const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const slugify = require("slugify");

/** GET  companies: {companies: [{code, name}, ...] }*/

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT c.code, c.name, c.description, ind.industry FROM companies AS c
      LEFT JOIN company_industries AS ci
      ON c.code = ci.comp_code
      LEFT JOIN industries AS ind
      ON ci.ind_code = ind.ind_code`
    );

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
        SELECT code, name, description FROM companies
        WHERE code = $1`,
      [code]
    );

    const invResult = await db.query(
      `SELECT id
       FROM invoices
       WHERE comp_code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Can't find a company with code of ${code}`, 404);
    }

    result.invoices = invResult.rows.map(inv => inv.id);
    company = result.rows[0];

    company.invoices = result.invoices

    return res.status(200).json({ company: company });
  } catch (err) {
    return next(err);
  }
});

/** Create new company, return {company: {code, name, description} */

router.post("/", async function (req, res, next) {
  try {
    const { name, description } = req.body;
    let code = slugify(name, { lower: true });

    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** Edit existing company, return {company: {code, name, description} */

router.put("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    if (!req.body.name || !req.body.description) {
      throw new ExpressError(`Insufficient information in the body`, 500);
    }
    
    const { name, description } = req.body;



    const result = await db.query(
      `UPDATE companies SET name = $1, description = $2
               WHERE code = $3
               RETURNING code, name, description`,
      [name, description, code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    return res.status(201).json({ company: result.rows[0] });
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
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    return res.status(201).json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
