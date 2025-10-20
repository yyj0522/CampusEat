import { PartialType } from '@nestjs/mapped-types';
import { CreateShuttleDto } from './create-shuttle.dto';

export class UpdateShuttleDto extends PartialType(CreateShuttleDto) {}
