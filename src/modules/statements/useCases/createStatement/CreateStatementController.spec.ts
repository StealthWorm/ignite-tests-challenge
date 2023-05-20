import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuidV4 } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Create Statement User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("admin", 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at)
          values('${id}', 'admin', 'admin@rentx.com.br', '${password}', 'now()', 'now()');`
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a new deposit statement to an authenticated user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com.br",
      password: "admin",
    })

    const { token } = responseToken.body;

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 900,
        description: "Test Deposit",
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body.amount).toEqual(900);
  })

  it("should be able to create a new withdraw statement to an authenticated user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com.br",
      password: "admin",
    })

    const { token } = responseToken.body;

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 100,
        description: "Test Withdraw",
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body.amount).toEqual(100);
  })

  it("should not be able to withdraw values if the balance is less than the amount", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com.br",
      password: "admin",
    })

    const { token } = responseToken.body;

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 901,
        description: "Test Withdraw",
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.statusCode).toEqual(400);
  })
})
