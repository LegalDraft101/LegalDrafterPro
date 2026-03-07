import { initPassport } from './services';
import app from './app';
import { env } from './config';

initPassport();

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
