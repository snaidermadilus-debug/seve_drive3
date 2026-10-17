# Cloud Studio Pro - Drive Pessoal & Wiki Assistant

Sistema completo de armazenamento em nuvem pessoal com autenticação segura, isolamento por usuário, gerenciador de arquivos, pré-visualizador de imagens em lightbox, confirmação de exclusão em modal e **Wiki Assistant Pro** integrado.

---

## 🛠️ Problemas e Erros Encontrados no Código Original (e Como Foram Corrigidos)

1. **Arquivo de banco de dados ausente (`database.py`)**:
   - **Problema**: O código executava `from database import inicializar_banco, verificar_usuario, cadastrar_usuario`, mas o arquivo não existia, gerando `ModuleNotFoundError` imediato.
   - **Correção**: Implementado `python_backend/database.py` completo em SQLite com tabelas relacionais, índices e hash seguro de senhas via PBKDF2/Werkzeug.

2. **Erros de JavaScript no `drive.html`**:
   - **Problema**: O HTML continha chamadas para `abrirLightbox(...)` e `mostrarModalExclusao(...)`, mas nenhuma dessas funções ou os modais HTML correspondentes existiam no código, gerando erros no console (`ReferenceError: abrirLightbox is not defined`).
   - **Correção**: Implementados os modais completos no HTML com botões de fechar, download direto, atalho pela tecla ESC, e as funções JavaScript correspondentes.

3

4. **Nomes de Arquivo em Português com Acentos**:
   - **Problema**: O `secure_filename` padrão removia caracteres acentuados (ex: `relatório.pdf` virava `relatrio.pdf` ou gerava strings vazias).
   - **Correção**: Criada a função `sanitizar_nome_arquivo()` que preserva nomes em português com segurança contra caracteres especiais do sistema operacional.

5. **Tratamento de Desambiguação da Wikipédia**:
   - **Problema**: Erro `DisambiguationError` quebrava a busca ou dava erro genérico.
   - **Correção**: Tratamento estruturado com apresentação do resumo do primeiro termo relevante e sugestões adicionais, com fallback automático para o DuckDuckGo.

6. **Limite de Upload e Porta Dinâmica**:
   - **Problema**: Porta fixa em 5001 impedia deploy em servidores de nuvem que usam variável de ambiente `PORT`. Não havia `MAX_CONTENT_LENGTH`.
   - **Correção**: Porta dinâmica via `os.environ.get('PORT', 5001)` e `MAX_CONTENT_LENGTH` de 64 MB com página de erro amigável.

---

## 