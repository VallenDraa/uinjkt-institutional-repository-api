import { IsDateString, IsNumberString, IsString } from 'class-validator';

export class PublicationSearchResultDto {
  @IsNumberString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  authors: string;

  @IsString()
  advisors: string;

  @IsDateString()
  issueDate: string;
}
