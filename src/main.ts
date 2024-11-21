import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { AppModule } from './app.module';
import expressBasicAuth = require('express-basic-auth');

declare const module: any;

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Logger 설정
	app.useLogger(new Logger());

	// ConfigService 가져오기
	const configService = app.get(ConfigService);
	const swaggerUser = configService.get('SWAGGER_USER');
	const swaggerPassword = configService.get('SWAGGER_PASSWORD');
	const sessionSecret = configService.get('SESSION_SECRET');
	const port = configService.get('PORT') || 3200;

	// CORS 설정
	app.enableCors({
		origin: 'http://localhost:3000', // 프론트엔드 URL
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true, // 쿠키 및 인증 정보 허용
	});

	// 쿠키 파서 추가
	app.use(cookieParser());

	// 세션 설정
	app.use(
		session({
			secret: sessionSecret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: false, // HTTPS 사용 시 true로 변경
				httpOnly: true, // 클라이언트 스크립트 접근 불가
				maxAge: 1000 * 60 * 60 * 24, // 1일
			},
		}),
	);

	// CORS 헤더 수동 추가 (세션 이후에도 헤더가 유지되도록)
	app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
		res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
		res.header('Access-Control-Allow-Credentials', 'true');
		next();
	});

	// Swagger Basic Auth 설정
	app.use(
		['/docs', '/docs-json'],
		expressBasicAuth({
			challenge: true,
			users: { [swaggerUser]: swaggerPassword },
		}),
	);

	// Swagger 설정
	const config = new DocumentBuilder()
		.setTitle('purplepepper back-office')
		.setDescription('purplepepper API docs')
		.setVersion('1.0')
		.addCookieAuth('connect.sid') // 쿠키 인증 추가
		.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document);

	// 서버 시작
	await app.listen(port, '0.0.0.0');
	console.info(`purplepepper Backend started on port : ${port}`);

	// Hot module reload 설정 (선택 사항)
	if (module.hot) {
		module.hot.accept();
		module.hot.dispose(() => app.close());
	}
}

bootstrap();
