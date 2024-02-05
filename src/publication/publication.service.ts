import { PUBLICATIONS_SEARCH_PATH } from './../common/constants';
import { BadRequestException, Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
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
import { PromiseHelper } from 'src/common/helpers/promise.helper';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class PublicationService {
  constructor(private responseService: ResponseService) {}

  async getNewestPublications() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await Promise.allSettled([
      page.goto(BASE_REPO_URL),
      page.setViewport({ width: 1080, height: 1024 }),
    ]);

    const carousel = await page.waitForSelector('.carousel-inner');

    const resultsWithUnparsedId = await carousel.evaluate((carousel) => {
      const carouselItems = [...carousel.children];

      const newestPublications = carouselItems.map((item) => {
        return {
          url: item.querySelector('a').href,
          title: item.querySelector('h4').innerText,
          abstract: item.querySelector('p').innerText,
        };
      });

      return newestPublications;
    });

    const results: NewestPublicationDto[] = resultsWithUnparsedId.map(
      (publication) => {
        return {
          id: this.parseIdFromURLPath(publication.url),
          title: publication.title,
          abstract: publication.abstract,
        };
      },
    );

    await page.close();

    return this.responseService.normal(
      results,
      'Successfully get newest publication data.',
    );
  }

  async getPublicationById(id: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await Promise.allSettled([
      page.goto(this.getPublicationPath(id)),
      page.setViewport({ width: 1080, height: 1024 }),
    ]);

    const selectorResults = await Promise.allSettled([
      page.waitForSelector('.metadataFieldLabel ::-p-text(Title:)'),
      page.waitForSelector('.metadataFieldLabel ::-p-text(Abstract:)'),
      page.waitForSelector('.metadataFieldLabel ::-p-text(Authors:)'),
      page.waitForSelector('.metadataFieldLabel ::-p-text(Advisors:)', {
        timeout: 1000,
      }),
      page.waitForSelector('.metadataFieldLabel ::-p-text(Issue Date:)'),
    ]);

    const [
      titleLabel,
      abstractLabel,
      authorsLabel,
      advisorsLabel,
      issueDateLabel,
    ] = PromiseHelper.handleAllSettled(selectorResults);

    const getTextValue = (label: Element) =>
      label.nextElementSibling.textContent;

    const getPeopleTextValue = (label: Element) => {
      const links = [...label.nextElementSibling.querySelectorAll('a')];
      return links.map((link) => link.textContent);
    };

    const title = await titleLabel?.evaluate(getTextValue);
    const abstract = await abstractLabel?.evaluate(getTextValue);
    const authors = (await authorsLabel?.evaluate(getPeopleTextValue)) ?? [];
    const advisors = (await advisorsLabel?.evaluate(getPeopleTextValue)) ?? [];
    const issueDate = new Date(
      await issueDateLabel?.evaluate(getTextValue),
    ).toISOString();

    const downloadUrls = await page?.evaluate(() => {
      const links = document.querySelectorAll(
        '.panel.panel-info td[headers="t1"] > a[target="_blank"]',
      );

      return [...links].map((link) => (link as HTMLAnchorElement).href);
    });

    const result: PublicationDto = {
      id,
      title,
      abstract,
      authors,
      advisors,
      downloadUrls,
      issueDate,
    };

    await page.close();

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
    // Serializable error message
    const desyncPageErrorMessage =
      'Your page request is greater than the last page or lower than 1!';

    const url = this.getPublicationsSearchPath(
      currentPageRequest,
      query,
      authors,
      issueDate,
    );

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await Promise.allSettled([
      page.goto(url),
      page.setViewport({ width: 1080, height: 1024 }),
    ]);

    const results: PublicationSearchResultDto[] =
      (
        await page.evaluate(() => {
          const tableBody = document.querySelector('.panel tbody');

          if (!tableBody) {
            return null;
          }

          const trs = [...tableBody.children].slice(
            1,
            tableBody.children.length,
          );
          const data = trs
            .map((tr) => {
              const rowData = [...tr.children];

              if (rowData.length < 4) {
                return null;
              }

              const [issueDateRow, titleRow, authorsRow, advisorsRow] = rowData;

              return {
                url: (titleRow.firstChild as HTMLAnchorElement).href,
                issueDate:
                  issueDateRow.textContent !== '-'
                    ? new Date(issueDateRow.textContent).toISOString()
                    : null,
                title: titleRow.firstChild.textContent,
                authors: authorsRow.firstChild.textContent,
                advisors: advisorsRow.firstChild.textContent,
              };
            })
            .filter(Boolean);

          return data;
        })
      )?.map((publication) => ({
        id: this.parseIdFromURLPath(publication.url),
        title: publication.title,
        authors: publication.authors,
        advisors: publication.advisors,
        issueDate: publication.issueDate,
      })) ?? [];

    // Get search result pages metadata from
    // the pagination element in the repository site.
    try {
      const pagesMetadata = await page.evaluate(
        (currentPageRequest, desyncPageErrorMessage) => {
          const pagination = document.querySelector('.pagination');
          const paginationItems = [...pagination.children];

          const currentPage = parseInt(
            pagination.querySelector('.active > span')?.textContent || '1',
          );

          if (currentPageRequest !== currentPage) {
            throw new Error(desyncPageErrorMessage);
          }

          const lastPage = paginationItems.at(-1).classList.contains('disabled')
            ? currentPage
            : parseInt(paginationItems.at(-2).firstChild.textContent || '1');

          const nextPage =
            lastPage === currentPage ? currentPage : currentPage + 1;

          const previousPage =
            currentPage === 1 ? currentPage : currentPage - 1;

          return {
            currentPage,
            lastPage,
            nextPage,
            previousPage,
          };
        },
        currentPageRequest,
        desyncPageErrorMessage,
      );

      return this.responseService.paginated(
        results,
        pagesMetadata,
        currentPageRequest > pagesMetadata.lastPage
          ? 'Your page request is higher than the last available page!'
          : 'Successfully searched publications.',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === desyncPageErrorMessage) {
          throw new BadRequestException(error.message);
        }
      }
    }
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
