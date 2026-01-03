import React, { useEffect, useState } from 'react';
import defaultAvatar from './img/logo.png';

function Votacao({ api, onConfirmSelection, jaVotou }) {
  const [candidatos, setCandidatos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!api) return;
    const fetchCandidatos = async () => {
      setCarregando(true);
      setErro('');
      try {
        const response = await api.get('/candidatos');
        setCandidatos(response.data);
      } catch (err) {
        setErro('Erro ao buscar candidatos. Tente novamente em instantes.');
      } finally {
        setCarregando(false);
      }
    };
    fetchCandidatos();
  }, [api]);

  const handleContinuar = () => {
    if (selecionado) {
      onConfirmSelection(selecionado);
    }
  };

  if (carregando) {
    return <p>Carregando candidatos...</p>;
  }

  if (jaVotou) {
    return <p className="message-success">Você já registrou seu voto. Aguarde o resultado oficial.</p>;
  }

  return (
    <div>
      <h2>Escolha seu candidato</h2>
      {erro && <p className="message-error">{erro}</p>}
      <div className="candidatos-grid">
        {candidatos.map(candidato => {
          const ativo = selecionado?.id === candidato.id;
          return (
            <button
              type="button"
              key={candidato.id}
              className={`candidato-card ${ativo ? 'ativo' : ''}`}
              onClick={() => setSelecionado(candidato)}
            >
              <img
                src={candidato.imagem_url || defaultAvatar}
                alt={candidato.nome}
                onError={(event) => {
                  if (event.currentTarget.src !== defaultAvatar) {
                    event.currentTarget.src = defaultAvatar;
                  }
                }}
              />
              <strong>{candidato.nome}</strong>
              <span>{candidato.setor}</span>
              {candidato.descricao && (
                <p className="candidato-descricao">
                  {candidato.descricao.length > 120 ? `${candidato.descricao.slice(0, 117)}...` : candidato.descricao}
                </p>
              )}
              {candidato.campanha_url && (
                <a
                  href={candidato.campanha_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={event => event.stopPropagation()}
                >
                  Ver campanha
                </a>
              )}
            </button>
          );
        })}
      </div>
      <button
        className="primary-btn"
        type="button"
        disabled={!selecionado}
        onClick={handleContinuar}
      >
        Continuar para confirmação
      </button>
    </div>
  );
}

export default Votacao;
