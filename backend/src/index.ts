import app from './app.js';
import { env } from './lib/env.js';

app.listen(env.PORT, () => {
  console.log(`OpenCare backend listening on http://localhost:${env.PORT}`);
});
