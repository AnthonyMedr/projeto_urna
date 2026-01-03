import React from 'react';

function ConfirmacaoVoto({ candidato, onConfirmar, onVoltar, carregando, erro }) {
  if (!candidato) {
    return null;
  }

  return (
    <div className="confirmacao-voto">
      <h2>Confirme seu voto</h2>
      <p>Revise os dados antes de confirmar. Depois desta etapa não será possível alterar.</p>
      <div className="confirmacao-card">
        <strong>{candidato.nome}</strong>
        <span>{candidato.setor}</span>
        {candidato.descricao && <p>{candidato.descricao}</p>}
      </div>
      <div className="confirmacao-acoes">
        <button type="button" className="secondary-btn" onClick={onVoltar} disabled={carregando}>
          Voltar
        </button>
        <button type="button" className="primary-btn" onClick={onConfirmar} disabled={carregando}>
          {carregando ? 'Registrando...' : 'Confirmar voto'}
        </button>
      </div>
      {erro && <p className="message-error" style={{ marginTop: 16 }}>{erro}</p>}
    </div>
  );
}

export default ConfirmacaoVoto;
