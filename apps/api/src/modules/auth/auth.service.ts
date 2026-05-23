import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    codexConnected: boolean;
    codexConnectedAt: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email is already in use');
    }
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: 'USER',
    });
    await this.users.save(user);
    return this.sign(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.sign(user);
  }

  async me(userId: string): Promise<AuthResult['user']> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }

  private sign(user: User): AuthResult {
    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.expiresIn') as never,
      },
    );
    return { accessToken, user: this.toPublic(user) };
  }

  private toPublic(user: User): AuthResult['user'] {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      codexConnected: Boolean(user.codexConnectedAt),
      codexConnectedAt: user.codexConnectedAt ? user.codexConnectedAt.toISOString() : null,
    };
  }
}
