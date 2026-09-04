import app from './app';
import { env } from './config/env';

async function bootstrap() {

  app.listen(env.PORT, () => {
    console.log(`🚀 API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap();
