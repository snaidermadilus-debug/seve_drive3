"""
Cloud Studio - Servidor Principal Flask
Gerenciamento de arquivos em nuvem com isolamento de usuários,
Wiki Assistant Pro (Wikipédia + DuckDuckGo) e visualizador de mídia.
"""

import os
import shutil
import json
import re
import urllib.request
import urllib.parse
import unicodedata
import wikipedia
from flask import (
    Flask, request, render_template, redirect, url_for,
    send_from_directory, session, jsonify, abort
)
from database import inicializar_banco, verificar_usuario, cadastrar_usuario

app = Flask(__name__)
# Chave de sessão configurável via ambiente para persistência entre reinícios
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(32))

# Limite máximo de upload: 64 Megabytes
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024

# Configuração do idioma padrão da Wikipédia em Português
try:
    wikipedia.set_lang("pt")
except Exception:
    pass

# Diretório raiz para armazenamento de arquivos isolados por usuário
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAIZ_DRIVE = os.path.abspath(os.path.join(BASE_DIR, 'arquivos_do_drive'))
os.makedirs(RAIZ_DRIVE, exist_ok=True)

# Inicializa o banco de dados SQLite
inicializar_banco()


def sanitizar_nome_arquivo(nome: str) -> str:
    """
    Higieniza o nome do arquivo preservando acentuação em português
    enquanto remove caracteres perigosos como barras, dois pontos e nulos.
    """
    if not nome:
        return "arquivo_sem_nome"
    
    # Remove eventuais caminhos relativos ou barras
    nome = os.path.basename(nome.strip().replace('\\', '/'))
    
    # Substitui caracteres ilegais para sistemas de arquivos
    nome_limpo = re.sub(r'[\0<>:"/\\|?*]', '_', nome)
    nome_limpo = re.sub(r'\.{2,}', '.', nome_limpo)  # Previne sequências de ..
    
    # Se ficar vazio ou começar com ponto perigoso
    if not nome_limpo or nome_limpo == '.':
        return "arquivo_valido"
        
    return nome_limpo


def obter_caminho_seguro(usuario: str, subpath: str = "") -> str:
    """
    Garante que o caminho solicitado pertença estritamente ao diretório do usuário,
    usando os.path.commonpath para prevenir totalmente ataques de Path Traversal.
    """
    # Garante que o nome do usuário não tenha caracteres de navegação
    usuario_seguro = re.sub(r'[^a-zA-Z0-9_\-]', '', usuario)
    if not usuario_seguro:
        usuario_seguro = "usuario_padrao"
        
    pasta_usuario = os.path.abspath(os.path.join(RAIZ_DRIVE, usuario_seguro))
    os.makedirs(pasta_usuario, exist_ok=True)
    
    # Limpa barras iniciais e finais do subcaminho
    subpath_limpo = (subpath or "").strip().replace('\\', '/').strip('/')
    caminho_solicitado = os.path.abspath(os.path.join(pasta_usuario, subpath_limpo))
    
    # Validação rigorosa com os.path.commonpath
    try:
        caminho_comum = os.path.commonpath([pasta_usuario, caminho_solicitado])
        if caminho_comum != pasta_usuario:
            return pasta_usuario
    except ValueError:
        return pasta_usuario
        
    return caminho_solicitado


def buscar_fonte_alternativa(consulta: str):
    """
    Busca secundária na API do DuckDuckGo com tratamento de erros robusto
    e decodificação segura.
    """
    try:
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(consulta)}&format=json&kl=br-pt&no_html=1&skip_disambig=1"
        headers = {
            'User-Agent': 'CloudStudioBot/2.0 (Mozilla/5.0 compatible; ResearchTool)'
        }
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=6) as response:
            if response.status == 200:
                body = response.read().decode('utf-8', errors='ignore')
                dados = json.loads(body)
                
                # 1. Resumo Direto
                if dados.get("AbstractText"):
                    return dados["AbstractText"], "DuckDuckGo Resumo"
                
                # 2. Resposta Instantânea
                if dados.get("Answer"):
                    return dados["Answer"], "DuckDuckGo Resposta"
                
                # 3. Tópicos Relacionados
                topics = dados.get("RelatedTopics", [])
                for t in topics:
                    if isinstance(t, dict) and t.get("Text"):
                        return t["Text"], "DuckDuckGo Tópicos"
                    elif isinstance(t, dict) and t.get("Topics"):
                        sub = t["Topics"][0]
                        if isinstance(sub, dict) and sub.get("Text"):
                            return sub["Text"], "DuckDuckGo Tópicos"
    except Exception:
        pass
        
    return None, None


