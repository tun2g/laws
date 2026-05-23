import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../shared/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  async me(@CurrentUser() u: CurrentUserPayload) {
    const user = await this.users.findById(u.id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      codexConnected: Boolean(user.codexConnectedAt),
      codexConnectedAt: user.codexConnectedAt
        ? user.codexConnectedAt.toISOString()
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  updateProfile(@CurrentUser() u: CurrentUserPayload, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(u.id, dto);
  }

  @Get('me/codex-usage')
  @ApiOperation({ summary: 'Get my Codex usage summary tracked by this app' })
  usage(@CurrentUser() u: CurrentUserPayload) {
    return this.users.getCodexUsage(u.id);
  }
}
