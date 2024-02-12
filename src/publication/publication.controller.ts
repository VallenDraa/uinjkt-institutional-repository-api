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
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@Controller('publications')
@ApiTags('Publications')
@UseFilters(new HttpExceptionFilter())
export class PublicationController {
  constructor(private publicationService: PublicationService) {}

  @Get()
  @ApiOperation({
    summary:
      'Returns publications search results based on provided query parameter.',
  })
  @ApiQuery({
    name: 'current_page',
    description: 'Current page of the publication search result.',
  })
  @ApiQuery({
    name: 'query',
    description: 'Keyword for searching the publication.',
  })
  @ApiQuery({
    name: 'authors',
    description: 'Search publications by the author.',
  })
  @ApiQuery({
    name: 'issue_date',
    description: 'The date in which the publication is published.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      example: {
        data: [{ id: '1', title: 'a', abstract: 'b' }],
        status: 200,
        message: '',
      },
    },
  })
  @ApiBadRequestResponse({
    schema: {
      type: 'object',
      example: { data: null, status: 400, message: '' },
    },
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      example: { data: null, status: 500, message: '' },
    },
  })
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
  @ApiOperation({ summary: 'Returns the newest publications.' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      example: {
        data: [{ id: '1', title: 'lorem', abstract: 'ipsum' }],
        status: 200,
        message: '',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      example: { data: null, status: 500, message: '' },
    },
  })
  getNewestPublications() {
    return this.publicationService.getNewestPublications();
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Returns a publication based on provided ID.',
  })
  @ApiParam({ name: 'id', description: 'ID of the publication.' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      example: {
        data: {
          id: '1',
          title: 'lorem',
          abstract: 'ipsum',
          authors: ['john', 'doe'],
          advisors: ['jane', 'doe'],
          downloadUrls: ['https://example.com/download'],
          issueDate: new Date().toISOString(),
        },
        status: 200,
        message: '',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      example: { data: null, status: 500, message: '' },
    },
  })
  @ApiNotFoundResponse({
    schema: {
      type: 'object',
      example: { data: null, status: 400, message: '' },
    },
  })
  getPublicationById(@Param('id') id: string) {
    return this.publicationService.getPublicationById(id);
  }
}
