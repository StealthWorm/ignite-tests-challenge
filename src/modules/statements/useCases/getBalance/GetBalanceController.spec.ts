import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuidV4 } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id_user = uuidV4();
    const password = await hash("admin", 8);
    const id_statement_deposit = uuidV4();
    const id_statement_withdraw = uuidV4();

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at)
          values('${id_user}', 'admin', 'admin@rentx.com.br', '${password}', 'now()', 'now()');
       INSERT INTO STATEMENTS(id, user_id, description, amount, type, created_at, updated_at)
          values('${id_statement_deposit}', '${id_user}', 'deposit value', 500.00, 'deposit','now()', 'now()');
       INSERT INTO STATEMENTS(id, user_id, description, amount, type, created_at, updated_at)
          values('${id_statement_withdraw}', '${id_user}', 'withdraw value', 250.00, 'withdraw','now()', 'now()');
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to retrieve the balance of an authenticated user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com.br",
      password: "admin",
    })

    const { token } = responseToken.body;

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.balance).toEqual(250);
    expect(response.body.statement.length).toEqual(2);
  })
})
