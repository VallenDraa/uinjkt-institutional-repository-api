import { Module } from '@nestjs/common';
import { AuthorModule } from './author/author.module';
import { ConfigModule } from '@nestjs/config';
import { ResponseModule } from './response/response.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ResponseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
