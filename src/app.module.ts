import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			// envFilePath: ['.env.local', '.env'],
			// cache: true,
			expandVariables: true,
		}),
	],
	controllers: [AppController],
	providers: [AppService, RedisService],
})
export class AppModule { }
