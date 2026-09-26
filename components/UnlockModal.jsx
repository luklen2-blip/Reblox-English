import React, { useState, useEffect } from 'react';

export default function UnlockModal({ isOpen, onClose, onPaymentSuccess }) {
  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Payload PIX Copia e Cola Oficial (Bacen EMV) R$ 19,90
  const pixCode = "00020126580014BR.GOV.BCB.PIX0136sua-chave-pix-aqui520400005303986540519.905802BR5925ROBLOX ENGLISH OBBY 3D6009SAO PAULO62070503***6304E2D1";

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulatePayment = () => {
    setIsCheckingPayment(true);
    // Simulação de confirmação do webhook
    setTimeout(() => {
      setIsCheckingPayment(false);
      if (onPaymentSuccess) onPaymentSuccess();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-yellow-400 rounded-3xl p-6 sm:p-8 text-white shadow-2xl text-center">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center transition"
          aria-label="Fechar"
        >
          ✕
        </button>

        {/* Topo: Celebração para a Criança */}
        <div className="text-4xl sm:text-5xl mb-2 animate-bounce">🏆</div>
        <h2 className="text-2xl sm:text-3xl font-black text-yellow-400 tracking-wide uppercase">
          Level 1 Complete!
        </h2>
        <p className="text-emerald-400 font-bold text-sm sm:text-base mt-1">
          ✨ You are awesome! 5 novas palavras aprendidas!
        </p>

        {/* Divisor Visual */}
        <div className="h-px bg-slate-700 my-4" />

        {/* Área dos Pais */}
        <div className="text-left bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-yellow-400 text-slate-900 font-extrabold text-xs px-2 py-0.5 rounded-full uppercase">
              Área dos Pais
            </span>
            <span className="text-xs text-slate-300">Acesso Vitalício Completo</span>
          </div>

          <ul className="text-xs sm:text-sm text-slate-200 space-y-1.5 mb-3">
            <li className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold">✓</span> +4 Novos Mundos 3D temáticos (+80 palavras)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold">✓</span> Loja de skins, roupas e chapéus para o avatar
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold">✓</span> Jogue direto no Computador ou Celular
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold">✓</span> Sem mensalidade nem anúncios
            </li>
          </ul>

          <div className="flex items-baseline justify-between border-t border-slate-700/60 pt-3">
            <span className="text-slate-400 text-sm">Valor único promocional:</span>
            <span className="text-2xl font-black text-emerald-400">R$ 19,90</span>
          </div>
        </div>

        {/* Seção de Pagamento via PIX */}
        <div className="mt-5 space-y-3">
          <button
            onClick={handleCopy}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg ${
              copied 
                ? 'bg-emerald-600 text-white' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {copied ? '✓ Código PIX Copiado!' : '⚡ Pagar R$ 19,90 no PIX (Copia e Cola)'}
          </button>

          <button
            onClick={handleSimulatePayment}
            disabled={isCheckingPayment}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            {isCheckingPayment ? 'Verificando pagamento...' : 'Já fiz o pagamento (Liberar Acesso)'}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-4">
          Pagamento seguro processado instantaneamente. Liberação imediata em todos os aparelhos.
        </p>
      </div>
    </div>
  );
}
