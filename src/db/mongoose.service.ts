import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MongooseService {
	private readonly logger = new Logger(MongooseService.name);

	constructor() {
		this.initializeService();
	}

	private async initializeService() {
		try {
			this.logger.log('Mongoose Service Initialized');
		} catch (error) {
			this.logger.error('Mongoose Service initialization failed', error.stack);
		}
	}
}
