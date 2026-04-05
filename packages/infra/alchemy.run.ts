import alchemy, { Scope } from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { Worker } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });
config({ path: "../../apps/server/.env" });

const app = await alchemy("hackernews");
const isLocal = Scope.current.local;
const localWebUrl = "http://localhost:5173";
const localServerUrl = "http://localhost:3000";
const deployedWebUrl =
  "https://hackernews-web-iampa.iampandit-in.workers.dev";
const deployedServerUrl =
  "https://hackernews-server-iampa.iampandit-in.workers.dev";
const webUrl = isLocal ? localWebUrl : deployedWebUrl;
const serverUrl = isLocal ? localServerUrl : deployedServerUrl;

const db = await D1Database("database", {
  adopt: true,
  migrationsDir: "../../packages/db/src/migrations",
});

export const web = await Vite("web", {
  adopt: true,
  cwd: "../../apps/web",
  assets: "dist",
  bindings: {
    VITE_SERVER_URL: serverUrl,
  },
});

export const server = await Worker("server", {
  adopt: true,
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    DB: db,
    CORS_ORIGIN: webUrl,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: serverUrl,
  },
  dev: {
    port: 3000,
  },
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
