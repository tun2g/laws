import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectRepository(Project) private readonly projects: Repository<Project>) {}

  list(ownerId: string): Promise<Project[]> {
    return this.projects.find({
      where: { ownerId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getOwned(ownerId: string, id: string): Promise<Project> {
    const project = await this.projects.findOne({
      where: { id },
      relations: { skillRuns: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  async create(ownerId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projects.create({
      ownerId,
      name: dto.name,
      clientName: dto.clientName ?? null,
      description: dto.description ?? null,
    });
    return this.projects.save(project);
  }

  async update(ownerId: string, id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.getOwned(ownerId, id);
    Object.assign(project, dto);
    return this.projects.save(project);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const project = await this.getOwned(ownerId, id);
    await this.projects.remove(project);
  }
}
