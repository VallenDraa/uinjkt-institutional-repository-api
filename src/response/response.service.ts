import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {
  normal<T>(data: T, message = '') {
    return {
      data,
      message,
    };
  }

  paginated<T>(
    data: T,
    meta: {
      currentPage: number;
      previousPage: number;
      nextPage: number;
      lastPage: number;
    },
    message = '',
  ) {
    return {
      data,
      meta,
      message,
    };
  }
}
