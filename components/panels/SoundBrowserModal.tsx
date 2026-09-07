'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  Star,
  Play,
  Check,
  Music,
  Sliders,
  Volume2,
} from 'lucide-react';
import { InstrumentId } from '@/types/piano';
import { AVAILABLE_INSTRUMENTS, INSTRUMENT_CATEGORIES } from '@/lib/constants';

interface SoundBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInstrument: InstrumentId;
  onSelectInstrument: (id: InstrumentId) => void;
  favoriteSounds?: InstrumentId[];
  onToggleFavorite?: (id: InstrumentId) => void;
  recentSounds?: InstrumentId[];
  onPreviewSound?: (id: InstrumentId) => void;
}

export function SoundBrowserModal({
  isOpen,
  onClose,
  currentInstrument,
  onSelectInstrument,
  favoriteSounds = [],
  onToggleFavorite,
  recentSounds = [],
  onPreviewSound,
}: SoundBrowserModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [previewingId, setPreviewingId] = useState<InstrumentId | null>(null);

  // Filter instruments based on search, category, and favorite filter
  const filteredInstruments = useMemo(() => {
    return AVAILABLE_INSTRUMENTS.filter((inst) => {
      if (showOnlyFavorites && !favoriteSounds.includes(inst.id)) {
        return false;
      }
      if (selectedCategory !== 'all' && inst.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = inst.name.toLowerCase().includes(query);
        const matchDesc = inst.description.toLowerCase().includes(query);
        const matchCat = inst.category.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, showOnlyFavorites, favoriteSounds]);

  if (!isOpen) return null;

  const handlePreview = (e: React.MouseEvent, id: InstrumentId) => {
    e.stopPropagation();
    setPreviewingId(id);
    onPreviewSound?.(id);
    setTimeout(() => {
      setPreviewingId((curr) => (curr === id ? null : curr));
    }, 1800);
  };

  const handleSelect = (id: InstrumentId) => {
    onSelectInstrument(id);
    onClose();
  };

  return (
    <div
      id="sound-browser-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="sound-browser-modal-card"
        className="w-full max-w-4xl bg-[#141417] border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] text-stone-200 overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800/90 bg-[#17171b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg tracking-wide text-stone-100">Sound Library</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300 font-mono">
                  37 Voices
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Acoustic grand pianos, uprights, electric keys, organs, strings & ambient pads
              </p>
            </div>
          </div>
          <button
            id="close-sound-browser-button"
            type="button"
            onClick={onClose}
            aria-label="Close Sound Library"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH & RECENT STRIP */}
        <div className="px-5 pt-3 pb-2 flex flex-col gap-2.5 border-b border-stone-800/60 bg-[#121215]">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="sound-search-input"
                type="text"
                placeholder="Search instruments by name, timbre, or character..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-900/90 border border-stone-700/80 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Favorites Toggle Button */}
            <button
              id="filter-favorites-toggle"
              type="button"
              onClick={() => setShowOnlyFavorites((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                showOnlyFavorites
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Favorites ({favoriteSounds.length})</span>
            </button>
          </div>

          {/* Recently Used Voices */}
          {recentSounds.length > 0 && !searchQuery && selectedCategory === 'all' && (
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 whitespace-nowrap">
                Recent:
              </span>
              <div className="flex items-center gap-1.5">
                {recentSounds.map((recId) => {
                  const inst = AVAILABLE_INSTRUMENTS.find((i) => i.id === recId);
                  if (!inst) return null;
                  const isCur = inst.id === currentInstrument;
                  return (
                    <button
                      key={recId}
                      type="button"
                      onClick={() => handleSelect(inst.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                        isCur
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700/60 hover:bg-stone-700'
                      }`}
                    >
                      <span>{inst.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CATEGORY TABS */}
        <div className="px-5 py-2.5 flex items-center gap-1.5 overflow-x-auto border-b border-stone-800/60 bg-[#121215]/80 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-stone-200 text-stone-950 font-semibold shadow-sm'
                : 'bg-stone-800/70 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            All Voices ({AVAILABLE_INSTRUMENTS.length})
          </button>
          {INSTRUMENT_CATEGORIES.map((cat) => {
            const count = AVAILABLE_INSTRUMENTS.filter((i) => i.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-stone-950 font-semibold shadow-sm'
                    : 'bg-stone-800/70 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-amber-600/30 text-stone-900 font-bold' : 'bg-stone-900 text-stone-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* INSTRUMENT CARDS GRID */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredInstruments.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-stone-400 gap-2">
              <Music className="w-8 h-8 text-stone-600" />
              <p className="text-sm font-medium">No instruments match your search criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setShowOnlyFavorites(false);
                }}
                className="mt-2 px-3 py-1 text-xs rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredInstruments.map((inst) => {
              const isSelected = inst.id === currentInstrument;
              const isFav = favoriteSounds.includes(inst.id);
              const isAuditioning = previewingId === inst.id;

              return (
                <div
                  key={inst.id}
                  id={`sound-card-${inst.id}`}
                  onClick={() => handleSelect(inst.id)}
                  className={`
                    group relative rounded-xl p-3.5 flex flex-col justify-between gap-2.5 cursor-pointer transition-all border
                    ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#221f18] to-[#181614] border-amber-500/70 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
                        : 'bg-[#18181c] border-stone-800/90 hover:border-stone-700 hover:bg-[#1f1f24]'
                    }
                  `}
                >
                  {/* Top line: Name, Category tag, Favorite star */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-stone-100 group-hover:text-amber-300 transition-colors">
                          {inst.name}
                        </span>
                        {isSelected && (
                          <span className="flex items-center text-amber-400" title="Active Sound">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400">
                        {inst.category.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Audition Button */}
                      <button
                        type="button"
                        aria-label={`Preview ${inst.name}`}
                        title="Audition Preview Phrase"
                        onClick={(e) => handlePreview(e, inst.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isAuditioning
                            ? 'bg-amber-500 text-stone-950 border-amber-400 animate-pulse'
                            : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-100 hover:bg-stone-700'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {/* Favorite Button */}
                      {onToggleFavorite && (
                        <button
                          type="button"
                          aria-label={`Toggle favorite for ${inst.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(inst.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isFav
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {inst.description}
                  </p>

                  {/* Acoustic Specs bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 text-[10px] font-mono text-stone-500">
                    <span>Bright: {inst.brightness ?? 60}%</span>
                    <span>•</span>
                    <span>Atk: {inst.attack ? Math.round(inst.attack * 1000) : 3}ms</span>
                    <span>•</span>
                    <span>Rel: {inst.release ?? 0.3}s</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BOTTOM FOOTER */}
        <div className="px-5 py-3 border-t border-stone-800/80 bg-[#16161a] flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span>Currently Active:</span>
            <span className="font-semibold text-amber-400">
              {AVAILABLE_INSTRUMENTS.find((i) => i.id === currentInstrument)?.name || currentInstrument}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
