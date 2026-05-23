import * as process from 'process';
import * as os from 'node:os';
import * as path from 'node:path';

const defaultCodexRoot = path.join(os.homedir(), '.laws', 'codex');

/**
 * Single source of truth for parsing env vars in the API.
 * Loaded by ConfigModule via `load: [configuration]` and read via
 * `configService.get('db.host')` etc.
 *
 * Keep value access narrow — use ConfigService keys, not raw process.env.
 */
export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT ?? '4000', 10),
  logLvl: process.env.LOG_LVL || 'debug',
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',

  cors: {
    webOrigin: process.env.WEB_ORIGIN || 'http://localhost:4001',
    adminOrigin: process.env.ADMIN_ORIGIN || 'http://localhost:4002',
  },

  db: {
    type: process.env.DATABASE_TYPE || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    name: process.env.DATABASE_NAME || 'laws',
    username: process.env.DATABASE_USERNAME || 'laws',
    password: process.env.DATABASE_PASSWORD || '',
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS ?? '100', 10),
    sslEnabled: process.env.DATABASE_SSL_ENABLED === 'true',
    rejectUnauthorized: process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  codex: {
    binary: process.env.CODEX_BINARY || 'codex',
    homeRoot: process.env.CODEX_HOME_ROOT || path.join(defaultCodexRoot, 'users'),
    workspaceRoot: process.env.CODEX_WORKSPACE_ROOT || path.join(defaultCodexRoot, 'workspaces'),
    maxConcurrent: parseInt(process.env.CODEX_MAX_CONCURRENT ?? '5', 10),
    maxConcurrentPerUser: parseInt(process.env.CODEX_MAX_CONCURRENT_PER_USER ?? '1', 10),
    loginTimeoutMs: parseInt(process.env.CODEX_LOGIN_TIMEOUT_MS ?? '300000', 10),
    runTimeoutMs: parseInt(process.env.CODEX_RUN_TIMEOUT_MS ?? '600000', 10),
    sandbox: process.env.CODEX_SANDBOX || 'workspace-write',
  },
});

export type AppConfig = ReturnType<typeof configuration>;
