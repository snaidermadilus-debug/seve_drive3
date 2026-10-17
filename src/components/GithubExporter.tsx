import React, { useState } from 'react';
import {
  Github,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  GitBranch,
  Sparkles,
} from 'lucide-react';

export const GithubExporter: React.FC = () => {
  const [githubUser, setGithubUser] = useState('snaidermadilus');
  const [repoName, setRepoName] = useState('cloud-studio-drive');
  const [branch, setBranch] = useState('main');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const repoUrl = `https://github.com/${githubUser || 'seu-usuario'}/${repoName || 'cloud-studio-drive'}.git`;

  const steps = [
    {
      title: 'Passo 1: Inicializar o repositório Git local',
      desc: 'Cria o controle de versão Git na pasta do projeto.',
      command: 'git init',
    },
    {
      title: 'Passo 2: Adicionar todos os arquivos corrigidos',
      desc: 'Prepara todos os arquivos do backend Python e frontend para o commit.',
      command: 'git add .',
    },
    {
      title: 'Passo 3: Criar o commit inicial com descrição das melhorias',
      desc: 'Registra o estado do projeto no histórico.',
      command:
        'git commit -m "feat: Cloud Studio Pro corrigido com database SQLite, Lightbox, Wiki Assistant e protecao contra Path Traversal"',
    },
    {
      title: 'Passo 4: Renomear o branch padrão para main',
      desc: 'Garante compatibilidade com o padrão atual do GitHub.',
      command: `git branch -M ${branch || 'main'}`,
    },
    {
      title: 'Passo 5: Conectar ao seu repositório remoto no GitHub',
      desc: 'Liga seu repositório local ao repositório criado no GitHub.',
      command: `git remote add origin ${repoUrl}`,
    },
    {
      title: 'Passo 6: Enviar os arquivos para o GitHub (Push)',
      desc: 'Faz o upload definitivo dos arquivos para a nuvem do GitHub.',
      command: `git push -u origin ${branch || 'main'}`,
    },
  ];

  const fullScript = steps.map((s) => s.command).join('\n');

  const copyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyFullScript = () => {
    navigator.clipboard.writeText(fullScript);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950/40 border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-2 rounded-xl bg-white/10 text-white">
            <Github className="w-5 h-5" />
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Guia Rápido: Como Enviar para o seu GitHub
          </h2>
        </div>
        <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
          Siga as instruções abaixo para publicar seu projeto com todos os bugs corrigidos diretamente no
          GitHub. Você pode customizar os campos com seu usuário e nome do repositório para gerar os comandos
          prontos para colar no seu terminal.
        </p>

        {/* Customization Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-neutral-800/80">
          <div>
            <label className="block text-[11px] text-neutral-400 font-medium mb-1">
              Seu Usuário no GitHub
            </label>
            <input
              type="text"
              value={githubUser}
              onChange={(e) => setGithubUser(e.target.value.trim())}
              placeholder="Ex: snaidermadilus"
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 text-xs text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 font-medium mb-1">
              Nome do Repositório
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value.trim())}
              placeholder="Ex: cloud-studio-drive"
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 text-xs text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 font-medium mb-1">
              Branch Principal
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value.trim())}
              placeholder="main"
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 text-xs text-white font-mono outline-none"
            />
          </div>
        </div>
      </div>

      {/* Quick Action: Copy All at once */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white">Executar Tudo de uma Vez no Terminal</span>
        </div>
        <button
          onClick={copyFullScript}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap"
        >
          {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedAll ? 'Comandos Copiados!' : 'Copiar Todos os Comandos'}</span>
        </button>
      </div>

      {/* Step by Step Cards */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h4 className="text-xs font-semibold text-white">{step.title}</h4>
                <p className="text-[11px] text-neutral-400">{step.desc}</p>
              </div>
              <button
                onClick={() => copyCommand(step.command, idx)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium cursor-pointer transition-colors shrink-0"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-2 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-900 font-mono text-xs text-indigo-300 overflow-x-auto whitespace-pre">
              {step.command}
            </div>
          </div>
        ))}
      </div>

      {/* Helpful Tips & Authentication Box */}
      <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-3">
        <h4 className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Dicas Importantes para o Envio</span>
        </h4>
        <ul className="space-y-2 text-neutral-300 pl-1">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Crie o repositório no GitHub antes:</strong> Acesse{' '}
              <a
                href="https://github.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 underline inline-flex items-center gap-1"
              >
                github.com/new <ExternalLink className="w-3 h-3 inline" />
              </a>
              , escolha o nome (ex: <code className="text-neutral-200">{repoName}</code>) e deixe desmarcada a
              opção "Add a README file" para não gerar conflito.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Autenticação do GitHub:</strong> Se o git solicitar senha no terminal ao fazer o{' '}
              <code className="text-neutral-200">git push</code>, utilize um{' '}
              <strong>Personal Access Token (PAT)</strong> gerado em Settings &gt; Developer Settings no GitHub,
              pois senhas comuns de conta não são mais aceitas pelo Git.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Arquivos sensíveis ignorados:</strong> O <code className="text-neutral-200">.gitignore</code>{' '}
              já está configurado para não subir bancos de teste (<code className="text-neutral-200">.db</code>),
              pastas locais com uploads de teste e arquivos temporários.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
