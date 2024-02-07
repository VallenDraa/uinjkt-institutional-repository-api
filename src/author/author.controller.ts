import { Controller, UseFilters } from '@nestjs/common';
import { HttpExceptionFilter } from 'src/http-exception/http-exception.filter';

@Controller('author')
@UseFilters(new HttpExceptionFilter())
export class AuthorController {}
