import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseService } from './response/response.service';

@Injectable()
export class AppService {
  constructor(private responseService: ResponseService) {}

  homePage() {
    return this.responseService.normal(
      'Welcome to UINJKT Institutional Repository API!',
      HttpStatus.OK,
      'Successfully accessed home page!',
    );
  }
}
