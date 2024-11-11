import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { AppModule } from './app.module';
import expressBasicAuth = require('express-basic-auth');

declare const module: any;

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { cors: true });
	app.useLogger(new Logger());
	app.enableCors({
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true,
	});
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

	const configService = app.get(ConfigService);
	const swaggerUser = configService.get('SWAGGER_USER');
	const swaggerPassword = configService.get('SWAGGER_PASSWORD');
	const sessionSecret = configService.get('SESSION_SECRET');

	app.use(cookieParser());
	app.use(
		['/docs', '/docs-json'],
		expressBasicAuth({
			challenge: true,
			users: { [swaggerUser]: swaggerPassword },
		}),
		session({
			secret: sessionSecret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: false, // production 환경에서는 true로 설정
				httpOnly: true,
				maxAge: 1000 * 60 * 60 * 24, // 1일
			},
		}),
	);

	const config = new DocumentBuilder()
		.setTitle('purplepepper back-office')
		.setDescription('purplepepper API docs')
		.setVersion('1.0')
		.addCookieAuth('connect.sid')
		.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document);

	const port = configService.get('PORT') || 3200;
	await app.listen(port, '0.0.0.0');
	console.info(`purplepepper Backend started on port : ${port}`);

	if (module.hot) {
		module.hot.accept();
		module.hot.dispose(() => app.close());
	}
}
bootstrap();
