import { createApp } from "./app";
import { env } from "./config/env";
import { registerJobs } from "./jobs";

const app = createApp();

registerJobs();

app.listen(env.PORT, () => {
  console.log(`Brightloop API listening on http://localhost:${env.PORT}`);
});
