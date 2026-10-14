export interface FolderCategory {
  name: string;
  file_count: number;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  stored_filename: string;
  total_pages: number;
  file_size: number;
}

export interface SplitRule {
  id: string;
  folder: string;
  pages: string;
  parsedPages: number[];
  error?: string;
}

export interface SplitResultItem {
  folder: string;
  filename: string;
  path: string;
  pages: number[];
  page_count: number;
  file_size: number;
}

export interface SplitResponse {
  success: boolean;
  message: string;
  results: SplitResultItem[];
}
