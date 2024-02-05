import { IsNumberString, IsString } from 'class-validator';

export class NewestPublicationDto {
  @IsNumberString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  abstract: string;
}
