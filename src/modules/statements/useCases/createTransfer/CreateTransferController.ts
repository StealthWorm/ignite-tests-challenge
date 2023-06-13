import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { CreateTransferUseCase } from "./CreateTransferUseCase";
import { CreateStatementUseCase } from '../createStatement/CreateStatementUseCase';

class CreateTransferController {
  async handle(request: Request, response: Response) {
    const { id: receiveUserId } = request.params;
    const { amount, description } = request.body;

    const createTransferUseCase = container.resolve(CreateTransferUseCase);

    const statements = await createTransferUseCase.execute({
      amount,
      description,
      receiveUserId,
      senderUserId: request.user.id,
    })

    response.status(201).json(statements[0]);
  }
}

export { CreateTransferController };
