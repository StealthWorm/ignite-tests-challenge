import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuidV4 } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Get Statement Operation Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id_user = uuidV4();
    const password = await hash("admin", 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at)
          values('${id_user}', 'admin', 'admin@rentx.com.br', '${password}', 'now()', 'now()');
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to retrieve the info of a specific statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com.br",
      password: "admin",
    })

    const { token } = responseToken.body;

    const createdStatement = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 900,
        description: "Test Deposit",
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    const response = await request(app)
      .get(`/api/v1/statements/${createdStatement.body.id}`)
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body.amount)).toEqual(900);
    expect(response.body.type).toEqual('deposit');
  })
})
