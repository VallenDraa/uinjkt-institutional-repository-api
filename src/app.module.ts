import { Module } from '@nestjs/common';
import { PublicationModule } from './publication/publication.module';
import { AuthorModule } from './author/author.module';
import { ConfigModule } from '@nestjs/config';
import { ResponseModule } from './response/response.module';
import { ResponseService } from './response/response.service';

@Module({
  imports: [
    ResponseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PublicationModule,
    AuthorModule,
  ],
  providers: [ResponseService],
})
export class AppModule {}
