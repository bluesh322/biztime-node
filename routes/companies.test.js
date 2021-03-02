process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

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
             RETURNING id`
  );
});

describe("Get /companies", () => {
  test("Get a list with one company", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      companies: [
        { code: "apple", name: "Apple", description: "Maker of OSX."},
        { code: "ibm", name: "IBM", description: "Big blue." },
      ],
    });
  });
});

describe("Get /companies/:code", () => {
  test("Using a code, get a company", async () => {
    const res = await request(app).get(`/companies/apple`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "apple",
        name: "Apple",
        description: "Maker of OSX.",
        invoices: [1, 2],
      },
    });
  });

  test("Responds 404 for invalid id", async () => {
    const res = await request(app).get(`/companies/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /", function () {

  test("It should add company", async function () {
    const response = await request(app)
        .post("/companies")
        .send({name: "TacoTime", description: "Yum!"});

    expect(response.body).toEqual(
        {
          "company": {
            code: "tacotime",
            name: "TacoTime",
            description: "Yum!",
          }
        }
    );
  });

  test("It should return 500 for conflict", async function () {
    const response = await request(app)
        .post("/companies")
        .send({name: "Apple", description: "Huh?"});

    expect(response.status).toEqual(500);
  })
});


describe("PUT /", function () {

  test("It should update company", async function () {
    const response = await request(app)
        .put("/companies/apple")
        .send({name: "AppleEdit", description: "NewDescrip"});

    expect(response.body).toEqual(
        {
          "company": {
            code: "apple",
            name: "AppleEdit",
            description: "NewDescrip",
          }
        }
    );
  });

  test("It should return 404 for no-such-comp", async function () {
    const response = await request(app)
        .put("/companies/blargh")
        .send({name: "Blargh", description: "but"});

    expect(response.status).toEqual(404);
  });

  test("It should return 500 for missing data", async function () {
    const response = await request(app)
        .put("/companies/apple")
        .send({});

    expect(response.status).toEqual(500);
  })
});


describe("DELETE /", function () {

  test("It should delete company", async function () {
    const response = await request(app)
        .delete("/companies/apple");

    expect(response.body).toEqual({"status": "deleted"});
  });

  test("It should return 404 for no-such-comp", async function () {
    const response = await request(app)
        .delete("/companies/blargh");

    expect(response.status).toEqual(404);
  });
});

afterEach(async () => {});

afterAll(async () => {
  await db.end();
});