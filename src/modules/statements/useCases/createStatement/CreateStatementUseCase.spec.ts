import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";

import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { ICreateStatementDTO } from "./ICreateStatementDTO";
import { OperationType } from "../../entities/Statement";

import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { hash } from "bcryptjs";
import { CreateStatementError } from "./CreateStatementError";

let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Create Statement", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory);
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
  });

  it("should be able to create a new statement for an existing user", async () => {
    const user: ICreateUserDTO = {
      name: "User Test",
      email: "user@example.com",
      password: "password"
    }

    await createUserUseCase.execute(user);

    const loggedUser = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    })

    const statement: ICreateStatementDTO = await createStatementUseCase.execute({
      user_id: loggedUser.user.id!,
      description: "deposit value",
      amount: 1000,
      type: OperationType.DEPOSIT,
    });

    expect(statement.amount).toEqual(1000);
    expect(statement.type).toEqual("deposit");
  })

  it("should not be able to create a statement for an user that doesn't exists", async () => {
    const user: ICreateUserDTO = {
      name: "User Test",
      email: "user@example.com",
      password: "password"
    }

    await createUserUseCase.execute(user);

    await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    })

    await expect(
      createStatementUseCase.execute({
        user_id: await hash('123456', 8),
        description: "deposit value",
        amount: 1000,
        type: OperationType.DEPOSIT,
      })
    ).rejects.toEqual(new CreateStatementError.UserNotFound);
  });

  it("should not be able to withdraw values if the balance is less than the amount", async () => {
    const user: ICreateUserDTO = {
      name: "User Test",
      email: "user@example.com",
      password: "password"
    }

    await createUserUseCase.execute(user);

    const loggedUser = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    })

    await createStatementUseCase.execute({
      user_id: loggedUser.user.id!,
      description: "deposit value",
      amount: 1000,
      type: OperationType.DEPOSIT,
    });

    await expect(
      createStatementUseCase.execute({
        user_id: loggedUser.user.id!,
        description: "withdraw value",
        amount: 1001,
        type: OperationType.WITHDRAW,
      })
    ).rejects.toEqual(new CreateStatementError.InsufficientFunds);
  })
})
