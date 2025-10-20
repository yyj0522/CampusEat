// 파일 전체 경로: src/shuttles/entities/shuttle.entity.ts

import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Shuttle extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  universityName: string; // 어느 대학교 소속인지

  @Column()
  routeName: string; // 노선 이름 (예: "두정역 ↔ 캠퍼스(등교)")

  @Column()
  departureLocation: string;

  @Column()
  arrivalLocation: string;

  // PostgreSQL의 배열 타입을 사용하여 시간 목록을 저장합니다.
  @Column('text', { array: true })
  times: string[];
}