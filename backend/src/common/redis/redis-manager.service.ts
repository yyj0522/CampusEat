import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisManagerService.name);
  private client: Redis;

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL);

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async addUserToLecture(lectureId: number, userId: number | string): Promise<number> {
    const key = `lecture:${lectureId}:users`;
    await this.client.sadd(key, String(userId));
    return await this.client.scard(key);
  }

  async removeUserFromLecture(lectureId: number, userId: number | string): Promise<number> {
    const key = `lecture:${lectureId}:users`;
    await this.client.srem(key, String(userId));
    return await this.client.scard(key);
  }

  async getLectureUserCount(lectureId: number): Promise<number> {
    const key = `lecture:${lectureId}:users`;
    return await this.client.scard(key);
  }

  async getMultipleLectureCounts(lectureIds: number[]): Promise<{ id: number; count: number }[]> {
    if (!lectureIds || lectureIds.length === 0) return [];
    
    const pipeline = this.client.pipeline();
    lectureIds.forEach(id => pipeline.scard(`lecture:${id}:users`));
    
    const results = await pipeline.exec();
    
    return lectureIds.map((id, index) => {
      const [err, count] = results[index];
      return {
        id,
        count: count ? (count as number) : 0
      };
    });
  }
}