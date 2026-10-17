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

3. **Vulnerabilidade de Path Traversal**:
   - **Problema**: `caminho_solicitado.startswith(pasta_usuario)` era vulnerável quando nomes de usuários compartilhavam prefixos similares.
   - **Correção**: Validação estrita com `os.path.commonpath([pasta_usuario, caminho_solicitado]) == pasta_usuario`.

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

## 🚀 Como Enviar Esse Projeto para o seu GitHub

Siga este passo a passo no seu terminal local ou na sua máquina:

### Passo 1: Inicialize o Git na pasta do projeto
```bash
git init
```

### Passo 2: Configure seu usuário e email no Git (caso ainda não tenha feito)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu_email@exemplo.com"
```

### Passo 3: Adicione todos os arquivos corrigidos
```bash
git add .
```

### Passo 4: Faça o primeiro commit
```bash
git commit -m "feat: Cloud Studio corrigido com database SQLite, Lightbox, Wiki Assistant e seguranca"
```

### Passo 5: Defina o branch principal como main
```bash
git branch -M main
```

### Passo 6: Conecte ao seu repositório no GitHub
> Crie um repositório vazio no GitHub (ex: `cloud-studio`) e copie a URL HTTPS ou SSH:
```bash
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
```

### Passo 7: Envie os arquivos para o GitHub!
```bash
git push -u origin main
```

---

## 🐍 Como Executar a Versão Python (Flask)

1. Entre na pasta `python_backend`:
   ```bash
   cd python_backend
   ```
2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicie o servidor:
   ```bash
   python app.py
   ```
4. Acesse em seu navegador:
   `http://localhost:5001`

---

## 💻 Versão Web Interativa (React + TypeScript)

Este repositório também inclui uma versão web moderna construída em React, Tailwind CSS e TypeScript, pronta para visualização no AI Studio e navegadores modernos com:
- Armazenamento em nuvem interativo
- Lightbox de fotos em alta resolução
- Wiki Assistant Pro com consulta em tempo real à Wikipédia
- Guia interativo de exportação para GitHub
