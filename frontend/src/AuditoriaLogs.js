import React, { useCallback, useEffect, useState } from 'react';

function AuditoriaLogs({ api }) {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!api) return;
    setCarregando(true);
    setErro('');
    try {
      const response = await api.get('/admin/auditoria');
      setRegistros(response.data);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao carregar auditoria');
    } finally {
      setCarregando(false);
    }
  }, [api]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h4>Logs de auditoria</h4>
        <button type="button" className="secondary-btn" onClick={carregar} disabled={carregando}>
          Atualizar
        </button>
      </div>
      {erro && <p className="message-error">{erro}</p>}
      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <ul className="auditoria-lista">
          {registros.map(log => {
            let detalhes = log.detalhes;
            if (typeof detalhes === 'string') {
              try {
                detalhes = JSON.parse(detalhes);
              } catch {
                // keep string as is when parse fails
              }
            }
            return (
              <li key={log.id}>
                <div>
                  <strong>{log.tipo}</strong>
                  <span>{new Date(log.criado_em).toLocaleString()}</span>
                </div>
                <div className="auditoria-resumo">
                  <small>Resultado: {log.resultado}</small>
                  {log.matricula_hash && <small> - Hash: {log.matricula_hash.slice(0, 10)}...</small>}
                </div>
                {detalhes && (
                  <pre>{JSON.stringify(detalhes, null, 2)}</pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default AuditoriaLogs;