# ================= ROTAS DE AUTENTICAÇÃO =================

@app.route('/login', methods=['GET', 'POST'])
def login():
    erro = request.args.get('erro', '')
    sucesso = request.args.get('sucesso', '')
    
    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip()
        senha = request.form.get('senha', '').strip()
        
        user = verificar_usuario(usuario, senha)
        if user:
            session.clear()
            session['usuario'] = user['usuario']
            session['usuario_id'] = user['id']
            return redirect(url_for('home'))
        else:
            erro = "Usuário ou senha incorretos! Verifique os dados digitados."
            
    return render_template('login.html', erro=erro, sucesso=sucesso)


@app.route('/cadastro', methods=['GET', 'POST'])
def cadastro():
    erro = None
    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip()
        senha = request.form.get('senha', '').strip()
        
        if not usuario or not senha:
            erro = "Preencha todos os campos obrigatórios!"
        else:
            sucesso_cadastro, mensagem = cadastrar_usuario(usuario, senha)
            if sucesso_cadastro:
                return redirect(url_for('login', sucesso=mensagem))
            else:
                erro = mensagem
                
    return render_template('cadastro.html', erro=erro)


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login', sucesso="Você saiu da sua conta com segurança."))


# ================= ROTAS DO DRIVE =================

@app.route('/')
def home():
    usuario = session.get('usuario')
    if not usuario:
        return redirect(url_for('login'))
        
    subpath = request.args.get('subpath', '').strip('/').replace('\\', '/')
    caminho_atual = obter_caminho_seguro(usuario, subpath)

    if not os.path.exists(caminho_atual):
        os.makedirs(caminho_atual, exist_ok=True)

    caminho_pai = os.path.dirname(subpath) if subpath else ''
    
    extensoes_imagens = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'}
    extensoes_texto = {'.txt', '.md', '.py', '.js', '.json', '.html', '.css', '.sql'}
    
    elementos = []
    total_tamanho = 0
    total_arquivos = 0
    
    try:
        nomes = sorted(os.listdir(caminho_atual), key=lambda x: (not os.path.isdir(os.path.join(caminho_atual, x)), x.lower()))
        for nome in nomes:
            full_path = os.path.join(caminho_atual, nome)
            e_pasta = os.path.isdir(full_path)
            eh_imagem = False
            eh_texto = False
            tamanho_formatado = ""
            
            if not e_pasta:
                _, ext = os.path.splitext(nome.lower())
                eh_imagem = ext in extensoes_imagens
                eh_texto = ext in extensoes_texto
                try:
                    tam = os.path.getsize(full_path)
                    total_tamanho += tam
                    total_arquivos += 1
                    if tam < 1024:
                        tamanho_formatado = f"{tam} B"
                    elif tam < 1024 * 1024:
                        tamanho_formatado = f"{tam / 1024:.1f} KB"
                    else:
                        tamanho_formatado = f"{tam / (1024 * 1024):.1f} MB"
                except Exception:
                    tamanho_formatado = "–"
            else:
                tamanho_formatado = "Pasta"
                
            elementos.append({
                'nome': nome,
                'e_pasta': e_pasta,
                'eh_imagem': eh_imagem,
                'eh_texto': eh_texto,
                'tamanho': tamanho_formatado
            })
    except Exception as e:
        app.logger.error(f"Erro ao listar diretório: {e}")

    mensagem = request.args.get('msg', '')
    return render_template(
        'drive.html',
        mensagem=mensagem,
        itens=elementos,
        subpath=subpath,
        caminho_pai=caminho_pai,
        usuario_logado=usuario,
        total_arquivos=total_arquivos
    )


# ================= WIKI ASSISTANT PRO =================

