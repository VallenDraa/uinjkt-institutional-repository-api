import { HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {
  normal<T>(data: T, status: HttpStatus, message = '') {
    return {
      data,
      status,
      message,
    };
  }

  paginated<T>(
    data: T,
    status: HttpStatus,
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
      status,
      meta,
      message,
    };
  }
}
