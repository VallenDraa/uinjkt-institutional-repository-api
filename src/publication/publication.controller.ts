import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseFilters,
} from '@nestjs/common';
import { PublicationService } from './publication.service';
import { HttpExceptionFilter } from 'src/http-exception/http-exception.filter';

@Controller('publications')
@UseFilters(new HttpExceptionFilter())
export class PublicationController {
  constructor(private publicationService: PublicationService) {}

  @Get()
  searchPublications(
    @Query('current_page', ParseIntPipe) currentPage: number,
    @Query('query') query: string,
    @Query('authors') authors: string,
    @Query('issue_date') issueDate: string,
  ) {
    return this.publicationService.searchPublications(
      currentPage,
      query,
      authors,
      issueDate,
    );
  }

  @Get('/newest')
  getNewestPublications() {
    return this.publicationService.getNewestPublications();
  }

  @Get('/:id')
  getPublicationById(@Param('id') id: string) {
    return this.publicationService.getPublicationById(id);
  }
}
