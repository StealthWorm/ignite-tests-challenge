import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuidV4 } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Authenticate User Controller", () => {
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

  it("should be able to authenticate a new user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com.br",
      password: "admin",
    })
    // const { token } = responseToken.body;

    // const response = await request(app)
    //   .post("/api/v1/sessions")
    //   .send({
    //     name: "teste",
    //     email: "teste@email.com.br",
    //     password: "teste",
    //   })
    //   .set({
    //     Authorization: `Bearer ${token}`
    //   })

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.name).toBe("admin");
    expect(response.body.token).toBeDefined();
  })
})
