import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class StorageService {
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('OCI_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('OCI_SECRET_ACCESS_KEY'),
      endpoint: this.configService.get('OCI_ENDPOINT'),
      region: this.configService.get('OCI_REGION'),
      s3ForcePathStyle: true,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    let buffer = file.buffer;

    // Optimize images
    if (file.mimetype.startsWith('image/')) {
      buffer = await sharp(file.buffer)
        .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    const uploadParams = {
      Bucket: this.configService.get('OCI_BUCKET_NAME'),
      Key: fileName,
      Body: buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await this.s3.upload(uploadParams).promise();
    return result.Location;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(fileUrl);
    
    const deleteParams = {
      Bucket: this.configService.get('OCI_BUCKET_NAME'),
      Key: key,
    };

    await this.s3.deleteObject(deleteParams).promise();
  }

  async generatePresignedUrl(key: string, expiresIn: number = 600): Promise<string> {
    const params = {
      Bucket: this.configService.get('OCI_BUCKET_NAME'),
      Key: key,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrlPromise('getObject', params);
  }

  private extractKeyFromUrl(fileUrl: string): string {
    const url = new URL(fileUrl);
    return url.pathname.substring(1); // Remove leading slash
  }
}