import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: CurrentUserPayload }>();
    if (!req.user) {
      throw new Error('CurrentUser decorator used on an unauthenticated route');
    }
    return req.user;
  },
);
