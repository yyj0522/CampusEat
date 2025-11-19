import { Test, TestingModule } from '@nestjs/testing';
import { GatheringsService } from './gatherings.service';

describe('GatheringsService', () => {
  let service: GatheringsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GatheringsService],
    }).compile();

    service = module.get<GatheringsService>(GatheringsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
