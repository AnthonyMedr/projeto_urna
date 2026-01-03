import React, { useState } from 'react';

function CadastroCandidato({ api }) {
  const [form, setForm] = useState({
    nome: '',
    setor: '',
    descricao: '',
    imagemUrl: '',
    campanhaUrl: '',
  });
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMensagem('');
    setErro('');
    setLoading(true);
    try {
      await api.post('/candidatos', form);
      setMensagem('Candidato cadastrado com sucesso.');
      setForm({ nome: '', setor: '', descricao: '', imagemUrl: '', campanhaUrl: '' });
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao cadastrar candidato.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card">
      <h4>Novo candidato</h4>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          name="nome"
          placeholder="Nome completo"
          value={form.nome}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="setor"
          placeholder="Setor"
          value={form.setor}
          onChange={handleChange}
          required
        />
        <textarea
          name="descricao"
          placeholder="Mini descrição/campanha"
          value={form.descricao}
          onChange={handleChange}
          rows={3}
        />
        <input
          type="url"
          name="imagemUrl"
          placeholder="URL da foto"
          value={form.imagemUrl}
          onChange={handleChange}
        />
        <input
          type="url"
          name="campanhaUrl"
          placeholder="URL da campanha"
          value={form.campanhaUrl}
          onChange={handleChange}
        />
        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Cadastrar'}
        </button>
      </form>
      {mensagem && <p className="message-success">{mensagem}</p>}
      {erro && <p className="message-error">{erro}</p>}
    </div>
  );
}

export default CadastroCandidato;
