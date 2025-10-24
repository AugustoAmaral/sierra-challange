import { treaty } from "@elysiajs/eden";
import type { App } from "../../../backend/src";

const app = treaty<App>("http://localhost:3000");

export default app;
