import { Test, TestingModule } from '@nestjs/testing';
import { GatheringsController } from './gatherings.controller';

describe('GatheringsController', () => {
  let controller: GatheringsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatheringsController],
    }).compile();

    controller = module.get<GatheringsController>(GatheringsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
