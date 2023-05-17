import { AppError } from "../../../../shared/errors/AppError";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";

import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";

import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { GetBalanceUseCase } from "./GetBalanceUseCase";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { hash } from "bcryptjs";
import { GetBalanceError } from "./GetBalanceError";

let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let getBalanceUseCase: GetBalanceUseCase;

describe("Get User Balance", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory);
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
    getBalanceUseCase = new GetBalanceUseCase(statementsRepositoryInMemory, usersRepositoryInMemory);
  });

  it("should be able to retrieve the balance of an existing user", async () => {
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

    await createStatementUseCase.execute({
      user_id: user.id!,
      description: "deposit value",
      amount: 1000,
      type: OperationType.DEPOSIT,
    });

    await createStatementUseCase.execute({
      user_id: user.id!,
      description: "withdraw value",
      amount: 300,
      type: OperationType.WITHDRAW,
    });

    const result = await getBalanceUseCase.execute({ user_id: user.id! });

    expect(result.statement.length).toBe(2);
    expect(result.balance).toBe(700);
  })

  it("should not be able to retrieve the balance of an user that doesn't exists", async () => {
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
    ).rejects.toEqual(new GetBalanceError);
  });
})
