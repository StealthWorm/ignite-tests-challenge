import { AppError } from "../../../../shared/errors/AppError";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";

import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";

import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";

import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { hash } from "bcryptjs";

import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";

let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let getStatementOperation: GetStatementOperationUseCase;

describe("Get Statement Operation Info", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory);
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
    getStatementOperation = new GetStatementOperationUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
  });

  it("should be able to retrieve the information about an specific operation", async () => {
    const createdUser: ICreateUserDTO = {
      name: "User Test",
      email: "user@example.com",
      password: "password"
    }

    await createUserUseCase.execute(createdUser);

    const { user } = await authenticateUserUseCase.execute({
      email: createdUser.email,
      password: createdUser.password,
    })

    const statement = await createStatementUseCase.execute({
      user_id: user.id!,
      description: "deposit value",
      amount: 1000,
      type: OperationType.DEPOSIT,
    });

    const result = await getStatementOperation.execute({ user_id: user.id!, statement_id: statement.id! });

    expect(result.amount).toBe(1000);
    expect(result.user_id).toEqual(user.id);
  })

  it("should not be able to retrieve the information about an operation of an user that doesn't exists", async () => {
    const createdUser: ICreateUserDTO = {
      name: "User Test",
      email: "user@example.com",
      password: "password"
    }

    await createUserUseCase.execute(createdUser);

    const { user } = await authenticateUserUseCase.execute({
      email: createdUser.email,
      password: createdUser.password,
    })

    const statement = await createStatementUseCase.execute({
      user_id: user.id!,
      description: "deposit value",
      amount: 1000,
      type: OperationType.DEPOSIT,
    });

    await expect(
      getStatementOperation.execute({
        user_id: "1234567",
        statement_id: statement.id!
      })
    ).rejects.toEqual(new GetStatementOperationError.UserNotFound);
  });

  it("should not be able to retrieve the information about an operation that doesn't exists", async () => {
    const createdUser: ICreateUserDTO = {
      name: "User Test",
      email: "user@example.com",
      password: "password"
    }

    await createUserUseCase.execute(createdUser);

    const { user } = await authenticateUserUseCase.execute({
      email: createdUser.email,
      password: createdUser.password,
    })

    await expect(
      getStatementOperation.execute({
        user_id: user.id!,
        statement_id: "1234567"
      })
    ).rejects.toEqual(new GetStatementOperationError.StatementNotFound);
  });
})
