import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { basename, extname } from 'path';
import {
	ERROR_MESSAGE_ALL_FILES_SIZE_OVER,
	ERROR_MESSAGE_ARRAY_SIZE_OVER,
	ERROR_MESSAGE_FILE_NOT_FOUND,
} from 'src/common/constants/error-messages';
import { BoardFileResDto } from '../board/dto/res/board.file.res.dto';

@Injectable()
export class UploadService {
	private readonly s3client: S3Client;
	private readonly MAXIMUM_FILES_SIZE: number;
	private readonly MAXIMUM_FILES_ARRAY_SIZE: number;
	private readonly BUCKET_NAME: string;
	private readonly REGION_NAME: string;

	constructor(private readonly configService: ConfigService) {
		const accessKeyId = this.configService.get<string>('AWS_S3_ACCESS_KEY');
		const secretAccessKey = this.configService.get<string>('AWS_S3_SECRET_KEY');
		this.REGION_NAME = this.configService.get<string>('AWS_S3_REGION');
		this.BUCKET_NAME = this.configService.get<string>('AWS_S3_BUCKET');
		this.MAXIMUM_FILES_SIZE = 50 * 1024 * 1024;
		this.MAXIMUM_FILES_ARRAY_SIZE = 5;
		this.s3client = new S3Client({
			credentials: { accessKeyId, secretAccessKey },
			region: this.REGION_NAME,
		});
	}

	async uploadToS3(files: Express.Multer.File[]): Promise<BoardFileResDto[]> {
		if (!Array.isArray(files) || files.length == 0) throw new BadRequestException(ERROR_MESSAGE_FILE_NOT_FOUND);
		if (files.length > this.MAXIMUM_FILES_ARRAY_SIZE) throw new BadRequestException(ERROR_MESSAGE_ARRAY_SIZE_OVER);
		const filesSize = files.map((value): number => value.size);
		if (filesSize.reduce((result, value) => result + value, 0) > this.MAXIMUM_FILES_SIZE)
			throw new BadRequestException(ERROR_MESSAGE_ALL_FILES_SIZE_OVER);

		const responseObjects: BoardFileResDto[] = [];
		await Promise.all(
			files.map(async file => {
				const key = this.createS3ObjectKey(file);
				const command = new PutObjectCommand({
					Bucket: this.BUCKET_NAME,
					Key: key,
					Body: file.buffer,
					ContentType: file.mimetype,
					ACL: 'private',
				});

				try {
					await this.s3client.send(command);
				} catch (error) {
					throw error;
				}

				responseObjects.push(new BoardFileResDto({ key: key }));
			}),
		);
		return responseObjects;
	}

	async getPresignedURL(keys: string[]): Promise<string[]> {
		return Promise.all(
			keys.map(async key => {
				const command = new GetObjectCommand({ Bucket: this.BUCKET_NAME, Key: key });
				return await getSignedUrl(this.s3client, command, { expiresIn: 600 });
			}),
		);
	}

	private createS3ObjectKey(file: Express.Multer.File): string {
		const ext = extname(file.originalname);
		const base = basename(file.originalname, ext);
		const key = `attach/${base}_${new Date().toISOString()}${ext}`.replace(/ /g, '');
		return key;
	}
}
