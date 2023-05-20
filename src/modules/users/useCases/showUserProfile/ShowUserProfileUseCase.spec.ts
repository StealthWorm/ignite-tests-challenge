import { hash } from "bcryptjs";
import { User } from "../../entities/User";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase"
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";
import { ShowUserProfileError } from "./ShowUserProfileError";

let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;

describe("Show User Profile", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory);
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepositoryInMemory);
  });

  it("should be able to get an user profile", async () => {
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

    const result = await showUserProfileUseCase.execute(loggedUser.user.id!);

    expect(result).toBeInstanceOf(User);
    expect(result.email).toEqual("user@example.com");
  });

  it("should not be able to retrieve a profile of a user that doesn't exist", async () => {
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
     showUserProfileUseCase.execute(await hash('123456', 8))
    ).rejects.toEqual(new ShowUserProfileError);
  });
})
