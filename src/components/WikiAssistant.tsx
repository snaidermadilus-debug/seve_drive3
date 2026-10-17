import React, { useState } from 'react';
import {
  Brain,
  Search,
  BookOpen,
  Save,
  ExternalLink,
  Sparkles,
  History,
  AlertCircle,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { WikiQueryResponse } from '../types';

interface WikiAssistantProps {
  onSaveToDrive: (title: string, content: string) => void;
}

export const WikiAssistant: React.FC<WikiAssistantProps> = ({ onSaveToDrive }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WikiQueryResponse | null>(null);
  const [history, setHistory] = useState<string[]>([
    'Computação em nuvem',
    'Segurança da informação',
    'Python (linguagem de programação)',
  ]);
  const [savedNotification, setSavedNotification] = useState(false);

  const quickTopics = [
    'Computação em nuvem',
    'Inteligência artificial',
    'Segurança da informação',
    'Git',
    'Python (linguagem de programação)',
    'Banco de dados relacional',
  ];

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    setLoading(true);
    setResult(null);

    // Normalize for assistant identity questions
    const qClean = q
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();
    const identityRegex = /^(quem (e|eh|es) (vc|voce|você)|o que (vc|voce|você) (faz|e|eh)|qual (e|eh) seu nome)/;

    if (identityRegex.test(qClean)) {
      setTimeout(() => {
        setResult({
          query: q,
          title: 'Wiki Assistant Pro',
          extract:
            'Olá! Eu sou o Wiki Assistant Pro integrado ao Cloud Studio. Pesquiso artigos científicos, resumos de tecnologia, definições e conceitos na Wikipédia em português e fontes de consulta rápida para te auxiliar diretamente no gerenciador de arquivos.',
          source: 'Assistente Cloud Studio',
          timestamp: new Date().toLocaleTimeString('pt-BR'),
        });
        setLoading(false);
      }, 350);
      return;
    }

    try {
      // 1. Direct summary from Portuguese Wikipedia REST API
      const res = await fetch(
        `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.type === 'standard' && data.extract) {
          setResult({
            query: q,
            title: data.title || q,
            extract: data.extract,
            source: 'Wikipédia (pt)',
            thumbnailUrl: data.thumbnail?.source,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
          });
          updateHistory(q);
          setLoading(false);
          return;
        }
      }

      // 2. OpenSearch query for suggestions/redirects
      const searchRes = await fetch(
        `https://pt.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
          q
        )}&limit=3&namespace=0&format=json&origin=*`
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const suggestions: string[] = searchData[1] || [];
        const descriptions: string[] = searchData[2] || [];
        const links: string[] = searchData[3] || [];

        if (suggestions.length > 0 && (descriptions[0] || suggestions[0])) {
          // Fetch summary of first suggestion
          const firstTerm = suggestions[0];
          const subRes = await fetch(
            `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTerm)}`
          );
          if (subRes.ok) {
            const subData = await subRes.json();
            if (subData.extract) {
              setResult({
                query: q,
                title: subData.title || firstTerm,
                extract: subData.extract,
                source: `Wikipédia (pt) via busca: "${firstTerm}"`,
                thumbnailUrl: subData.thumbnail?.source,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
              });
              updateHistory(q);
              setLoading(false);
              return;
            }
          }

          // Fallback to opensearch snippet
          setResult({
            query: q,
            title: suggestions[0],
            extract: descriptions[0] || `Artigo encontrado: ${suggestions.join(', ')}`,
            source: 'Wikipédia Busca Rápida',
            timestamp: new Date().toLocaleTimeString('pt-BR'),
          });
          updateHistory(q);
          setLoading(false);
          return;
        }
      }

      // 3. Fallback: DuckDuckGo instant answers
      try {
        const ddgRes = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&kl=br-pt&no_html=1`
        );
        if (ddgRes.ok) {
          const ddgData = await ddgRes.json();
          if (ddgData.AbstractText) {
            setResult({
              query: q,
              title: ddgData.Heading || q,
              extract: ddgData.AbstractText,
              source: 'DuckDuckGo Instant Answer',
              timestamp: new Date().toLocaleTimeString('pt-BR'),
            });
            updateHistory(q);
            setLoading(false);
            return;
          }
        }
      } catch (ddgErr) {
        // Continue to error state
      }

      // No results found
      setResult({
        query: q,
        title: 'Nenhum resultado direto',
        extract: `Não foram encontrados artigos diretos na Wikipédia em português para "${q}". Tente buscar por termos mais genéricos, verificar a grafia ou pesquisar conceitos fundamentais.`,
        source: 'Sistema de Pesquisa',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        error: true,
      });
    } catch (err: any) {
      setResult({
        query: q,
        title: 'Erro de Conexão',
        extract: `Houve uma instabilidade na consulta externa: ${err.message || 'Falha de rede'}. Verifique sua conexão e tente novamente.`,
        source: 'Erro de Conexão',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHistory = (item: string) => {
    setHistory((prev) => [item, ...prev.filter((i) => i.toLowerCase() !== item.toLowerCase())].slice(0, 6));
  };

  const handleSaveResult = () => {
    if (!result) return;
    const filename = `resumo_wiki_${result.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    const markdownContent = `# ${result.title}

> Pesquisa realizada no Wiki Assistant Pro em ${result.timestamp}
> **Fonte:** ${result.source}

## Resumo
${result.extract}

---
*Gerado via Cloud Studio Pro*`;

    onSaveToDrive(filename, markdownContent);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Intro Hero Box */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-neutral-900 to-indigo-950/30 border border-purple-500/20 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Brain className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">Wiki Assistant Pro</h2>
            </div>
            <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
              Consulte definições técnicas, artigos enciclopédicos na Wikipédia em português e fontes de referência
              sem sair do seu ambiente de trabalho. Salve os resumos diretamente no seu Drive com um único clique.
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <div className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Digite um termo, conceito ou pergunta (ex: Computação em nuvem)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950/90 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-xs text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
            />
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{loading ? 'Consultando...' : 'Consultar'}</span>
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-4 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-neutral-400 font-medium mr-1">Sugestões rápidas:</span>
          {quickTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => {
                setQuery(topic);
                handleSearch(topic);
              }}
              className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-[11px] transition-colors cursor-pointer"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Query Result Card */}
      {result && (
        <div
          className={`p-6 rounded-2xl border transition-all animate-in fade-in duration-200 ${
            result.error
              ? 'bg-rose-950/20 border-rose-500/30'
              : 'bg-neutral-900/90 border-neutral-800 shadow-xl'
          }`}
        >
          {/* Header of Result */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800/80 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">{result.title}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="text-purple-400 font-medium">{result.source}</span>
                <span>·</span>
                <span className="tabular-nums">Consultado às {result.timestamp}</span>
              </div>
            </div>

            {!result.error && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  title="Salva este resumo como um arquivo .md no seu Drive"
                >
                  {savedNotification ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Salvo no Drive!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar no Drive</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://pt.wikipedia.org/wiki/${encodeURIComponent(result.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                >
                  <span>Artigo Completo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {result.thumbnailUrl && (
              <div className="shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                <img
                  src={result.thumbnailUrl}
                  alt={result.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                {result.extract}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Search History */}
      {history.length > 0 && (
        <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
          <div className="flex items-center gap-2 mb-3 text-xs text-neutral-400 font-medium">
            <History className="w-3.5 h-3.5 text-neutral-500" />
            <span>Consultas recentes nesta sessão:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(h);
                  handleSearch(h);
                }}
                className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors cursor-pointer"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
