import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../shared/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { MoveNodeDto } from './dto/move-node.dto';
import { MAX_UPLOAD_BYTES } from './constants/files.constants';

/**
 * RESTful CRUD for files inside a project's per-user workspace.
 *
 * Resource: `/api/projects/:projectId/files`
 *
 *   GET    /                        → tree of the workspace
 *   GET    /content?path=<rel>      → read text content (≤ 5MB)
 *   GET    /blob?path=<rel>         → download binary (Content-Disposition)
 *   POST   /                        → create file or folder
 *   POST   /upload                  → multipart upload (≤ 25MB)
 *   PUT    /content                 → save text content
 *   PATCH  /                        → rename / move
 *   DELETE /?path=<rel>             → delete file or folder
 */
@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'List the workspace as a tree' })
  list(
    @CurrentUser() u: CurrentUserPayload,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
  ) {
    return this.files.listTree(u.id, projectId);
  }

  @Get('content')
  @ApiOperation({ summary: 'Read text content of a file (≤ 5MB)' })
  readContent(
    @CurrentUser() u: CurrentUserPayload,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Query('path') filePath: string,
  ) {
    return this.files.readContent(u.id, projectId, filePath);
  }

  @Get('blob')
  @ApiOperation({ summary: 'Download a file as binary (Content-Disposition: attachment)' })
  async download(
    @CurrentUser() u: CurrentUserPayload,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Query('path') filePath: string,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, size, filename } = await this.files.openBlobStream(u.id, projectId, filePath);
    res.setHeader('Content-Length', String(size));
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    stream.pipe(res);
  }

  @Post()
  @ApiOperation({ summary: 'Create a file or folder' })
  create(
    @CurrentUser() u: CurrentUserPayload,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() dto: CreateNodeDto,
  ) {
    return this.files.createNode(u.id, projectId, dto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single file (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  upload(
    @CurrentUser() u: CurrentUserPayload,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('path') targetDir = '',
  ) {
    return this.files.uploadFile(u.id, projectId, targetDir, file.originalname, file.buffer);
  }

  @Put('content')
  @ApiOperation({ summary: 'Save text content of an existing file' })
  updateContent(
    @CurrentUser() u: CurrentUserPayload,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.files.updateContent(u.id, projectId, dto.path, dto.content);
  }

  @Patch()
  @ApiOperation({ summary: 'Rename or move a file/folder' })
  move(
    @CurrentUser() u: CurrentUserPayload,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() dto: MoveNodeDto,
  ) {
    return this.files.moveNode(u.id, projectId, dto.from, dto.to);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a file or folder (recursive)' })
  async remove(
    @CurrentUser() u: CurrentUserPayload,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Query('path') filePath: string,
  ): Promise<void> {
    await this.files.removeNode(u.id, projectId, filePath);
  }
}
