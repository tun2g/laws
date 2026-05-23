import { randomUUID } from 'node:crypto';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModuleAsyncParams } from 'nestjs-pino';

import {
  DebugHeaderKey,
  HeaderKey,
  REDACTED_FIELD_MESSAGE,
  RedactedHeaderKey,
} from '../constants/http-request';
import { cleanObject } from '../utils/object.util';

type PinoLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export const loggerModuleParams: LoggerModuleAsyncParams = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const logLvl = configService.get<PinoLevel>('logLvl') ?? 'info';

    return {
      pinoHttp: {
        level: logLvl,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: "yyyy-mm-dd'T'HH:mm:ss.l'Z'",
            singleLine: true,
            errorLikeObjectKeys: ['err', 'error'],
          },
        },
        formatters: {
          level: (label: string) => ({ level: label }),
        },
        genReqId: (req) =>
          (req.headers[HeaderKey.X_REQUEST_ID] as string) || randomUUID(),
        customProps: (req) => ({
          requestId: (req.headers[HeaderKey.X_REQUEST_ID] as string) || req.id,
        }),
        serializers: {
          req(req) {
            const redactedHeaders: Record<string, unknown> = {};
            for (const header of Object.keys(req.headers ?? {})) {
              const lower = header.toLowerCase();
              if (lower in RedactedHeaderKey) {
                redactedHeaders[header] = REDACTED_FIELD_MESSAGE;
              } else if (lower in DebugHeaderKey) {
                redactedHeaders[header] = req.headers[header];
              }
            }

            const redactedReq: Record<string, unknown> = {
              id: req.id,
              method: req.method,
              url: req.url,
              query: req.query,
              params: req.params,
              headers: redactedHeaders,
            };

            if (logLvl === 'debug' || logLvl === 'trace') {
              redactedReq.body = req.raw?.body;
            }

            return cleanObject(redactedReq);
          },
        },
        customReceivedMessage: (req) =>
          `Request received: ${req.headers[HeaderKey.X_REQUEST_ID] ?? req.id}`,
        customSuccessMessage: (_req, res) =>
          `Request completed: ${res.req.headers[HeaderKey.X_REQUEST_ID] ?? res.req.id}`,
        customErrorMessage: (_req, res) =>
          `Request errored: ${res.req.headers[HeaderKey.X_REQUEST_ID] ?? res.req.id}`,
      },
    };
  },
};
