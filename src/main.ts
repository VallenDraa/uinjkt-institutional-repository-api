import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { swaggerBootstrap } from './common/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  swaggerBootstrap(app);

  await app.listen(3001);
}
bootstrap();
