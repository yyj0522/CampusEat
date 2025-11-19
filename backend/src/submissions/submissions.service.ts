import { Injectable } from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { Submission } from './entities/submission.entity';
import { User } from '../users/user.entity';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class SubmissionsService {
  constructor(private readonly uploadsService: UploadsService) {}

  async create(
    createSubmissionDto: CreateSubmissionDto,
    user: User,
    file?: Express.Multer.File,
  ): Promise<Submission> {
    let imageUrl: string | undefined = undefined;
    if (file) {
      const uploadedFile = await this.uploadsService.uploadFileToS3('submissions', file);
      imageUrl = this.uploadsService.getAwsS3FileUrl(uploadedFile.key);
    }

    const submission = Submission.create({
      ...createSubmissionDto,
      imageUrl,
      reporter: user,
      university: user.university,
    });

    await submission.save();
    return submission;
  }
}