import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class UploadsService {
  private readonly awsS3: AWS.S3;
  public readonly S3_BUCKET_NAME: string;
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly configService: ConfigService) {
    this.awsS3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });
    this.S3_BUCKET_NAME = this.configService.get('AWS_S3_BUCKET_NAME') as string;
  }

  async uploadFileToS3(
    folder: string,
    file: Express.Multer.File,
  ): Promise<{ key: string; s3Object: any; contentType: string }> {
    try {
      // ✅ 한글 파일명 복원 (multer가 Latin1로 잘못 읽은 것을 UTF-8로 재해석)
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

      // ✅ S3 Key는 원문 그대로 사용
      const key = `${folder}/${Date.now()}_${originalName}`;

      const s3Object = await this.awsS3
        .putObject({
          Bucket: this.S3_BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
        .promise();

      return { key, s3Object, contentType: file.mimetype };
    } catch (error) {
      this.logger.error('S3 upload error:', error);
      throw error;
    }
  }

  public getAwsS3FileUrl(objectKey: string) {
    return `https://${this.S3_BUCKET_NAME}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${objectKey}`;
  }
}
