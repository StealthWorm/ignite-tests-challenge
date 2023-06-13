import { container, inject, injectable } from "tsyringe";

import { AppError } from "../../../../shared/errors/AppError";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType, Statement } from "../../entities/Statement";

import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";

interface IRequest {
  amount: number;
  description: string;
  receiveUserId: string;
  senderUserId: string;
}

@injectable()
class CreateTransferUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) { }

  async execute({ amount, description, receiveUserId, senderUserId }: IRequest): Promise<Statement[]> {
    if (amount <= 0) {
      throw new AppError("Amount must be greater than 0");
    }

    const senderUser = await this.usersRepository.findById(senderUserId);

    if (!senderUser) {
      throw new AppError("Sender user not found");
    }

    const receiveUser = await this.usersRepository.findById(receiveUserId);

    if (!receiveUser) {
      throw new AppError("Receive user not found");
    }

    const senderOperation = await this.statementsRepository.create({
      amount: amount,
      description,
      type: OperationType.TRANSFER,
      user_id: senderUser.id as string,
      sender_id: senderUser.id as string,
    });

    const receiverOperation = await this.statementsRepository.create({
      amount: amount * -1,
      description,
      type: OperationType.TRANSFER,
      user_id: receiveUser.id as string,
      sender_id: senderUser.id as string,
    });

    return [senderOperation, receiverOperation];
  }
}

export { CreateTransferUseCase }
