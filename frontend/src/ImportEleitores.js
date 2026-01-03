import React, { useState } from 'react';

function ImportEleitores({ api }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !api) return;
    setLoading(true);
    setErro('');
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/admin/eleitores/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResultado(response.data);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao importar eleitores');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h4>Importar eleitores</h4>
      </div>
      <p className="import-info">
        Aceita CSV ou XLSX. Cabecalhos: matricula, cpf, nome, setor, is_admin (opcional).
      </p>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          required
        />
        <button type="submit" className="primary-btn" disabled={!file || loading}>
          {loading ? 'Importando...' : 'Importar planilha'}
        </button>
      </form>
      {erro && <p className="message-error">{erro}</p>}
      {resultado && (
        <div className="import-summary">
          <p>Total: <strong>{resultado.total}</strong></p>
          <p>Inseridos: <strong>{resultado.inserted}</strong></p>
          <p>Atualizados: <strong>{resultado.updated}</strong></p>
          <p>Invalidos: <strong>{resultado.invalid}</strong></p>
          {resultado.errors?.length > 0 && (
            <ul className="import-errors">
              {resultado.errors.map((item, index) => (
                <li key={`${item.row}-${index}`}>
                  Linha {item.row || '?'}: {item.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ImportEleitores;
