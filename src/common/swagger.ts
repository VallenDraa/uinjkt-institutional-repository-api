import { INestApplication } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';

export function swaggerBootstrap(app: INestApplication<any>) {
  const options: SwaggerDocumentOptions = {};

  const config = new DocumentBuilder()
    .setTitle('UINJKT Institutional Repository API')
    .setDescription(
      'Using this API you can get data of publications by students or lecturers.',
    )
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config, options);

  SwaggerModule.setup('', app, document);
}
