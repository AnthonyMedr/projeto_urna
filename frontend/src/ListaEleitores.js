import React, { useCallback, useEffect, useMemo, useState } from 'react';

function ListaEleitores({ api }) {
  const [eleitores, setEleitores] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [resettingId, setResettingId] = useState(null);

  const carregarEleitores = useCallback(async () => {
    if (!api) return;
    setCarregando(true);
    setErro('');
    try {
      const response = await api.get('/admin/eleitores');
      setEleitores(response.data);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao carregar eleitores');
    } finally {
      setCarregando(false);
    }
  }, [api]);

  useEffect(() => {
    carregarEleitores();
  }, [carregarEleitores]);

  const filtrados = useMemo(() => {
    if (!filtro) return eleitores;
    const termo = filtro.toLowerCase();
    return eleitores.filter(eleitor =>
      eleitor.nome.toLowerCase().includes(termo) ||
      eleitor.matricula.toLowerCase().includes(termo) ||
      (eleitor.setor || '').toLowerCase().includes(termo),
    );
  }, [eleitores, filtro]);

  const handleReset = async (eleitorId) => {
    if (!api) return;
    setResettingId(eleitorId);
    setErro('');
    try {
      await api.post(`/admin/eleitores/${eleitorId}/reset-voto`);
      await carregarEleitores();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao liberar novo voto');
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h4>Eleitores</h4>
        <button type="button" className="secondary-btn" onClick={carregarEleitores} disabled={carregando}>
          Atualizar
        </button>
      </div>
      <input
        type="text"
        placeholder="Filtrar por nome, matrícula ou setor"
        value={filtro}
        onChange={event => setFiltro(event.target.value)}
      />
      {erro && <p className="message-error">{erro}</p>}
      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <div className="tabela-eleitores">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Setor</th>
                <th>Status</th>
                <th>Último voto</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtrados.map(eleitor => (
                <tr key={eleitor.id}>
                  <td>{eleitor.nome}</td>
                  <td>{eleitor.matricula}</td>
                  <td>{eleitor.setor}</td>
                  <td>{eleitor.ja_votou ? 'Votou' : 'Disponível'}</td>
                  <td>{eleitor.votou_em ? new Date(eleitor.votou_em).toLocaleString() : '-'}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={!eleitor.ja_votou || resettingId === eleitor.id}
                      onClick={() => handleReset(eleitor.id)}
                    >
                      {resettingId === eleitor.id ? 'Liberando...' : 'Resetar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && <p>Nenhum eleitor encontrado.</p>}
        </div>
      )}
    </div>
  );
}

export default ListaEleitores;
