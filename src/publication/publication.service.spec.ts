import { Test, TestingModule } from '@nestjs/testing';
import { PublicationService } from './publication.service';
import {
  NewestPublicationDto,
  PublicationDto,
  PublicationSearchResultDto,
  // PublicationSearchResultDto,
} from './dto';
import { ResponseService } from 'src/response/response.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { BASE_REPO_URL } from 'src/common/constants';

describe('PublicationService', () => {
  let publicationService: PublicationService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [PublicationService, ResponseService],
    }).compile();

    publicationService = module.get<PublicationService>(PublicationService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => jest.clearAllMocks());

  it('Should be defined', () => {
    expect(publicationService).toBeDefined();
  });

  describe('Get newest publications.', () => {
    it('returns the newest publications', async () => {
      const publications: NewestPublicationDto[] = [
        {
          id: '76780',
          title: 'lorem ipsum 1',
          abstract: 'lorem ipsum abstract 1',
        },
        {
          id: '16782',
          title: 'lorem ipsum 2',
          abstract: 'lorem ipsum abstract 2',
        },
      ];

      const mockHTML = `
        <div class="carousel-inner">
          ${publications.map(
            (p) => `
              <div
                style="padding-bottom: 50px; min-height: 200px;"
                class="item active"
              >
                <div style="padding-left: 80px; padding-right: 80px; display: inline-block;">
                  <div style="font-weight:bold; text-transform:uppercase;">
                    <h4>${p.title}</h4>
                  </div>
                  <p>${p.abstract}</p>
                  <a href="/dspace/handle/123456789/${p.id}" class="btn btn-success">
                    See
                  </a>
                </div>
            </div>
          `,
          )}
        </div>
      `;

      // Mock the return value of the axios get method
      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(of({ data: mockHTML } as AxiosResponse<string>));

      const result = await publicationService.getNewestPublications();

      // Assert
      expect(result.data.length).toEqual(publications.length);
      expect(result.data).toMatchObject(publications);
    });
  });

  describe('Get publication by id.', () => {
    it('Should retrieve a publication based on id.', async () => {
      const publication: PublicationDto = {
        id: '76780',
        abstract: 'Lorem ipsum dolor sit amet',
        advisors: ['john', 'kooyoung'],
        authors: ['silalahi'],
        downloadUrls: [
          '/dspace/bitstream/123456789/62931/1/42.%20HAKI%20Buku%20Metodologi%20Penelitian%20Bahasa.pdf',
        ],
        issueDate: '2022-01',
        title: 'Lorem ipsum',
      };

      const mockHTML = `
        <table class="table itemDisplayTable">
          <tbody>
            <tr>
              <td class="metadataFieldLabel">Title:&nbsp;</td>
              <td class="metadataFieldValue">${publication.title}</td>
            </tr>
            <tr>
              <td class="metadataFieldLabel">Authors:&nbsp;</td>
              <td class="metadataFieldValue">
                ${publication.authors.map((a) => `<a class="author">${a}</a>`)}
              </td>
            </tr>
            <tr>
              <td class="metadataFieldLabel">Advisors:&nbsp;</td>
              <td class="metadataFieldValue">
                ${publication.advisors.map((a) => `<a class="author">${a}</a>`)}
              </td>
            </tr>
            <tr>
              <td class="metadataFieldLabel">Issue Date:&nbsp;</td>
              <td class="metadataFieldValue">${publication.issueDate}</td>
            </tr>
            <tr>
              <td class="metadataFieldLabel">Abstract:&nbsp;</td>
              <td class="metadataFieldValue">${publication.abstract}</td>
            </tr>
          </tbody>
        </table>

        <div class="panel panel-info">
          <table class="table panel-body">
            <tbody>
              <tr>
                <th id="t1" class="standard">File</th>
                <th id="t3" class="standard">Size</th>
                <th id="t4" class="standard">Format</th>
                <th>&nbsp;</th>
              </tr>
              ${publication.downloadUrls.map(
                (url) => `
                  <tr>
                    <td headers="t1" class="standard">
                      <a target="_blank" href="${url}"></a>
                    </td>
                  </tr>`,
              )}
            </tbody>
          </table>
        </div>
      `;

      // Mock the return value of the axios get method
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        of({
          data: mockHTML,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as AxiosResponse<string>),
      );

      const result = await publicationService.getPublicationById(
        publication.id,
      );

      // Assert
      expect(result.data.id).toEqual(publication.id);
      expect(result.data.title).toEqual(publication.title);
      expect(result.data.abstract).toEqual(publication.abstract);
      expect(result.data.issueDate).toEqual(
        new Date(publication.issueDate).toISOString(),
      );
      expect(result.data.authors).toMatchObject(publication.authors);

      // Url checks
      for (const i in publication.downloadUrls) {
        const url = publication.downloadUrls[i];
        const urlWithDomain = `${BASE_REPO_URL}${url}`;

        expect(result.data.downloadUrls[i]).toEqual(urlWithDomain);
      }
    });
  });

  describe('Find publications.', () => {
    it('Should find publications.', async () => {
      const publications: PublicationSearchResultDto[] = [
        {
          id: '123',
          title: 'Lorem dipsum',
          advisors: 'lois lane',
          authors: 'clark kent',
          issueDate: '2022',
        },
        {
          id: '76780',
          advisors: 'john kooyoung',
          authors: 'the clark',
          issueDate: '2019-01',
          title: 'Lorem 1',
        },
        {
          id: '76380',
          advisors: 'john doe',
          authors: 'clark allen',
          issueDate: '2000-01-20',
          title: 'Lorem 2',
        },
      ];

      const paginationsHTML = `
        <ul class="pagination pull-right">
          <li>
            <a
              href="/dspace/simple-search?query=&amp;sort_by=score&amp;order=desc&amp;rpp=10&amp;etal=0&amp;start=770"
              >previous</a
            >
          </li>
          <li class="active">
            <a
              href="/dspace/simple-search?query=&amp;sort_by=score&amp;order=desc&amp;rpp=10&amp;etal=0&amp;start=0"
              >1</a
            >
          </li>
          <li class="disabled"><span>...</span></li>

          <li>
            <a
              href="/dspace/simple-search?query=&amp;sort_by=score&amp;order=desc&amp;rpp=10&amp;etal=0&amp;start=750"
              >76</a
            >
          </li>

          <li>
            <a
              href="/dspace/simple-search?query=&amp;sort_by=score&amp;order=desc&amp;rpp=10&amp;etal=0&amp;start=760"
              >2</a
            >
          </li>
          <li>
            <a
              href="/dspace/simple-search?query=&amp;sort_by=score&amp;order=desc&amp;rpp=10&amp;etal=0&amp;start=790"
              >next</a
            >
          </li>
        </ul>
      `;

      const searchResultsTableHTML = `
        <div class="panel panel-info">
          <div class="panel-heading">Item hits:</div>
          <table
            style="width: 100%; table-layout: fixed;"
            align="center"
            class="table"
            summary="This table browses all dspace content"
          >
            <colgroup>
              <col width="20%" />
              <col width="40%" />
              <col width="20%" />
              <col width="20%" />
            </colgroup>
            <tbody>
              <tr>
                <th id="t1" class="oddRowEvenCol">Issue Date</th>
                <th id="t2" class="oddRowOddCol">Title</th>
                <th id="t3" class="oddRowEvenCol">Author(s)</th>
                <th id="t4" class="oddRowOddCol">Advisor(s)</th>
              </tr>
              ${publications.map((p) => {
                return `
                  <tr>
                    <td headers="t1" class="evenRowEvenCol" nowrap="nowrap" align="right">
                    ${p.issueDate}
                    </td>
                    <td headers="t2" class="evenRowOddCol">
                      <a href="/dspace/handle/123456789/${p.id}">${p.title}</a>
                    </td>
                    <td headers="t3" class="evenRowEvenCol"><em>${p.authors}</em></td>
                    <td headers="t4" class="evenRowOddCol"><em>${p.advisors}</em></td>
                  </tr>`;
              })}
            </tbody>
          </table>
        </div>
      `;

      const mockHTML = `${paginationsHTML} ${searchResultsTableHTML}`;

      // Mock the return value of the axios get method
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        of({
          data: mockHTML,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as AxiosResponse<string>),
      );

      const results = await publicationService.searchPublications(
        1,
        'Lorem',
        'clark',
        '',
      );

      // Assert
      for (const i in results.data) {
        expect(results.data[i].id).toEqual(publications[i].id);
        expect(results.data[i].title).toEqual(publications[i].title);
        expect(results.data[i].advisors).toEqual(publications[i].advisors);
        expect(results.data[i].authors).toEqual(publications[i].authors);
        expect(results.data[i].authors).toEqual(publications[i].authors);
        expect(results.data[i].issueDate).toEqual(
          new Date(publications[i].issueDate).toISOString(),
        );
      }
    });
  });
});
