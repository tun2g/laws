import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SkillRun } from '../skills/entities/skill-run.entity';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(SkillRun) private readonly runs: Repository<SkillRun>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
  ) {}

  async stats() {
    const [userCount, projectCount, runCount, runningRunCount] = await Promise.all([
      this.users.count(),
      this.projects.count(),
      this.runs.count(),
      this.runs.count({ where: { status: 'RUNNING' } }),
    ]);
    return { userCount, projectCount, runCount, runningRunCount };
  }

  listUsers() {
    return this.users.find({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        codexConnectedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  listRuns() {
    return this.runs.find({
      relations: { project: true },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
