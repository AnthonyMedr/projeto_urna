import React, { useEffect, useMemo, useRef, useState } from 'react';
import Login from './Login';
import Votacao from './Votacao';
import ConfirmacaoVoto from './ConfirmacaoVoto';
import Resultados from './Resultados';
import CadastroCandidato from './CadastroCandidato';
import ListaEleitores from './ListaEleitores';
import AuditoriaLogs from './AuditoriaLogs';
import ImportEleitores from './ImportEleitores';
import { createApiClient } from './api';
import './App.css';

const steps = [
  { id: 'LOGIN', label: 'Autenticacao' },
  { id: 'ESCOLHA', label: 'Escolha' },
  { id: 'CONFIRMACAO', label: 'Confirmacao' },
  { id: 'SUCESSO', label: 'Voto computado' },
];

const normalizeEleitor = (data) => {
  if (!data) return null;
  const isAdmin = Boolean(data.is_admin ?? data.isAdmin);
  const jaVotou = Boolean(data.ja_votou ?? data.jaVotou);
  const votouEm = data.votou_em ?? data.votouEm ?? null;
  return {
    ...data,
    is_admin: isAdmin,
    isAdmin,
    ja_votou: jaVotou,
    jaVotou,
    votou_em: votouEm,
    votouEm,
  };
};

