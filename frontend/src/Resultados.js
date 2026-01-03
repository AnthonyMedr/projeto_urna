import React, { useCallback, useEffect, useState } from 'react';

function Resultados({ api }) {
  const [resultados, setResultados] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const fetchResultados = useCallback(async () => {
    if (!api) return;
    setCarregando(true);
    setErro('');
    try {
      const response = await api.get('/resultados');
      setResultados(response.data);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao consultar resultados');
    } finally {
      setCarregando(false);
    }
  }, [api]);

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados]);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h4>Parciais da votação</h4>
        <button type="button" className="secondary-btn" onClick={fetchResultados} disabled={carregando}>
          Atualizar
        </button>
      </div>
      {carregando && <p>Carregando...</p>}
      {erro && <p className="message-error">{erro}</p>}
      {!carregando && !erro && (
        <ul className="resultados-lista">
          {resultados.map(item => (
            <li key={item.id}>
              <strong>{item.nome}</strong>
              <span>{item.total_votos} votos</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Resultados;
