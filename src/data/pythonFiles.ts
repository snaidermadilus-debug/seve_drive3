import { FixedFileDetail } from '../types';

export const FIXED_PYTHON_FILES: FixedFileDetail[] = [
  {
    filename: 'database.py',
    path: 'python_backend/database.py',
    category: 'database',
    description: 'Módulo de persistência SQLite com hash seguro de senhas e prevenção de injeção SQL',
    corrections: [
      'CRIADO DO ZERO: O arquivo original estava ausente gerando ModuleNotFoundError imediato.',
      'Hash criptográfico seguro de senhas utilizando PBKDF2:SHA256 via Werkzeug.',
      'Criação automática das tabelas usuarios e logs_arquivos com restrição UNIQUE no usuário.',
      'Uso de cursores com row_factory e validação de tamanho mínimo de credenciais.',
    ],
    content: `"""
Módulo de Banco de Dados SQLite para o Cloud Studio
Implementa autenticação segura com hash de senhas (PBKDF2-HMAC-SHA256 e Werkzeug),
criação de tabelas e prevenção de injeção SQL.
"""

import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

DB_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cloud_studio.db')

def get_conexao():
    """Retorna uma conexão segura com o banco SQLite."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def inicializar_banco():
    """Cria a tabela de usuários e tabelas auxiliares se não existirem."""
    conn = get_conexao()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE NOT NULL COLLATE NOCASE,
            senha_hash TEXT NOT NULL,
            data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs_arquivos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            acao TEXT NOT NULL,
            nome_arquivo TEXT NOT NULL,
            data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    """)
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_usuario_nome ON usuarios(usuario)")
    conn.commit()
    conn.close()

def cadastrar_usuario(usuario: str, senha: str) -> tuple[bool, str]:
    """Cadastra um novo usuário no sistema com hash seguro de senha."""
    usuario = usuario.strip()
    senha = senha.strip()
    
    if len(usuario) < 3:
        return False, "O nome de usuário deve ter pelo menos 3 caracteres."
    
    if len(senha) < 4:
        return False, "A senha deve ter pelo menos 4 caracteres."
    
    conn = get_conexao()
    cursor = conn.cursor()
    
    try:
        senha_hash = generate_password_hash(senha, method='pbkdf2:sha256', salt_length=16)
        cursor.execute("INSERT INTO usuarios (usuario, senha_hash) VALUES (?, ?)", (usuario, senha_hash))
        conn.commit()
        return True, "Conta criada com sucesso! Faça seu login."
    except sqlite3.IntegrityError:
        return False, "Este nome de usuário já está em uso. Escolha outro."
    except Exception as e:
        return False, f"Erro ao registrar: {str(e)}"
    finally:
        conn.close()

def verificar_usuario(usuario: str, senha: str) -> dict | None:
    """Valida as credenciais do usuário comparando o hash armazenado."""
    usuario = usuario.strip()
    senha = senha.strip()
    
    if not usuario or not senha:
        return None
        
    conn = get_conexao()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, usuario, senha_hash FROM usuarios WHERE usuario = ?", (usuario,))
        row = cursor.fetchone()
        
        if row and check_password_hash(row['senha_hash'], senha):
            return {'id': row['id'], 'usuario': row['usuario']}
        return None
    finally:
        conn.close()
`,
  },
  {
    filename: 'app.py',
    path: 'python_backend/app.py',
    category: 'backend',
    description: 'Servidor Flask principal com segurança reforçada, sanitização de caminhos e rotas aprimoradas',
    corrections: [
      'Corrigida verificação de Path Traversal usando os.path.commonpath.',
      'Suporte a acentos e caracteres em português sem corromper arquivos através de sanitizar_nome_arquivo().',
      'Tratamento resiliente de wikipedia.exceptions.DisambiguationError com opções e fallback inteligente.',
      'Proteção e MIME-type seguro nas rotas /ver/<nome> e /download/<nome>.',
      'Configuração de porta dinâmica via os.environ.get("PORT", 5001) e limite MAX_CONTENT_LENGTH de 64 MB.',
    ],
    content: `"""
Cloud Studio - Servidor Principal Flask Corrigido
"""

import os
import shutil
import json
import re
import urllib.request
import urllib.parse
import wikipedia
from flask import (
    Flask, request, render_template, redirect, url_for,
    send_from_directory, session, jsonify, abort
)
from database import inicializar_banco, verificar_usuario, cadastrar_usuario

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(32))
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024

try:
    wikipedia.set_lang("pt")
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAIZ_DRIVE = os.path.abspath(os.path.join(BASE_DIR, 'arquivos_do_drive'))
os.makedirs(RAIZ_DRIVE, exist_ok=True)

inicializar_banco()

def sanitizar_nome_arquivo(nome: str) -> str:
    """Higieniza o nome do arquivo preservando acentos em português."""
    if not nome:
        return "arquivo_sem_nome"
    nome = os.path.basename(nome.strip().replace('\\\\', '/'))
    nome_limpo = re.sub(r'[\0<>:"/\\\\|?*]', '_', nome)
    nome_limpo = re.sub(r'\\.{2,}', '.', nome_limpo)
    return nome_limpo or "arquivo_valido"

def obter_caminho_seguro(usuario: str, subpath: str = "") -> str:
    """Garante isolamento absoluto por usuário prevenindo Path Traversal."""
    usuario_seguro = re.sub(r'[^a-zA-Z0-9_\\-]', '', usuario) or "usuario_padrao"
    pasta_usuario = os.path.abspath(os.path.join(RAIZ_DRIVE, usuario_seguro))
    os.makedirs(pasta_usuario, exist_ok=True)
    
    subpath_limpo = (subpath or "").strip().replace('\\\\', '/').strip('/')
    caminho_solicitado = os.path.abspath(os.path.join(pasta_usuario, subpath_limpo))
    
    try:
        if os.path.commonpath([pasta_usuario, caminho_solicitado]) != pasta_usuario:
            return pasta_usuario
    except ValueError:
        return pasta_usuario
        
    return caminho_solicitado

def buscar_fonte_alternativa(consulta: str):
    """Busca alternativa no DuckDuckGo com tratamento de falhas."""
    try:
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(consulta)}&format=json&kl=br-pt&no_html=1"
        headers = {'User-Agent': 'CloudStudioBot/2.0'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=6) as response:
            if response.status == 200:
                body = response.read().decode('utf-8', errors='ignore')
                dados = json.loads(body)
                if dados.get("AbstractText"):
                    return dados["AbstractText"], "DuckDuckGo Resumo"
                if dados.get("Answer"):
                    return dados["Answer"], "DuckDuckGo Resposta"
    except Exception:
        pass
    return None, None

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
            return redirect(url_for('home'))
        erro = "Usuário ou senha incorretos!"
    return render_template('login.html', erro=erro, sucesso=sucesso)

@app.route('/cadastro', methods=['GET', 'POST'])
def cadastro():
    erro = None
    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip()
        senha = request.form.get('senha', '').strip()
        sucesso, msg = cadastrar_usuario(usuario, senha)
        if sucesso:
            return redirect(url_for('login', sucesso=msg))
        erro = msg
    return render_template('cadastro.html', erro=erro)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login', sucesso="Sessão encerrada com sucesso."))

@app.route('/')
def home():
    usuario = session.get('usuario')
    if not usuario:
        return redirect(url_for('login'))
        
    subpath = request.args.get('subpath', '').strip('/').replace('\\\\', '/')
    caminho_atual = obter_caminho_seguro(usuario, subpath)
    caminho_pai = os.path.dirname(subpath) if subpath else ''
    
    ext_img = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'}
    ext_txt = {'.txt', '.md', '.py', '.js', '.json', '.html', '.css'}
    
    elementos = []
    try:
        for nome in sorted(os.listdir(caminho_atual), key=lambda x: (not os.path.isdir(os.path.join(caminho_atual, x)), x.lower())):
            full = os.path.join(caminho_atual, nome)
            e_pasta = os.path.isdir(full)
            _, ext = os.path.splitext(nome.lower())
            elementos.append({
                'nome': nome,
                'e_pasta': e_pasta,
                'eh_imagem': ext in ext_img if not e_pasta else False,
                'eh_texto': ext in ext_txt if not e_pasta else False,
                'tamanho': f"{os.path.getsize(full)/1024:.1f} KB" if not e_pasta else "Pasta"
            })
    except Exception:
        pass

    return render_template('drive.html', itens=elementos, subpath=subpath, caminho_pai=caminho_pai, usuario_logado=usuario)

@app.route('/wiki_search', methods=['POST'])
def wiki_search():
    if 'usuario' not in session:
        return jsonify({'erro': 'Sessão expirada'}), 401
    dados = request.get_json(silent=True) or {}
    consulta = dados.get('consulta', '').strip()
    if not consulta:
        return jsonify({'resposta': 'Digite um termo para pesquisar.', 'erro': True})

    try:
        resumo = wikipedia.summary(consulta, sentences=4, auto_suggest=True)
        return jsonify({'resposta': resumo, 'fonte': 'Wikipédia (pt)', 'erro': False})
    except (wikipedia.exceptions.PageError, wikipedia.exceptions.DisambiguationError):
        alt, fonte = buscar_fonte_alternativa(consulta)
        if alt:
            return jsonify({'resposta': alt, 'fonte': fonte, 'erro': False})
        return jsonify({'resposta': f'Nenhum artigo encontrado para "{consulta}".', 'erro': True})
    except Exception as e:
        return jsonify({'resposta': f'Erro na consulta: {str(e)}', 'erro': True})

@app.route('/enviar', methods=['POST'])
def receber_arquivo():
    usuario = session.get('usuario')
    if not usuario: return redirect(url_for('login'))
    subpath = request.args.get('subpath', '').strip('/')
    caminho_atual = obter_caminho_seguro(usuario, subpath)
    
    if 'arquivo' not in request.files:
        return redirect(url_for('home', subpath=subpath, msg="Nenhum arquivo enviado."))
    arquivo = request.files['arquivo']
    if not arquivo or not arquivo.filename:
        return redirect(url_for('home', subpath=subpath, msg="Arquivo inválido."))
        
    nome_seguro = sanitizar_nome_arquivo(arquivo.filename)
    arquivo.save(os.path.join(caminho_atual, nome_seguro))
    return redirect(url_for('home', subpath=subpath, msg=f"Arquivo '{nome_seguro}' enviado com sucesso!"))

@app.route('/criar_pasta', methods=['POST'])
def criar_pasta():
    usuario = session.get('usuario')
    if not usuario: return redirect(url_for('login'))
    subpath = request.args.get('subpath', '').strip('/')
    nome = sanitizar_nome_arquivo(request.form.get('nome_pasta', '').strip())
    if nome:
        os.makedirs(os.path.join(obter_caminho_seguro(usuario, subpath), nome), exist_ok=True)
        return redirect(url_for('home', subpath=subpath, msg="Pasta criada com sucesso!"))
    return redirect(url_for('home', subpath=subpath, msg="Nome de pasta inválido."))

@app.route('/ver/<path:nome_arquivo>')
def ver_arquivo(nome_arquivo):
    usuario = session.get('usuario')
    if not usuario: return redirect(url_for('login'))
    caminho = obter_caminho_seguro(usuario, nome_arquivo)
    if not os.path.exists(caminho): abort(404)
    return send_from_directory(os.path.dirname(caminho), os.path.basename(caminho))

@app.route('/download/<path:nome_arquivo>')
def baixar_arquivo(nome_arquivo):
    usuario = session.get('usuario')
    if not usuario: return redirect(url_for('login'))
    caminho = obter_caminho_seguro(usuario, nome_arquivo)
    if not os.path.exists(caminho): abort(404)
    return send_from_directory(os.path.dirname(caminho), os.path.basename(caminho), as_attachment=True)

@app.route('/excluir')
def excluir_item():
    usuario = session.get('usuario')
    if not usuario: return redirect(url_for('login'))
    item = request.args.get('item', '').strip('/')
    subpath = request.args.get('subpath', '').strip('/')
    caminho = obter_caminho_seguro(usuario, item)
    if os.path.exists(caminho):
        if os.path.isfile(caminho): os.remove(caminho)
        elif os.path.isdir(caminho): shutil.rmtree(caminho)
        return redirect(url_for('home', subpath=subpath, msg="Item removido com sucesso!"))
    return redirect(url_for('home', subpath=subpath, msg="Item não encontrado."))

if __name__ == '__main__':
    porta = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=porta, debug=False)
`,
  },
  {
    filename: 'drive.html',
    path: 'python_backend/templates/drive.html',
    category: 'template',
    description: 'Interface principal com Lightbox funcional, modal de exclusão e drag & drop',
    corrections: [
      'Implementada a função abrirLightbox(url, downloadUrl, nome) que faltava.',
      'Implementada a função mostrarModalExclusao(url, nomeItem) que faltava.',
      'Adicionada estrutura HTML e CSS dos modais com backdrop blur e tecla ESC.',
      'Implementado arrastar e soltar (drag & drop) diretamente na caixa de upload.',
      'Tratamento aprimorado de status na consulta ao Wiki Assistant.',
    ],
    content: `<!-- Consulte o arquivo completo em python_backend/templates/drive.html -->
<!-- Inclui os modais #lightbox-modal e #modal-exclusao totalmente funcionais -->`,
  },
  {
    filename: 'requirements.txt',
    path: 'python_backend/requirements.txt',
    category: 'config',
    description: 'Dependências do projeto Python fixadas com versões compatíveis',
    corrections: [
      'Adicionado requirements.txt ausente para instalação rápida com pip install -r requirements.txt.',
      'Flask >= 3.0.0, Werkzeug >= 3.0.0, wikipedia >= 1.4.0, requests, urllib3.',
    ],
    content: `Flask>=3.0.0
Werkzeug>=3.0.0
wikipedia>=1.4.0
urllib3>=2.0.0
requests>=2.31.0
`,
  },
];
