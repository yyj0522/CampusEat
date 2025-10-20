import { Test, TestingModule } from '@nestjs/testing';
import { GatheringsGateway } from './gatherings.gateway';

describe('GatheringsGateway', () => {
  let gateway: GatheringsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GatheringsGateway],
    }).compile();

    gateway = module.get<GatheringsGateway>(GatheringsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
