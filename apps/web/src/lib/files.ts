'use client';

import type {
  FileContentResponse,
  FileNode,
  FileTreeResponse,
} from '@laws/shared';
import { env } from '@/config/env';
import { api, readToken } from './api';

const projectScope = (projectId: string) => `/projects/${projectId}/files`;

export async function listFileTree(projectId: string): Promise<FileTreeResponse> {
  const { data } = await api.get<FileTreeResponse>(projectScope(projectId));
  return data;
}

export async function readFileContent(
  projectId: string,
  path: string,
): Promise<FileContentResponse> {
  const { data } = await api.get<FileContentResponse>(`${projectScope(projectId)}/content`, {
    params: { path },
  });
  return data;
}

export async function saveFileContent(
  projectId: string,
  path: string,
  content: string,
): Promise<FileContentResponse> {
  const { data } = await api.put<FileContentResponse>(`${projectScope(projectId)}/content`, {
    path,
    content,
  });
  return data;
}

export async function createFileNode(
  projectId: string,
  input: { kind: 'file' | 'folder'; path: string; content?: string },
): Promise<FileNode> {
  const { data } = await api.post<FileNode>(projectScope(projectId), input);
  return data;
}

export async function moveFileNode(
  projectId: string,
  from: string,
  to: string,
): Promise<FileNode> {
  const { data } = await api.patch<FileNode>(projectScope(projectId), { from, to });
  return data;
}

export async function deleteFileNode(projectId: string, path: string): Promise<void> {
  await api.delete(projectScope(projectId), { params: { path } });
}

export async function uploadFile(
  projectId: string,
  file: File,
  targetDir = '',
): Promise<FileNode> {
  const form = new FormData();
  form.append('file', file);
  form.append('path', targetDir);
  const { data } = await api.post<FileNode>(`${projectScope(projectId)}/upload`, form);
  return data;
}

/**
 * Trigger a browser download. Uses fetch + Blob so we can attach the JWT —
 * a plain `<a download>` link can't set Authorization.
 */
export async function downloadFile(projectId: string, path: string, filename: string): Promise<void> {
  const token = readToken();
  const res = await fetch(
    `${env.apiBaseUrl}${projectScope(projectId)}/blob?path=${encodeURIComponent(path)}`,
    {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    },
  );
  if (!res.ok) throw new Error(`Tải xuống thất bại (HTTP ${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
