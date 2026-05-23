import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createReadStream } from 'node:fs';
import {
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import * as path from 'node:path';
import { Project } from '../projects/entities/project.entity';
import { CodexCliPathsService } from '../codex-cli/codex-cli-paths.service';
import type { FileContentResponse, FileNode } from '@laws/shared';
import { MAX_TEXT_BYTES, MAX_UPLOAD_BYTES } from './constants/files.constants';
import { buildTree } from './helpers/build-tree';
import { looksLikeText } from './helpers/detect-text';
import { relativeFromRoot, safeResolvePath } from './helpers/safe-resolve-path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    private readonly paths: CodexCliPathsService,
  ) {}

  // ── Read ────────────────────────────────────────────────────────────

  async listTree(userId: string, projectId: string): Promise<{ root: FileNode }> {
    const workspace = await this.assertWorkspace(userId, projectId);
    const root = await buildTree(workspace);
    return { root };
  }

  async readContent(
    userId: string,
    projectId: string,
    relPath: string,
  ): Promise<FileContentResponse> {
    const workspace = await this.assertWorkspace(userId, projectId);
    const abs = safeResolvePath(workspace, relPath);
    const st = await statOrNotFound(abs);
    if (st.isDirectory()) throw new BadRequestException('Đường dẫn là thư mục');
    if (st.size > MAX_TEXT_BYTES) {
      throw new PayloadTooLargeException(
        `Tệp quá lớn để xem dạng văn bản (${st.size} bytes)`,
      );
    }
    const buf = await readFile(abs);
    if (!looksLikeText(buf)) {
      throw new BadRequestException('Tệp không phải dạng văn bản — hãy dùng tải xuống');
    }
    return {
      path: relativeFromRoot(workspace, abs),
      content: buf.toString('utf8'),
      size: st.size,
      modifiedAt: st.mtime.toISOString(),
    };
  }

  async openBlobStream(
    userId: string,
    projectId: string,
    relPath: string,
  ): Promise<{ stream: NodeJS.ReadableStream; size: number; filename: string }> {
    const workspace = await this.assertWorkspace(userId, projectId);
    const abs = safeResolvePath(workspace, relPath);
    const st = await statOrNotFound(abs);
    if (st.isDirectory()) throw new BadRequestException('Không thể tải về thư mục');
    return {
      stream: createReadStream(abs),
      size: st.size,
      filename: path.basename(abs),
    };
  }

  // ── Write ───────────────────────────────────────────────────────────

  async createNode(
    userId: string,
    projectId: string,
    dto: { kind: 'file' | 'folder'; path: string; content?: string },
  ): Promise<FileNode> {
    const workspace = await this.assertWorkspace(userId, projectId);
    const abs = safeResolvePath(workspace, dto.path);
    if (abs === path.resolve(workspace)) {
      throw new BadRequestException('Không thể tạo lại thư mục gốc');
    }
    if (await pathExists(abs)) throw new BadRequestException('Đã tồn tại');

    if (dto.kind === 'folder') {
      await mkdir(abs, { recursive: false });
    } else {
      await mkdir(path.dirname(abs), { recursive: true });
      const content = dto.content ?? '';
      if (Buffer.byteLength(content, 'utf8') > MAX_TEXT_BYTES) {
        throw new PayloadTooLargeException('Nội dung quá lớn');
      }
      await writeFile(abs, content, 'utf8');
    }

    const st = await stat(abs);
    return {
      path: relativeFromRoot(workspace, abs),
      name: path.basename(abs),
      kind: dto.kind,
      size: dto.kind === 'file' ? st.size : null,
      modifiedAt: st.mtime.toISOString(),
    };
  }

  async updateContent(
    userId: string,
    projectId: string,
    relPath: string,
    content: string,
  ): Promise<FileContentResponse> {
    const workspace = await this.assertWorkspace(userId, projectId);
    const abs = safeResolvePath(workspace, relPath);
    const st = await statOrNotFound(abs);
    if (st.isDirectory()) throw new BadRequestException('Đường dẫn là thư mục');
    if (Buffer.byteLength(content, 'utf8') > MAX_TEXT_BYTES) {
      throw new PayloadTooLargeException('Nội dung quá lớn');
    }
    await writeFile(abs, content, 'utf8');
    const after = await stat(abs);
    return {
      path: relativeFromRoot(workspace, abs),
      content,
      size: after.size,
      modifiedAt: after.mtime.toISOString(),
    };
  }

  async moveNode(
    userId: string,
    projectId: string,
    from: string,
    to: string,
  ): Promise<FileNode> {
    const workspace = await this.assertWorkspace(userId, projectId);
    const fromAbs = safeResolvePath(workspace, from);
    const toAbs = safeResolvePath(workspace, to);
    if (fromAbs === path.resolve(workspace)) {
      throw new BadRequestException('Không thể đổi tên thư mục gốc');
    }
    if (!(await pathExists(fromAbs))) throw new NotFoundException('Không tìm thấy nguồn');
    if (await pathExists(toAbs)) throw new BadRequestException('Đích đã tồn tại');
    await mkdir(path.dirname(toAbs), { recursive: true });
    await rename(fromAbs, toAbs);
    const st = await stat(toAbs);
    return {
      path: relativeFromRoot(workspace, toAbs),
      name: path.basename(toAbs),
      kind: st.isDirectory() ? 'folder' : 'file',
      size: st.isDirectory() ? null : st.size,
      modifiedAt: st.mtime.toISOString(),
    };
  }

  async uploadFile(
    userId: string,
    projectId: string,
    targetDir: string,
    filename: string,
    buf: Buffer,
  ): Promise<FileNode> {
    if (buf.length > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(`Tệp tải lên quá lớn (${buf.length} bytes)`);
    }
    const safeName = sanitizeUploadName(filename);
    const combined = targetDir ? `${targetDir.replace(/\/+$/, '')}/${safeName}` : safeName;
    return this.writeUploaded(userId, projectId, combined, buf);
  }

  async removeNode(userId: string, projectId: string, relPath: string): Promise<void> {
    const workspace = await this.assertWorkspace(userId, projectId);
    const abs = safeResolvePath(workspace, relPath);
    if (abs === path.resolve(workspace)) {
      throw new ForbiddenException('Không thể xóa thư mục gốc');
    }
    if (!(await pathExists(abs))) throw new NotFoundException('Không tìm thấy');
    await rm(abs, { recursive: true, force: true });
  }

  // ── Internals ──────────────────────────────────────────────────────

  private async writeUploaded(
    userId: string,
    projectId: string,
    relPath: string,
    buf: Buffer,
  ): Promise<FileNode> {
    const workspace = await this.assertWorkspace(userId, projectId);
    const abs = safeResolvePath(workspace, relPath);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, buf);
    const st = await stat(abs);
    this.logger.log(
      `[files] upload user=${userId} project=${projectId} path=${relPath} size=${buf.length}`,
    );
    return {
      path: relativeFromRoot(workspace, abs),
      name: path.basename(abs),
      kind: 'file',
      size: st.size,
      modifiedAt: st.mtime.toISOString(),
    };
  }

  /** Verify project ownership, ensure workspace dir exists, return abs path. */
  private async assertWorkspace(userId: string, projectId: string): Promise<string> {
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException();
    return this.paths.ensureProjectWorkspace(userId, projectId);
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function statOrNotFound(p: string) {
  try {
    return await stat(p);
  } catch {
    throw new NotFoundException('Không tìm thấy tệp');
  }
}

function sanitizeUploadName(name: string): string {
  return name.replace(/[\\/]/g, '_').replace(/^\.+/, '').slice(0, 200) || 'unnamed';
}
