import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  public readonly S3_BUCKET_NAME: string;
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.S3_BUCKET_NAME = this.configService.get('AWS_S3_BUCKET_NAME') as string;
  }

  async uploadFileToS3(
    folder: string,
    file: Express.Multer.File,
  ): Promise<{ key: string; s3Object: any; contentType: string }> {
    try {
      const originalName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );

      const key = `${folder}/${Date.now()}_${originalName}`;

      const command = new PutObjectCommand({
        Bucket: this.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      const s3Object = await this.s3Client.send(command);

      return { key, s3Object, contentType: file.mimetype };
    } catch (error) {
      this.logger.error('S3 upload error:', error);
      throw error;
    }
  }

  public getAwsS3FileUrl(objectKey: string) {
    return `https://${this.S3_BUCKET_NAME}.s3.${this.configService.get(
      'AWS_REGION',
    )}.amazonaws.com/${objectKey}`;
  }
}