import { createServer } from "http";
import { env } from "./config/env";
import { createApp } from "./app";
import { initSocket } from "./realtime/socket";

const app = createApp();
const server = createServer(app);

initSocket(server);

server.listen(env.port, "0.0.0.0", () => {
  console.log(`BiteHub backend running on 0.0.0.0:${env.port}`);
});
