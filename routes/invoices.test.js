process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

const testGET = {
  id: 1,
  comp_code: "mst",
};

beforeEach(async () => {
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
  await db.query("SELECT setval('invoices_id_seq', 1, false)");

  await db.query(`INSERT INTO companies (code, name, description)
                    VALUES ('apple', 'Apple', 'Maker of OSX.'),
                           ('ibm', 'IBM', 'Big blue.')`);

  const inv = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
           VALUES ('apple', 100, false, '2018-01-01', null),
                  ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                  ('ibm', 300, false, '2018-03-01', null)
           RETURNING id`);
});

describe("Get /invoices", () => {
  test("Get a list with one invoice", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ "invoices": [
        {id: 1, comp_code: "apple"},
        {id: 2, comp_code: "apple"},
        {id: 3, comp_code: "ibm"},
      ]});
  });
});

describe("Get /invoices/:id", () => {
  test("Using an id, get an invoice", async () => {
    const res = await request(app).get(`/invoices/1`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({"invoice": {
        id: 1,
        amt: 100,
        add_date: '2018-01-01T06:00:00.000Z',
        paid: false,
        paid_date: null,
        comp_code: "apple",
        company: {
          code: 'apple',
          name: 'Apple',
          description: 'Maker of OSX.',
        }
      }});
  });

  test("Responds 404 for invalid id", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.statusCode).toBe(404);
  });
});

afterAll(async () => {
  await db.end();
});

describe("POST /", function () {

  test("It should add invoice", async function () {
    const response = await request(app)
        .post("/invoices")
        .send({amt: 400, comp_code: 'ibm'});

    expect(response.body).toEqual(
        {
          "invoice": {
            id: 4,
            comp_code: "ibm",
            amt: 400,
            add_date: expect.any(String),
            paid: false,
            paid_date: null,
          }
        }
    );
  });
});


describe("PUT /", function () {

  test("It should update an invoice", async function () {
    const response = await request(app)
        .put("/invoices/1")
        .send({amt: 1000, paid: false});

    expect(response.body).toEqual(
        {
          "invoice": {
            id: 1,
            comp_code: 'apple',
            paid: false,
            amt: 1000,
            add_date: expect.any(String),
            paid_date: null,
          }
        }
    );
  });

  test("It should return 404 for no-such-invoice", async function () {
    const response = await request(app)
        .put("/invoices/9999")
        .send({amt: 1000});

    expect(response.status).toEqual(404);
  });

  test("It should return 500 for missing data", async function () {
    const response = await request(app)
        .put("/invoices/1")
        .send({});

    expect(response.status).toEqual(500);
  })
});


describe("DELETE /", function () {

  test("It should delete invoice", async function () {
    const response = await request(app)
        .delete("/invoices/1");

    expect(response.body).toEqual({"status": "deleted"});
  });

  test("It should return 404 for no-such-invoices", async function () {
    const response = await request(app)
        .delete("/invoices/999");

    expect(response.status).toEqual(404);
  });
});