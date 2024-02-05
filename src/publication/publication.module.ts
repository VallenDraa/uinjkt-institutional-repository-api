import { Module } from '@nestjs/common';
import { PublicationController } from './publication.controller';
import { PublicationService } from './publication.service';

@Module({
  controllers: [PublicationController],
  providers: [PublicationService],
})
export class PublicationModule {}
