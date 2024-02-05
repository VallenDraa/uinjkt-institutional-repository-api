import { IsDateString, IsNumberString, IsString, IsUrl } from 'class-validator';

export class PublicationDto {
  @IsNumberString()
  id: string;

  @IsUrl()
  @IsString({ each: true })
  downloadUrls: string[];

  @IsString()
  title: string;

  @IsString({ each: true })
  authors: string[];

  @IsString({ each: true })
  advisors: string[];

  @IsDateString()
  issueDate: string;

  @IsString()
  abstract: string;
}
