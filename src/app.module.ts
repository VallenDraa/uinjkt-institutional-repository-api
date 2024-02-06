import { Module } from '@nestjs/common';
import { PublicationModule } from './publication/publication.module';
import { AuthorModule } from './author/author.module';
import { ConfigModule } from '@nestjs/config';
import { ResponseModule } from './response/response.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponseService } from './response/response.service';

@Module({
  imports: [
    ResponseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PublicationModule,
    AuthorModule,
  ],
  controllers: [AppController],
  providers: [AppService, ResponseService],
})
export class AppModule {}
