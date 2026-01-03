import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from './api';

function Login({ onLoginSuccess }) {
  const [matricula, setMatricula] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth`, {
        matricula: matricula.trim(),
        cpf,
      });
      onLoginSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Acesso negado. Verifique os dados informados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-wrapper">
      <h2 style={{ color: '#009966', textAlign: 'left', marginBottom: 8 }}>Olá, seja bem-vindo à Votação CIPA 2025!</h2>
      <p style={{ color: '#888', textAlign: 'left', marginBottom: 24 }}>Informe seus dados corporativos para acessar a urna.</p>
      <form onSubmit={handleSubmit}>
        <div className="input-with-icon">
          <span className="input-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>
          </span>
          <input
            type="text"
            placeholder="Matrícula"
            value={matricula}
            onChange={e => setMatricula(e.target.value)}
            required
            minLength={3}
            autoComplete="off"
          />
        </div>
        <div className="input-with-icon">
          <span className="input-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/><path d="M12 11v4"/></svg>
          </span>
          <input
            type="password"
            placeholder="CPF (somente números)"
            value={cpf}
            onChange={e => setCpf(e.target.value.replace(/\D/g, ''))}
            required
            minLength={11}
            maxLength={11}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={!matricula || cpf.length !== 11 || loading}
          className="primary-btn"
        >
          {loading ? 'Validando...' : 'ACESSAR'}
        </button>
      </form>
      <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.98em', color: '#888' }}>
        Ficou com dúvidas? <span style={{ color: '#009966', fontWeight: 'bold', cursor: 'pointer' }}>Acesse a FAQ</span>
        <div style={{ fontSize: '0.8em', marginTop: 12, color: '#bbb' }}>Versão 1.1.0</div>
      </div>
      {error && <p className="message-error" style={{ marginTop: 16 }}>{error}</p>}
    </div>
  );
}

export default Login;
