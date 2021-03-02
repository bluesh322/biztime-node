/** Routes for users of pg-intro-demo. */

const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

/** GET  invoice {invoices: [{id, comp_code}, ...] }*/

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, comp_code FROM 
      invoices
      ORDER BY id`
    );

    return res.status(200).json({invoices: result.rows});
  } catch (err) {
    return next(err);
  }
});

/** Get invoices: {invoices: [{code, name, description}, ...] }*/

router.get("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
          SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description 
          FROM invoices AS i
          INNER JOIN companies AS c ON (i.comp_code = c.code)
          WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`No invoice with id: ${id}`, 404);
    }

    const data = result.rows[0];
    const invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      comp_code: data.comp_code,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      }

    };

    return res.status(200).json({invoice: invoice});
  } catch (err) {
    return next(err);
  }
});

/** POST invoices: {invoices: [{code, name, description}, ...] }*/

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
      );
    return res.status(201).json({invoice: result.rows[0]})
  } catch (err) {
    return next(err);
  }
});

/** UPDATE invoices: {invoices: [{code, name, description}, ...] }*/

router.put("/:id", async (req, res, next) => {
  try {
    const {id} = req.params
    const {amt, paid} = req.body;
    let paidDate = null;

    const checkInvoice = await db.query(
      `SELECT paid
      FROM invoices
      WHERE id = $1`,
      [id]
    );

    if (checkInvoice.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }

    if (!req.body.amt || req.body.paid == null) {
      throw new ExpressError(`Insufficient information in the body`, 500);
    }

    const checkPaidDate = checkInvoice.rows[0].paid_date;

    if(!checkPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = checkPaidDate;
    }
    const result = await db.query(
      `UPDATE invoices 
      SET amt=$2, paid=$3, paid_date=$4
      WHERE id = $1
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [id, amt, paid, paidDate]
      );
    return res.status(201).json({invoice: result.rows[0]})
  } catch (err) {
    return next(err);
  }
});

/** Delete invoice, returning {status: "Deleted"} */

router.delete("/:id", async function (req, res, next) {
  try {
    let {id} = req.params;

    const result = await db.query(
        `DELETE FROM invoices
        WHERE id = $1
        RETURNING id`,
        [id]
    );

    
    if (result.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }

    return res.json({status: "deleted"});
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;
