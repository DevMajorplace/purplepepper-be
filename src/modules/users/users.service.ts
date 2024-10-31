import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { ERROR_MESSAGE_DUPLICATE_ID, ERROR_MESSAGE_HASH_FAILED } from '../../common/constants/error-messages';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
	constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

	//가입
	async signUp(user: SignUpReqDto): Promise<SignUpResDto> {
		const userId = user.user_id;
		const existedUserId = await this.userModel.findOne({ user_id: userId }).exec();

		if (existedUserId) {
			throw new BadRequestException(ERROR_MESSAGE_DUPLICATE_ID);
		}

		// 비밀번호 해시 및 에러 처리
		const hashedPassword = await bcrypt.hash(user.password, 10).catch(() => {
			throw new InternalServerErrorException(ERROR_MESSAGE_HASH_FAILED);
		});

		// 새로운 사용자 생성
		const newUser = new this.userModel({
			...user,
			password: hashedPassword,
			approved_at: user.role === 'agency' ? new Date() : undefined, // agency의 경우 승인일 설정
			valid: user.role === 'agency' ? true : false, // agency의 경우 가입시 바로 승인
		});
		await newUser.save();

		// 사업자등록증 S3 전송 및 URL 반환 로직 추가 필요

		// 역할에 따른 상태 값 반환
		const status = user.role === 'agency' ? 'approved' : 'pending';
		return new SignUpResDto({ status });
	}
}
