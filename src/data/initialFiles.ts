import { DriveItem } from '../types';

export const INITIAL_FILES: DriveItem[] = [
  {
    id: 'f-1',
    name: 'Documentos',
    isFolder: true,
    type: 'folder',
    path: '',
    size: 0,
    updatedAt: 'Hoje, 09:15',
  },
  {
    id: 'f-2',
    name: 'Fotos e Mídia',
    isFolder: true,
    type: 'folder',
    path: '',
    size: 0,
    updatedAt: 'Ontem, 16:40',
  },
  {
    id: 'f-3',
    name: 'Projetos de Software',
    isFolder: true,
    type: 'folder',
    path: '',
    size: 0,
    updatedAt: '16/10/2026',
  },
  {
    id: 'doc-1',
    name: 'notas_reuniao_arquitetura.md',
    isFolder: false,
    type: 'document',
    path: '',
    size: 2450,
    updatedAt: 'Hoje, 08:30',
    textContent: `# Reunião de Arquitetura - Cloud Studio

## Objetivos
1. Segurança robusta com prevenção de Path Traversal
2. Suporte pleno a caracteres acentuados em nomes de arquivo
3. Integração com Wiki Assistant Pro via Wikipedia PT
4. Visualizador de mídia em Lightbox e modal de confirmação para exclusões

## Decisões Técnicas
- Armazenamento particionado por pasta de usuário
- SQLite com senhas protegidas via Werkzeug PBKDF2
- Tratamento resiliente de falhas de conexão na API DuckDuckGo`,
  },
  {
    id: 'img-1',
    name: 'wallpaper_futurista.png',
    isFolder: false,
    type: 'image',
    path: '',
    size: 184520,
    updatedAt: 'Ontem, 14:22',
    dataUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'code-1',
    name: 'servidor_config.json',
    isFolder: false,
    type: 'code',
    path: '',
    size: 512,
    updatedAt: 'Hoje, 07:10',
    textContent: JSON.stringify(
      {
        app_name: 'Cloud Studio Pro',
        version: '2.0.0',
        environment: 'production',
        max_upload_size_mb: 64,
        wiki_assistant: {
          primary_lang: 'pt',
          fallback_enabled: true,
          timeout_seconds: 6,
        },
      },
      null,
      2
    ),
  },
  {
    id: 'img-2',
    name: 'paisagem_montanhas.jpg',
    isFolder: false,
    type: 'image',
    path: 'Fotos e Mídia',
    size: 420800,
    updatedAt: 'Ontem, 18:00',
    dataUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'doc-2',
    name: 'relatório_mensal_outubro.txt',
    isFolder: false,
    type: 'document',
    path: 'Documentos',
    size: 1530,
    updatedAt: '15/10/2026',
    textContent: `RELATÓRIO MENSAL - OUTUBRO DE 2026
----------------------------------------
- Taxa de disponibilidade do armazenamento: 99.98%
- Total de arquivos salvos: 1.482 itens
- Consultas no Wiki Assistant: 340 resolvidas
- Status de segurança: Nenhuma violação registrada`,
  },
];
