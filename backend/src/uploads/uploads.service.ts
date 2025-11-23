import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as common from 'oci-common';
import * as os from 'oci-objectstorage';

@Injectable()
export class UploadsService {
  private provider: common.SimpleAuthenticationDetailsProvider;
  private client: os.ObjectStorageClient;
  private namespace: string;

  constructor(private readonly configService: ConfigService) {
    const configuration = {
      tenancy: this.configService.get<string>('OCI_TENANCY_ID'),
      user: this.configService.get<string>('OCI_USER_ID'),
      fingerprint: this.configService.get<string>('OCI_FINGERPRINT'),
      privateKey: fs.readFileSync(
        this.configService.get<string>('OCI_KEY_FILE_PATH'),
        'utf8',
      ),
      region: common.Region.AP_CHUNCHEON_1, 
    };

    this.provider = new common.SimpleAuthenticationDetailsProvider(
      configuration.tenancy,
      configuration.user,
      configuration.fingerprint,
      configuration.privateKey,
      null,
      configuration.region,
    );

    this.client = new os.ObjectStorageClient({
      authenticationDetailsProvider: this.provider,
    });
  }

  async uploadFile(
    folder: string,
    file: Express.Multer.File,
  ): Promise<{ key: string; url: string }> {
    try {
      if (!this.namespace) {
        const request: os.requests.GetNamespaceRequest = {};
        const response = await this.client.getNamespace(request);
        this.namespace = response.value;
      }

      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const objectName = `${folder}/${Date.now()}_${originalName}`;
      const bucketName = this.configService.get<string>('OCI_BUCKET_NAME');

      const putObjectRequest: os.requests.PutObjectRequest = {
        namespaceName: this.namespace,
        bucketName: bucketName,
        objectName: objectName,
        putObjectBody: file.buffer,
        contentType: file.mimetype,
      };

      await this.client.putObject(putObjectRequest);

      const region = this.configService.get<string>('OCI_REGION');
      const encodedName = encodeURIComponent(objectName);
      const url = `https://objectstorage.${region}.oraclecloud.com/n/${this.namespace}/b/${bucketName}/o/${encodedName}`;

      return { key: objectName, url };
    } catch (error) {
      console.error('OCI Upload Error:', error);
      throw new InternalServerErrorException('File upload failed');
    }
  }
}