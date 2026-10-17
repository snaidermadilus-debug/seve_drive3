export type FileType = 'folder' | 'image' | 'code' | 'document' | 'video' | 'audio' | 'other';

export interface DriveItem {
  id: string;
  name: string;
  isFolder: boolean;
  type: FileType;
  path: string; // e.g. "" or "Projetos" or "Fotos/2026"
  size: number; // in bytes
  updatedAt: string;
  dataUrl?: string; // For images or downloaded content
  textContent?: string; // For code/text files
}

export interface UserSession {
  username: string;
  email?: string;
  isAuthenticated: boolean;
}

export interface WikiQueryResponse {
  query: string;
  title: string;
  extract: string;
  source: string;
  thumbnailUrl?: string;
  timestamp: string;
  error?: boolean;
}

export interface FixedFileDetail {
  filename: string;
  path: string;
  category: 'backend' | 'template' | 'style' | 'database' | 'config';
  description: string;
  corrections: string[];
  content: string;
}
