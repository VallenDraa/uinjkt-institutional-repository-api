import {
  BASE_REPO_URL_WITH_DSPACE,
  PUBLICATIONS_SEARCH_PATH,
} from '../common/constants';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  BASE_REPO_URL,
  PUBLICATION_FULLPATH,
  PUBLICATION_SUBPATH,
} from 'src/common/constants';
import {
  PublicationDto,
  NewestPublicationDto,
  PublicationSearchResultDto,
} from './dto';
import { ResponseService } from 'src/response/response.service';
import * as cheerio from 'cheerio';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PublicationService {
  constructor(
    private responseService: ResponseService,
    private httpService: HttpService,
  ) {}

  async getNewestPublications() {
    const { data } = await firstValueFrom(
      this.httpService.get<string>(BASE_REPO_URL_WITH_DSPACE),
    );
    const $ = cheerio.load(data);

    const carouselItems = await $('.carousel-inner').children();

    const results: NewestPublicationDto[] = [...carouselItems].map((el) => {
      const id = this.parseIdFromURLPath($(el).find('a').attr('href'));

      return {
        id,
        title: $(el).find('h4').text(),
        abstract: $(el).find('p').text(),
      };
    });

    return this.responseService.normal(
      results,
      'Successfully get newest publication data.',
    );
  }

  async getPublicationById(id: string) {
    const { data } = await firstValueFrom(
      this.httpService.get<string>(this.getPublicationPath(id)),
    );
    const $ = cheerio.load(data);

    const getTextValue = (label: cheerio.Cheerio<cheerio.Element>) =>
      label.next().text();

    const getPeopleTextValue = (label: cheerio.Cheerio<cheerio.Element>) =>
      [...label.next().find('a')].map((link) => $(link).text());

    const title = getTextValue($('.metadataFieldLabel:contains("Title:")'));
    const abstract = getTextValue(
      $('.metadataFieldLabel:contains("Abstract:")'),
    );
    const authors = getPeopleTextValue(
      $('.metadataFieldLabel:contains("Authors:")'),
    );
    const advisors = getPeopleTextValue(
      $('.metadataFieldLabel:contains("Advisors:")'),
    );
    const unparsedIssueDate = getTextValue(
      $('.metadataFieldLabel:contains("Issue Date:")'),
    );
    const issueDate =
      unparsedIssueDate && new Date(unparsedIssueDate).toISOString();
    const downloadUrls = [
      ...$('.panel.panel-info td[headers="t1"] > a[target="_blank"]'),
    ].map((el) => `${BASE_REPO_URL}${$(el).attr('href')}`);

    const result: PublicationDto = {
      id,
      title,
      abstract,
      authors,
      advisors,
      downloadUrls,
      issueDate,
    };

    return this.responseService.normal(
      result,
      `Successfully get publication with the id ${result.id}.`,
    );
  }

  async searchPublications(
    currentPageRequest = 1,
    query = '',
    authors = '',
    issueDate = '',
  ) {
    const url = this.getPublicationsSearchPath(
      currentPageRequest,
      query,
      authors,
      issueDate,
    );

    const { data } = await firstValueFrom(this.httpService.get<string>(url));
    const $ = cheerio.load(data);

    // Get search result pages metadata from
    // the pagination element in the repository site
    const pagination = $('.pagination');
    const paginationItems = [...pagination.children()];

    const currentPage = parseInt(
      pagination.find('.active > span').text() || '1',
    );
    const lastPage = $(paginationItems.at(-1)).hasClass('disabled')
      ? currentPage
      : parseInt($(paginationItems.at(-2)).children().first().text() || '1');
    const nextPage = lastPage === currentPage ? currentPage : currentPage + 1;
    const previousPage = currentPage === 1 ? currentPage : currentPage - 1;

    if (currentPageRequest !== currentPage) {
      throw new BadRequestException(
        'Your page request is greater than the last page or lower than 1!',
      );
    }

    // Get publications table result from the search
    // result table element in the repository site
    const searchResultsTable = $('.panel tbody');
    if (searchResultsTable.length === 0) {
      throw new InternalServerErrorException('Server fails to handle request!');
    }

    const results: PublicationSearchResultDto[] =
      // Get the publication table rows inside the table body
      searchResultsTable
        .children()
        // Convert the cheerio list to normal array for better handling
        .toArray()
        .map((tr, i) => {
          // The first item in the array is the table
          // header so we can just skip it altogether
          if (i === 0) {
            return null;
          }

          const rowData = [...$(tr).children()];

          // Skip any rows that doesn't have the 4 columns
          // that the PublicationSearchResultsDto needs
          if (rowData.length < 4) {
            return null;
          }

          const [issueDateRow, titleRow, authorsRow, advisorsRow] = rowData;

          const publicationUrl = $(titleRow).children().first().attr('href');
          const nonISOIssueDate = $(issueDateRow).text();

          return {
            id: this.parseIdFromURLPath(publicationUrl),
            issueDate:
              nonISOIssueDate !== '-'
                ? new Date(nonISOIssueDate).toISOString()
                : null,
            title: $(titleRow).children().first().text(),
            authors: $(authorsRow).children().first().text(),
            advisors: $(advisorsRow).children().first().text(),
          };
        })
        // Filter null items in the array, so that we get the publication data only
        .filter(Boolean);

    // Construct the pagesMetada object
    const pagesMetadata = {
      currentPage,
      lastPage,
      nextPage,
      previousPage,
    };

    return this.responseService.paginated(
      results,
      pagesMetadata,
      currentPageRequest > pagesMetadata.lastPage
        ? 'Your page request is higher than the last available page!'
        : 'Successfully searched publications.',
    );
  }

  private parseIdFromURLPath(urlPath: string) {
    const splittedPath = urlPath.split(PUBLICATION_SUBPATH);

    // Returns the last element, because that's where
    // publication id is located at.
    return splittedPath.at(-1);
  }

  private getPublicationPath(id: string) {
    return `${PUBLICATION_FULLPATH}${id}`;
  }

  private getPublicationsSearchPath(
    currentPage: number,
    query: string,
    authors: string,
    issueDate: string,
  ) {
    const itemsPerPage = 10;

    // Decrease page by one because the items start at 0
    const startAt = (currentPage - 1) * itemsPerPage;

    const queryParam = query ? `query=${query}&` : '';
    const authorsParam = authors
      ? `filter_field_1=author&filter_type_1=contains&filter_value_1=${authors}&`
      : '';
    const issueDateParam = issueDate
      ? `filter_field_2=dateIssued&filter_type_2=contains&filter_value_2=${issueDate}&`
      : '';

    return `${PUBLICATIONS_SEARCH_PATH}${queryParam}${authorsParam}${issueDateParam}sort_by=score&order=desc&rpp=10&etal=0&start=${startAt}`;
  }
}
