import { Test, TestingModule } from '@nestjs/testing';
import { PublicationController } from './publication.controller';
import { HttpModule } from '@nestjs/axios';
import { PublicationService } from './publication.service';
import { ResponseService } from 'src/response/response.service';

describe('PublicationController', () => {
  let controller: PublicationController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [PublicationController],
      providers: [PublicationService, ResponseService],
    }).compile();

    controller = module.get<PublicationController>(PublicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
