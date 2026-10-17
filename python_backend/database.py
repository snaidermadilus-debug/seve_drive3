"""
Módulo de Banco de Dados SQLite para o Cloud Studio
Implementa autenticação segura com hash de senhas (PBKDF2-HMAC-SHA256 e Werkzeug),
criação de tabelas e prevenção de injeção SQL.
"""

import sqlite3
import os
import hashlib
import binascii
from werkzeug.security import generate_password_hash, check_password_hash

DB_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cloud_studio.db')

def get_conexao():
    """Retorna uma conexão segura com o banco SQLite."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def inicializar_banco():
    """
    Cria a tabela de usuários e tabelas auxiliares se não existirem.
    Garante integridade referencial e índices para desempenho.
    """
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
    """
    Cadastra um novo usuário no sistema com hash seguro de senha.
    Retorna uma tupla (sucesso: bool, mensagem: str).
    """
    usuario = usuario.strip()
    senha = senha.strip()
    
    if len(usuario) < 3:
        return False, "O nome de usuário deve ter pelo menos 3 caracteres."
    
    if len(senha) < 4:
        return False, "A senha deve ter pelo menos 4 caracteres."
    
    conn = get_conexao()
    cursor = conn.cursor()
    
    try:
        # Gera hash seguro usando scrypt/pbkdf2 via Werkzeug
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
    """
    Valida as credenciais do usuário comparando o hash armazenado.
    Retorna o dicionário com os dados do usuário ou None se inválido.
    """
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
