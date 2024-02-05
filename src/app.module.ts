import { Module } from '@nestjs/common';
import { PublicationModule } from './publication/publication.module';
import { AuthorModule } from './author/author.module';
import { ConfigModule } from '@nestjs/config';
import { ResponseModule } from './response/response.module';

@Module({
  imports: [
    ResponseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PublicationModule,
    AuthorModule,
  ],
})
export class AppModule {}
