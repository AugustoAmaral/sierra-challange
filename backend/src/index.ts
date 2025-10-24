import { openapi, fromTypes } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";
import { API_PORT } from "./config/constants";
import { createApp } from "./app";

const app = await createApp();

app.use(cors()).use(openapi({ references: fromTypes() }));

// Start the server
app.listen(API_PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
