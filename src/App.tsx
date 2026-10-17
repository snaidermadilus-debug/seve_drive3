/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DriveView } from './components/DriveView';
import { WikiAssistant } from './components/WikiAssistant';
import { PythonInspector } from './components/PythonInspector';
import { GithubExporter } from './components/GithubExporter';
import { LightboxModal, DeleteModal, FileViewerModal } from './components/Modals';
import { AuthModal } from './components/AuthModal';
import { DriveItem, UserSession, FileType } from './types';
import { INITIAL_FILES } from './data/initialFiles';
import { CheckCircle2, Info } from 'lucide-react';

export default function App() {
  // Session
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('cloud_studio_user');
    return saved
      ? JSON.parse(saved)
      : { username: 'snaidermadilus', isAuthenticated: true };
  });

  // Current navigation tab
  const [currentTab, setCurrentTab] = useState<'drive' | 'wiki' | 'code' | 'github'>('drive');
  const [currentPath, setCurrentPath] = useState<string>('');

  // Drive items stored per user
  const [items, setItems] = useState<DriveItem[]>(() => {
    const key = `cloud_studio_items_${session.username}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_FILES;
      }
    }
    return INITIAL_FILES;
  });

  // Active modals
  const [lightboxItem, setLightboxItem] = useState<DriveItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<DriveItem | null>(null);
  const [fileViewerItem, setFileViewerItem] = useState<DriveItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist items on change
  useEffect(() => {
    const key = `cloud_studio_items_${session.username}`;
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, session.username]);

  // Persist session
  useEffect(() => {
    localStorage.setItem('cloud_studio_user', JSON.stringify(session));
  }, [session]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Upload handler
  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    let type: FileType = 'other';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
      type = 'image';
    } else if (['txt', 'md', 'doc', 'docx', 'pdf', 'csv', 'xlsx'].includes(ext)) {
      type = 'document';
    } else if (['py', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'sql', 'sh', 'env'].includes(ext)) {
      type = 'code';
    }

    if (type === 'image') {
      reader.onload = (e) => {
        const newItem: DriveItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          isFolder: false,
          type: 'image',
          path: currentPath,
          size: file.size,
          updatedAt: 'Agora mesmo',
          dataUrl: e.target?.result as string,
        };
        setItems((prev) => [newItem, ...prev]);
        showToast(`Imagem "${file.name}" enviada com sucesso!`);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const newItem: DriveItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          isFolder: false,
          type,
          path: currentPath,
          size: file.size,
          updatedAt: 'Agora mesmo',
          textContent: typeof e.target?.result === 'string' ? e.target.result : undefined,
        };
        setItems((prev) => [newItem, ...prev]);
        showToast(`Arquivo "${file.name}" adicionado com sucesso!`);
      };
      reader.readAsText(file);
    }
  };

  // Folder creation handler
  const handleCreateFolder = (name: string) => {
    const newFolder: DriveItem = {
      id: `folder-${Date.now()}`,
      name,
      isFolder: true,
      type: 'folder',
      path: currentPath,
      size: 0,
      updatedAt: 'Agora mesmo',
    };
    setItems((prev) => [newFolder, ...prev]);
    showToast(`Pasta "${name}" criada com sucesso!`);
  };

  // Delete item handler
  const handleDeleteConfirm = () => {
    if (!deleteItem) return;

    if (deleteItem.isFolder) {
      // Remove folder and all children recursively
      const fullFolderPath = currentPath ? `${currentPath}/${deleteItem.name}` : deleteItem.name;
      setItems((prev) =>
        prev.filter((i) => {
          if (i.id === deleteItem.id) return false;
          if (i.path === fullFolderPath || i.path.startsWith(`${fullFolderPath}/`)) return false;
          return true;
        })
      );
      showToast(`Pasta "${deleteItem.name}" e seus itens foram removidos.`);
    } else {
      setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      showToast(`Arquivo "${deleteItem.name}" removido com sucesso.`);
    }

    setDeleteItem(null);
  };

  // Save from Wiki Assistant directly to Drive
  const handleSaveWikiToDrive = (title: string, markdownContent: string) => {
    const newItem: DriveItem = {
      id: `wiki-${Date.now()}`,
      name: title,
      isFolder: false,
      type: 'document',
      path: currentPath,
      size: new Blob([markdownContent]).size,
      updatedAt: 'Agora mesmo',
      textContent: markdownContent,
    };
    setItems((prev) => [newItem, ...prev]);
    showToast(`Resumo salvo em seu Drive como "${title}"!`);
  };

  // Switch user handler
  const handleLogin = (username: string) => {
    setSession({ username, isAuthenticated: true });
    setCurrentPath('');
    // Load that user's items
    const key = `cloud_studio_items_${username}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        setItems(INITIAL_FILES);
      }
    } else {
      setItems(INITIAL_FILES);
    }
    showToast(`Conectado como ${username}! Espaço privativo carregado.`);
  };

  const handleLogout = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        session={session}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'drive' && (
          <DriveView
            items={items}
            currentPath={currentPath}
            setCurrentPath={setCurrentPath}
            onUploadFile={handleUploadFile}
            onCreateFolder={handleCreateFolder}
            onDeleteItem={(item) => setDeleteItem(item)}
            onOpenLightbox={(item) => setLightboxItem(item)}
            onOpenFileViewer={(item) => setFileViewerItem(item)}
          />
        )}

        {currentTab === 'wiki' && (
          <WikiAssistant onSaveToDrive={handleSaveWikiToDrive} />
        )}

        {currentTab === 'code' && <PythonInspector />}

        {currentTab === 'github' && <GithubExporter />}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 py-6 px-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">Cloud Studio Pro</span>
            <span>·</span>
            <span>Segurança, Armazenamento &amp; Inteligência Wiki</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <button
              onClick={() => setCurrentTab('github')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Comandos do GitHub
            </button>
            <span>·</span>
            <button
              onClick={() => setCurrentTab('code')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Ver Código Flask
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-medium shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <LightboxModal
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />

      <DeleteModal
        item={deleteItem}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteItem(null)}
      />

      <FileViewerModal
        item={fileViewerItem}
        onClose={() => setFileViewerItem(null)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        currentUsername={session.username}
        onLogin={handleLogin}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
