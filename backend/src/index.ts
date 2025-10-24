import { openapi, fromTypes } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";
import { API_PORT } from "./config/constants";
import { createApp } from "./app";

const app = (await createApp())
  .use(cors())
  .use(openapi({ references: fromTypes() }))
  .listen(API_PORT);

app;

export type App = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
