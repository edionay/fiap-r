import { createApp } from '../adapters/inbound/http/app';
import { getPort } from './env';

const port = getPort(process.env.PORT);
const app = createApp();

app.listen(port, () => {
  console.log(`Vehicle Management API listening on port ${String(port)}.`);
});
