import app from './app';
import { env } from './config';
import { initDb } from './utils/initDb';

async function bootstrap() {
  await initDb();

  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap();
