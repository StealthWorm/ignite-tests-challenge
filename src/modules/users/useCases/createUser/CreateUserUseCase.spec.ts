import { compare } from "bcryptjs";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { ICreateUserDTO } from "./ICreateUserDTO";
import { CreateUserError } from "./CreateUserError";

let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe("Create User", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
  });

  it("should be able to create a user", async () => {
    const user: ICreateUserDTO = await createUserUseCase.execute({
      name: "User Test",
      email: "user@example.com",
      password: "password"
    });

    expect(user.name).toEqual("User Test");
    expect(await compare("password", user.password)).toBe(true);
  })

  it("should not be able to create a user that already exists", async () => {
    await createUserUseCase.execute({
      name: "User Test",
      email: "user@example.com",
      password: "password"
    });

    await expect(
      createUserUseCase.execute({
        name: "User Test",
        email: "user@example.com",
        password: "password"
      })
    ).rejects.toEqual(new CreateUserError);
  })
})