const getStepForEleitor = (info) => {
  if (!info) return 'LOGIN';
  if (info.is_admin || info.isAdmin) return 'ADMIN';
  if (info.ja_votou || info.jaVotou) return 'SUCESSO';
  return 'ESCOLHA';
};

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('urnaToken'));
  const [eleitor, setEleitor] = useState(null);
  const [currentStep, setCurrentStep] = useState('LOGIN');
  const [selecionado, setSelecionado] = useState(null);
  const [voteReceipt, setVoteReceipt] = useState(null);
  const [erroVoto, setErroVoto] = useState('');
  const [registrandoVoto, setRegistrandoVoto] = useState(false);
  const [carregandoSessao, setCarregandoSessao] = useState(Boolean(token));
  const api = useMemo(() => (token ? createApiClient(token) : null), [token]);
  const isAdmin = Boolean(eleitor?.is_admin || eleitor?.isAdmin);
  const jaVotou = Boolean(eleitor?.ja_votou || eleitor?.jaVotou);
  const showBranding = currentStep === 'LOGIN';
  const autoPrintRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setEleitor(null);
      setCurrentStep('LOGIN');
      setVoteReceipt(null);
      setSelecionado(null);
      setCarregandoSessao(false);
      autoPrintRef.current = false;
      return;
    }

    const fetchSession = async () => {
      setCarregandoSessao(true);
      try {
        const response = await api.get('/session');
        const normalized = normalizeEleitor(response.data);
        setEleitor(normalized);
        setCurrentStep(getStepForEleitor(normalized));
      } catch (err) {
        sessionStorage.removeItem('urnaToken');
        setToken(null);
      } finally {
        setCarregandoSessao(false);
      }
    };

    fetchSession();
  }, [token, api]);

  const handleLoginSuccess = ({ token: newToken, eleitor: eleitorPayload }) => {
    sessionStorage.setItem('urnaToken', newToken);
    setToken(newToken);
    const normalized = normalizeEleitor(eleitorPayload);
    setEleitor(normalized);
    setVoteReceipt(null);
    setSelecionado(null);
    setCurrentStep(getStepForEleitor(normalized));
    autoPrintRef.current = false;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('urnaToken');
    setToken(null);
    setEleitor(null);
    setVoteReceipt(null);
    setSelecionado(null);
    setCurrentStep('LOGIN');
    autoPrintRef.current = false;
  };

  const handleCandidateSelection = (candidato) => {
    setSelecionado(candidato);
    setErroVoto('');
    setCurrentStep('CONFIRMACAO');
  };

  const handleVoteConfirm = async () => {
    if (!selecionado || !api) return;
    setRegistrandoVoto(true);
    setErroVoto('');
    try {
      const response = await api.post('/votar', { candidatoId: selecionado.id });
      setVoteReceipt(response.data);
      setEleitor(prev =>
        prev
          ? {
            ...prev,
            ja_votou: true,
            jaVotou: true,
            votou_em: response.data.registradoEm,
            votouEm: response.data.registradoEm,
          }
          : prev,
      );
      setCurrentStep('SUCESSO');
      if (!autoPrintRef.current) {
        autoPrintRef.current = true;
        handlePrintReceipt(response.data, selecionado?.nome);
      }
    } catch (err) {
      setErroVoto(err.response?.data?.error || 'Falha ao registrar voto. Tente novamente.');
    } finally {
      setRegistrandoVoto(false);
    }
  };

  const handlePrintReceipt = (receiptOverride = null, candidatoNomeOverride = null) => {
    const receipt = receiptOverride || voteReceipt;
    const registro = receipt?.registradoEm || eleitor?.votou_em || eleitor?.votouEm;
    const hash = receipt?.hashIntegridade || null;
    const candidatoNome = receipt?.candidato?.nome || candidatoNomeOverride || selecionado?.nome || 'N/D';
    const timestamp = registro ? new Date(registro).toLocaleString() : 'N/D';
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Comprovante de Votacao</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; }
            .recibo { border: 2px dashed #009966; padding: 24px; border-radius: 12px; max-width: 480px; margin: 0 auto; }
            h1 { color: #009966; font-size: 1.4rem; margin-bottom: 16px; }
            p { margin: 6px 0; }
            code { background: #f4f6f6; padding: 6px 10px; border-radius: 6px; word-break: break-all; display: block; }
            .footer { margin-top: 24px; font-size: 0.85rem; color: #666; }
          </style>
        </head>
        <body>
          <div class="recibo">
            <h1>Comprovante de Votacao - CIPA 2025</h1>
            <p><strong>Candidato escolhido:</strong> ${candidatoNome}</p>
            <p><strong>Registrado em:</strong> ${timestamp}</p>
            ${hash ? `<p><strong>Hash de Integridade:</strong></p><code>${hash}</code>` : '<p><em>Hash disponivel apenas imediatamente apos o voto.</em></p>'}
            <div class="footer">
              Guarde este comprovante para fins de auditoria. O hash comprova que o voto foi registrado sem revelar a sua escolha.
            </div>
          </div>
          <script>
            window.print();
            window.onafterprint = window.close;
          </script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=720,height=600');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(content);
      printWindow.document.close();
    }
  };

  const sessionInfo = useMemo(() => {
    if (!eleitor) return null;
    return (
      <div className="session-info">
        <div>
          <strong>{eleitor.nome}</strong>
          <span>Matricula {eleitor.matricula} - {eleitor.setor}</span>
        </div>
        <button type="button" className="secondary-btn" onClick={handleLogout}>
          Sair
        </button>
      </div>
    );
  }, [eleitor]);

  const renderStepIndicator = () => {
    if (currentStep === 'ADMIN') return null;
    return (
      <div className="steps">
        {steps.map(({ id, label }, index) => {
          const ativo = id === currentStep;
          const concluido = steps.findIndex(step => step.id === currentStep) > index;
          return (
            <div key={id} className={`step ${ativo ? 'ativo' : ''} ${concluido ? 'concluido' : ''}`}>
              <span className="step-index">{index + 1}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (carregandoSessao) {
      return <p>Validando sessao...</p>;
    }

    switch (currentStep) {
      case 'LOGIN':
        return <Login onLoginSuccess={handleLoginSuccess} />;
      case 'ADMIN':
        return (
          <div className="admin-placeholder">
            <h2>Ferramentas administrativas</h2>
            <p>Membros da comissao CIPA utilizam apenas os cards abaixo para gerenciar candidatos, eleitores e auditoria.</p>
          </div>
        );
      case 'ESCOLHA':
        return (
          <>
            {renderStepIndicator()}
            <Votacao api={api} onConfirmSelection={handleCandidateSelection} jaVotou={jaVotou} />
          </>
        );
      case 'CONFIRMACAO':
        return (
          <>
            {renderStepIndicator()}
            <ConfirmacaoVoto
              candidato={selecionado}
              onConfirmar={handleVoteConfirm}
              onVoltar={() => setCurrentStep('ESCOLHA')}
              carregando={registrandoVoto}
              erro={erroVoto}
            />
          </>
        );
      case 'SUCESSO':
        return (
          <>
            {renderStepIndicator()}
            <div className="voto-confirmado">
              <h2>Voto computado com sucesso!</h2>
              <p>Obrigado por participar da eleicao da CIPA 2025.</p>
              <div className="receipt">
                {(voteReceipt?.candidato?.nome || selecionado?.nome) && (
                  <>
                    <span>Candidato votado:</span>
                    <strong>{voteReceipt?.candidato?.nome || selecionado?.nome}</strong>
                  </>
                )}
                <span>Registro em:</span>
                <strong>{(voteReceipt?.registradoEm || eleitor?.votou_em || eleitor?.votouEm || '').toString()}</strong>
                {voteReceipt?.hashIntegridade && (
                  <>
                    <span>Hash de integridade:</span>
                    <code>{voteReceipt.hashIntegridade}</code>
                  </>
                )}
              </div>
              {voteReceipt ? (
                <button
                  type="button"
                  className="primary-btn"
                  style={{ maxWidth: 260, margin: '16px auto 0' }}
                  onClick={handlePrintReceipt}
                >
                  Reimprimir comprovante
                </button>
              ) : (
                <p className="message-info" style={{ marginTop: 16 }}>
                  Este recibo e exibido apenas imediatamente apos o registro do voto.
                </p>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`senior-layout ${showBranding ? '' : 'sem-imagem'}`}>
      {showBranding && (
        <div className="senior-left">
          <img src={require('./img/background.png')} alt="Background" className="senior-bg-img" />
        </div>
      )}
      <div className="senior-right">
        {showBranding && (
          <img src={require('./img/logo.png')} alt="Logo" className="senior-logo" />
        )}
        {sessionInfo}
        <div className="card-container">
          {renderContent()}
        </div>
        {isAdmin && api && (
          <div className="painel-admin">
            <h3>Painel administrativo CIPA</h3>
            <div className="painel-grid">
              <CadastroCandidato api={api} />
              <Resultados api={api} />
              <ListaEleitores api={api} />
              <ImportEleitores api={api} />
              <AuditoriaLogs api={api} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
