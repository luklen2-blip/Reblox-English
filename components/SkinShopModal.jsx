import React, { useState } from 'react';

export const SKINS = [
  { id: 'default', name: 'Original Blue', color: '#3b82f6', isPro: false },
  { id: 'fire', name: 'Fire Hero', color: '#ef4444', isPro: true, hat: '🔥' },
  { id: 'astronaut', name: 'Astro Kid', color: '#e2e8f0', isPro: true, hat: '🚀' },
  { id: 'gold', name: 'Golden King', color: '#eab308', isPro: true, hat: '👑' },
  { id: 'ninja', name: 'Shadow Ninja', color: '#18181b', isPro: true, hat: '🥷' },
  { id: 'dino', name: 'Baby Dino', color: '#22c55e', isPro: true, hat: '🦖' },
];

export default function SkinShopModal({ isOpen, onClose, isProUnlocked, currentSkin, onSelectSkin, onOpenUnlockModal }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-yellow-400 rounded-3xl p-6 text-white text-center shadow-2xl">
        
        {/* Fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Fechar"
        >
          ✕
        </button>

        {/* Cabeçalho */}
        <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-2">
          <span>🧢</span> Avatar Wardrobe
        </h2>
        <p className="text-xs text-slate-300 mb-5">
          Personalize seu avatar com acessórios épicos!
        </p>

        {/* Grid de Skins */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SKINS.map((skin) => {
            const isSelected = currentSkin && currentSkin.id === skin.id;
            const isLocked = skin.isPro && !isProUnlocked;

            return (
              <div 
                key={skin.id}
                onClick={() => {
                  if (isLocked) {
                    onOpenUnlockModal();
                  } else {
                    onSelectSkin(skin);
                  }
                }}
                className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${
                  isSelected 
                    ? 'border-emerald-400 bg-slate-800 scale-102 ring-2 ring-emerald-400/50' 
                    : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                }`}
              >
                {/* Visualização da Skin */}
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner relative"
                  style={{ backgroundColor: skin.color }}
                >
                  {skin.hat || '🙂'}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-lg">
                      🔒
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-xs font-bold">{skin.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {skin.isPro ? (isProUnlocked ? 'Liberado' : 'Pro (R$ 19,90)') : 'Grátis'}
                  </div>
                </div>

                {isSelected && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    EM USO
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Chamada para destravar caso não seja PRO */}
        {!isProUnlocked && (
          <button
            onClick={onOpenUnlockModal}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-transform active:scale-95"
          >
            ⚡ Desbloquear Todas as Skins por R$ 19,90
          </button>
        )}
      </div>
    </div>
  );
}
