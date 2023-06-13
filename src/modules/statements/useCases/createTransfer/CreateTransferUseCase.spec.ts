import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";

import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";

import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { CreateTransferUseCase } from "./CreateTransferUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";

let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let createTransferUseCase: CreateTransferUseCase;
let getBalanceUseCase: GetBalanceUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Create Transfer Statement", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory);
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
    getBalanceUseCase = new GetBalanceUseCase(statementsRepositoryInMemory, usersRepositoryInMemory);
    createTransferUseCase = new CreateTransferUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
  });

  it("should be able to create a new transfer statement between two existing users", async () => {
    const userSender: ICreateUserDTO = {
      name: "Vincent Lamb",
      email: "tuwsahew@tekfumak.th",
      password: "1234"
    }

    await createUserUseCase.execute(userSender);
    const userReceiver = await createUserUseCase.execute({
      name: "Evelyn Lewis",
      email: "now@em.aw",
      password: "123456"
    });

    const loggedUser = await authenticateUserUseCase.execute({
      email: userSender.email,
      password: userSender.password,
    })

    await createStatementUseCase.execute({
      user_id: loggedUser.user.id!,
      description: "deposit value",
      amount: 2000,
      type: OperationType.DEPOSIT,
    });

    const statements: ICreateStatementDTO[] = await createTransferUseCase.execute({
      amount: 300,
      description: "transfer value",
      receiveUserId: userReceiver.id as string,
      senderUserId: loggedUser.user.id!
    });

    expect(statements[0].amount).toEqual(300);
    expect(statements[0].type).toEqual("transfer");
    expect(statements[0].user_id).toEqual(loggedUser.user.id);
  })
})