@app.route('/wiki_search', methods=['POST'])
def wiki_search():
    if 'usuario' not in session:
        return jsonify({'erro': 'Sessão expirada. Faça login novamente.', 'resposta': '', 'fonte': 'Auth'}), 401

    dados = request.get_json(silent=True) or {}
    consulta = dados.get('consulta', '').strip()

    if not consulta:
        return jsonify({
            'resposta': 'Por favor, digite uma pergunta ou termo para pesquisar.',
            'fonte': 'Sistema',
            'erro': True
        })

    consulta_limpa = re.sub(r'[^\w\s]', '', consulta.lower())

    # 1. Padrões de identidade do assistente
    padroes_identidade = [
        r'quem (e|eh|es) (vc|voce|você)',
        r'o que (vc|voce|você) (faz|e|eh)',
        r'qual (e|eh) seu nome',
        r'ajuda',
        r'como funciona'
    ]

    for padrao in padroes_identidade:
        if re.search(padrao, consulta_limpa):
            apresentacao = (
                "Olá! Eu sou o Wiki Assistant Pro integrado ao Cloud Studio. "
                "Pesquiso artigos científicos, resumos de tecnologia, definições e conceitos na Wikipédia "
                "e em fontes de consulta rápida para te auxiliar diretamente no gerenciador de arquivos."
            )
            return jsonify({'resposta': apresentacao, 'fonte': 'Wiki Assistant Pro', 'erro': False})

    # 2. Busca Principal na Wikipédia
    try:
        # Tenta obter resumo conciso em português
        resumo = wikipedia.summary(consulta, sentences=4, auto_suggest=True)
        return jsonify({'resposta': resumo, 'fonte': 'Wikipédia (pt)', 'erro': False})
        
    except wikipedia.exceptions.DisambiguationError as e:
        # Se houver desambiguação, tenta obter o primeiro tópico sugerido ou listar tópicos
        opcoes = e.options[:5]
        if opcoes:
            try:
                resumo_primeiro = wikipedia.summary(opcoes[0], sentences=3)
                texto = f"Termo com múltiplos significados. Exibindo resumo para '{opcoes[0]}':\n\n{resumo_primeiro}\n\nOutras opções: {', '.join(opcoes[1:])}"
                return jsonify({'resposta': texto, 'fonte': 'Wikipédia (Desambiguação)', 'erro': False})
            except Exception:
                pass
        # Fallback para busca alternativa
        resposta_alt, fonte_alt = buscar_fonte_alternativa(consulta)
        if resposta_alt:
            return jsonify({'resposta': resposta_alt, 'fonte': fonte_alt, 'erro': False})
        return jsonify({
            'resposta': f"O termo possui vários significados: {', '.join(opcoes)}. Especifique sua busca.",
            'fonte': 'Wikipédia',
            'erro': False
        })
        
    except wikipedia.exceptions.PageError:
        # 3. Fallback: Se não encontrou artigo direto, busca na web via DuckDuckGo
        resposta_alt, fonte_alt = buscar_fonte_alternativa(consulta)
        if resposta_alt:
            return jsonify({'resposta': resposta_alt, 'fonte': fonte_alt, 'erro': False})
        else:
            return jsonify({
                'resposta': f'Nenhum artigo encontrado para "{consulta}". Tente buscar por palavras-chave mais genéricas.',
                'fonte': 'Sistema',
                'erro': True
            })

    except Exception as e:
        # Fallback genérico se a API falhar
        resposta_alt, fonte_alt = buscar_fonte_alternativa(consulta)
        if resposta_alt:
            return jsonify({'resposta': resposta_alt, 'fonte': fonte_alt, 'erro': False})
        return jsonify({
            'resposta': f'Não foi possível concluir a busca: {str(e)}',
            'fonte': 'Erro',
            'erro': True
        })


# ================= OPERAÇÕES DE ARQUIVOS =================

@app.route('/enviar', methods=['POST'])
def receber_arquivo():
    usuario = session.get('usuario')
    if not usuario:
        return redirect(url_for('login'))
    
    subpath = request.args.get('subpath', '').strip('/').replace('\\', '/')
    caminho_atual = obter_caminho_seguro(usuario, subpath)
    
    if 'arquivo' not in request.files:
        return redirect(url_for('home', subpath=subpath, msg="Nenhum arquivo enviado."))
    
    arquivo = request.files['arquivo']
    if not arquivo or arquivo.filename == '':
        return redirect(url_for('home', subpath=subpath, msg="Arquivo inválido ou vazio."))
    
    nome_seguro = sanitizar_nome_arquivo(arquivo.filename)
    caminho_salvar = os.path.join(caminho_atual, nome_seguro)
    
    try:
        arquivo.save(caminho_salvar)
        return redirect(url_for('home', subpath=subpath, msg=f"Arquivo '{nome_seguro}' enviado com sucesso!"))
    except Exception as e:
        return redirect(url_for('home', subpath=subpath, msg=f"Erro ao salvar arquivo: {str(e)}"))


