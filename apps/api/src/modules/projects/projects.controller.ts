import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../shared/decorators/current-user.decorator';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List my projects' })
  list(@CurrentUser() u: CurrentUserPayload) {
    return this.projects.list(u.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@CurrentUser() u: CurrentUserPayload, @Body() dto: CreateProjectDto) {
    return this.projects.create(u.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by id' })
  get(@CurrentUser() u: CurrentUserPayload, @Param('id') id: string) {
    return this.projects.getOwned(u.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(
    @CurrentUser() u: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(u.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a project' })
  async remove(@CurrentUser() u: CurrentUserPayload, @Param('id') id: string): Promise<void> {
    await this.projects.remove(u.id, id);
  }
}
