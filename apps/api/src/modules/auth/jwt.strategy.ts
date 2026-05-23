import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy, type JwtFromRequestFunction } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { User } from '../users/entities/user.entity';
import type { CurrentUserPayload } from '../../shared/decorators/current-user.decorator';

interface JwtClaims {
  sub: string;
}

/**
 * Pull JWT from `Authorization: Bearer ...` OR from `?access_token=...` in the
 * URL. The query-string form is needed because browser EventSource (SSE)
 * cannot set custom headers.
 */
const fromHeaderOrQuery: JwtFromRequestFunction = (req: Request) => {
  const header = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (header) return header;
  const q = req.query?.access_token;
  if (typeof q === 'string' && q.length > 0) return q;
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: fromHeaderOrQuery,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? '',
    });
  }

  async validate(payload: JwtClaims): Promise<CurrentUserPayload> {
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