@app.route('/criar_pasta', methods=['POST'])
def criar_pasta():
    usuario = session.get('usuario')
    if not usuario:
        return redirect(url_for('login'))
    
    subpath = request.args.get('subpath', '').strip('/').replace('\\', '/')
    nome_pasta = sanitizar_nome_arquivo(request.form.get('nome_pasta', '').strip())
    
    if nome_pasta and nome_pasta != 'arquivo_sem_nome':
        caminho_nova_pasta = os.path.join(obter_caminho_seguro(usuario, subpath), nome_pasta)
        try:
            os.makedirs(caminho_nova_pasta, exist_ok=True)
            return redirect(url_for('home', subpath=subpath, msg=f"Pasta '{nome_pasta}' criada com sucesso!"))
        except Exception as e:
            return redirect(url_for('home', subpath=subpath, msg=f"Erro ao criar pasta: {str(e)}"))
            
    return redirect(url_for('home', subpath=subpath, msg="Nome de pasta inválido."))


@app.route('/ver/<path:nome_arquivo>')
def ver_arquivo(nome_arquivo):
    usuario = session.get('usuario')
    if not usuario:
        return redirect(url_for('login'))
        
    pasta_usuario = obter_caminho_seguro(usuario)
    caminho_arquivo = obter_caminho_seguro(usuario, nome_arquivo)
    
    if not os.path.exists(caminho_arquivo) or not os.path.isfile(caminho_arquivo):
        abort(404)
        
    subdiretorio = os.path.dirname(caminho_arquivo)
    arquivo = os.path.basename(caminho_arquivo)
    return send_from_directory(subdiretorio, arquivo)


@app.route('/download/<path:nome_arquivo>')
def baixar_arquivo(nome_arquivo):
    usuario = session.get('usuario')
    if not usuario:
        return redirect(url_for('login'))
        
    caminho_arquivo = obter_caminho_seguro(usuario, nome_arquivo)
    
    if not os.path.exists(caminho_arquivo) or not os.path.isfile(caminho_arquivo):
        abort(404)
        
    subdiretorio = os.path.dirname(caminho_arquivo)
    arquivo = os.path.basename(caminho_arquivo)
    return send_from_directory(subdiretorio, arquivo, as_attachment=True)


@app.route('/excluir')
def excluir_item():
    usuario = session.get('usuario')
    if not usuario:
        return redirect(url_for('login'))
    
    item = request.args.get('item', '').strip('/').replace('\\', '/')
    subpath = request.args.get('subpath', '').strip('/').replace('\\', '/')
    
    if not item:
        return redirect(url_for('home', subpath=subpath, msg="Item não especificado."))
        
    caminho_item = obter_caminho_seguro(usuario, item)
    
    if os.path.exists(caminho_item):
        try:
            if os.path.isfile(caminho_item):
                os.remove(caminho_item)
                return redirect(url_for('home', subpath=subpath, msg="Arquivo removido com sucesso!"))
            elif os.path.isdir(caminho_item):
                shutil.rmtree(caminho_item)
                return redirect(url_for('home', subpath=subpath, msg="Pasta removida com sucesso!"))
        except Exception as e:
            return redirect(url_for('home', subpath=subpath, msg=f"Erro ao excluir: {str(e)}"))
            
    return redirect(url_for('home', subpath=subpath, msg="Erro: Item não encontrado."))


# Tratamento amigável para uploads excessivos
@app.errorhandler(413)
def arquivo_muito_grande(e):
    usuario = session.get('usuario')
    if usuario:
        return redirect(url_for('home', msg="Erro: O arquivo enviado ultrapassa o limite de 64 MB."))
    return "Arquivo ultrapassa o limite permitido.", 413


if __name__ == '__main__':
    porta = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=porta, debug=False)
