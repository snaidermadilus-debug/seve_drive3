import React, { useState, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  Upload,
  Search,
  FileCode,
  FileText,
  File,
  Image as ImageIcon,
  Download,
  Trash2,
  ChevronRight,
  Home,
  HardDrive,
  Grid,
  List,
  Eye,
  Plus,
} from 'lucide-react';
import { DriveItem, FileType } from '../types';

interface DriveViewProps {
  items: DriveItem[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
  onUploadFile: (file: File) => void;
  onCreateFolder: (name: string) => void;
  onDeleteItem: (item: DriveItem) => void;
  onOpenLightbox: (item: DriveItem) => void;
  onOpenFileViewer: (item: DriveItem) => void;
}

export const DriveView: React.FC<DriveViewProps> = ({
  items,
  currentPath,
  setCurrentPath,
  onUploadFile,
  onCreateFolder,
  onDeleteItem,
  onOpenLightbox,
  onOpenFileViewer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'folder' | 'image' | 'document' | 'code'>('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute items in the current directory
  const currentItems = items.filter((item) => {
    // Exact path match
    const inCurrentFolder = item.path === currentPath;
    if (!inCurrentFolder) return false;

    // Filter by type
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'folder' && !item.isFolder) return false;
      if (selectedFilter === 'image' && item.type !== 'image') return false;
      if (selectedFilter === 'document' && item.type !== 'document') return false;
      if (selectedFilter === 'code' && item.type !== 'code') return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  // Calculate storage metrics
  const totalBytes = items.reduce((acc, curr) => acc + curr.size, 0);
  const totalFiles = items.filter((i) => !i.isFolder).length;
  const storageMaxBytes = 500 * 1024 * 1024; // 500 MB
  const storagePercentage = Math.min(100, Math.round((totalBytes / storageMaxBytes) * 100));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Breadcrumb path parts
  const pathParts = currentPath ? currentPath.split('/') : [];

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentPath('');
    } else {
      const target = pathParts.slice(0, index + 1).join('/');
      setCurrentPath(target);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => onUploadFile(file));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => onUploadFile(file));
    }
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsFolderModalOpen(false);
    }
  };

  const handleDownload = (item: DriveItem) => {
    if (item.dataUrl) {
      const a = document.createElement('a');
      a.href = item.dataUrl;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (item.textContent) {
      const blob = new Blob([item.textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Workspace Bar: Actions, Search, Storage */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        {/* Left: Action Buttons */}
        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar Arquivo</span>
          </button>

          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Nova Pasta</span>
          </button>
        </div>

        {/* Center: Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome do arquivo ou pasta..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Right: Storage Stats & View Switcher */}
        <div className="flex items-center gap-4 text-xs text-neutral-400 shrink-0">
          <div className="hidden lg:flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
            <span>
              <strong className="text-neutral-200 tabular-nums">{formatSize(totalBytes)}</strong> usados
              ({totalFiles} arquivos)
            </span>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                viewMode === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Visualização em Grade"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                viewMode === 'list' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto py-1">
          <button
            onClick={() => navigateToBreadcrumb(-1)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
              !currentPath ? 'text-white font-semibold bg-neutral-900' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-indigo-400" />
            <span>Raiz</span>
          </button>

          {pathParts.map((part, index) => {
            const isLast = index === pathParts.length - 1;
            return (
              <React.Fragment key={index}>
                <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
                    isLast
                      ? 'text-white font-semibold bg-neutral-900 border border-neutral-800'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900/80 rounded-lg border border-neutral-800 self-start sm:self-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'folder', label: 'Pastas' },
            { id: 'image', label: 'Imagens' },
            { id: 'document', label: 'Docs' },
            { id: 'code', label: 'Código' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.005]'
            : 'border-neutral-800/80 hover:border-neutral-700 bg-neutral-950/40'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-1.5">
          <Upload className={`w-6 h-6 ${isDragOver ? 'text-indigo-400 animate-bounce' : 'text-neutral-500'}`} />
          <p className="text-xs text-neutral-300 font-medium">
            Arraste e solte arquivos aqui para enviar diretamente para esta pasta
          </p>
          <span className="text-[11px] text-neutral-500">
            Suporta imagens (PNG, JPG, WEBP), documentos, código (.py, .ts, .json, .md) e outros formatos
          </span>
        </div>
      </div>

      {/* Files Display: Empty State or Grid/List */}
      {currentItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-neutral-900/40 border border-neutral-800/60">
          <div className="w-12 h-12 rounded-xl bg-neutral-800/60 flex items-center justify-center text-neutral-500 mb-3">
            <Folder className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-200 mb-1">
            {searchQuery ? 'Nenhum resultado encontrado' : 'Pasta vazia'}
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mb-4">
            {searchQuery
              ? `Não foram encontrados arquivos com o termo "${searchQuery}".`
              : 'Você pode enviar novos arquivos ou criar pastas utilizando os botões de ação acima.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
            >
              Enviar Arquivo Agora
            </button>
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium cursor-pointer"
            >
              Criar Nova Pasta
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800/80 hover:border-neutral-700 transition-all duration-150 shadow-xs"
            >
              {/* Card Click Action */}
              <div
                className="flex items-start gap-3 cursor-pointer overflow-hidden"
                onClick={() => {
                  if (item.isFolder) {
                    const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                    setCurrentPath(newPath);
                  } else if (item.type === 'image') {
                    onOpenLightbox(item);
                  } else {
                    onOpenFileViewer(item);
                  }
                }}
              >
                {/* Thumbnail Icon */}
                <div className="shrink-0">
                  {item.isFolder ? (
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Folder className="w-5 h-5 fill-amber-500/20" />
                    </div>
                  ) : item.type === 'image' && item.dataUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950">
                      <img
                        src={item.dataUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                  ) : item.type === 'code' ? (
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <FileCode className="w-5 h-5" />
                    </div>
                  ) : item.type === 'document' ? (
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center justify-center">
                      <File className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 overflow-hidden min-w-0">
                  <h4
                    className={`text-xs font-medium truncate ${
                      item.isFolder ? 'text-amber-200 font-semibold' : 'text-neutral-200'
                    }`}
                    title={item.name}
                  >
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1">
                    <span>{item.isFolder ? 'Pasta' : formatSize(item.size)}</span>
                    <span>·</span>
                    <span className="tabular-nums">{item.updatedAt}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-800/60">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                  {item.isFolder ? 'DIR' : item.type}
                </div>
                <div className="flex items-center gap-1">
                  {!item.isFolder && (
                    <>
                      <button
                        onClick={() =>
                          item.type === 'image' ? onOpenLightbox(item) : onOpenFileViewer(item)
                        }
                        className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                        title="Visualizar"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-1 rounded text-neutral-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                        title="Baixar Arquivo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onDeleteItem(item)}
                    className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Excluir Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden divide-y divide-neutral-800">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/60 transition-colors"
            >
              <div
                className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer"
                onClick={() => {
                  if (item.isFolder) {
                    const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                    setCurrentPath(newPath);
                  } else if (item.type === 'image') {
                    onOpenLightbox(item);
                  } else {
                    onOpenFileViewer(item);
                  }
                }}
              >
                {item.isFolder ? (
                  <Folder className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                ) : item.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                ) : item.type === 'code' ? (
                  <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span
                  className={`text-xs truncate ${
                    item.isFolder ? 'text-amber-200 font-medium' : 'text-neutral-200'
                  }`}
                >
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-6 text-xs text-neutral-500 shrink-0">
                <span className="tabular-nums">{item.isFolder ? '—' : formatSize(item.size)}</span>
                <span className="tabular-nums hidden sm:inline">{item.updatedAt}</span>
                <div className="flex items-center gap-1">
                  {!item.isFolder && (
                    <button
                      onClick={() => handleDownload(item)}
                      className="p-1 rounded text-neutral-400 hover:text-sky-400 cursor-pointer"
                      title="Baixar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteItem(item)}
                    className="p-1 rounded text-neutral-400 hover:text-rose-400 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline Folder Modal */}
      {isFolderModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsFolderModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <FolderPlus className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">Criar Nova Pasta</h3>
            </div>
            <form onSubmit={handleCreateFolderSubmit}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Documentos Fiscais, Backup 2026..."
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 text-xs text-white placeholder-neutral-500 outline-none mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
