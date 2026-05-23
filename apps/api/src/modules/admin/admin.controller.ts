import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Aggregate stats' })
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  listUsers() {
    return this.admin.listUsers();
  }

  @Get('runs')
  @ApiOperation({ summary: 'List recent skill runs' })
  listRuns() {
    return this.admin.listRuns();
  }
}
