'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  Play,
  Check,
  X,
  Sparkles,
  Music,
  Radio,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import { InstrumentCategory, InstrumentId, InstrumentInfo } from '@/types/piano';
import { AVAILABLE_INSTRUMENTS } from '@/lib/constants';
import { AudioEngine } from '@/lib/audio/AudioEngine';

interface SoundBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  currentInstrument: InstrumentId;
  onSelectInstrument: (id: InstrumentId) => void;
  favoriteSounds?: InstrumentId[];
  onToggleFavorite?: (id: InstrumentId) => void;
  recentSounds?: InstrumentId[];
}

const CATEGORIES: ('All' | InstrumentCategory)[] = [
  'All',
  'Grand Pianos',
  'Upright Pianos',
  'Electric Pianos',
  'Keys',
  'Organ',
  'Strings',
  'Pads',
  'Hybrid',
];

export function SoundBrowser({
  isOpen,
  onClose,
  currentInstrument,
  onSelectInstrument,
  favoriteSounds = ['concert-grand', 'rhodes', 'felt-upright', 'warm-strings'],
  onToggleFavorite,
  recentSounds = ['concert-grand'],
}: SoundBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | InstrumentCategory>('All');
  const [previewingId, setPreviewingId] = useState<InstrumentId | null>(null);

  // Filtered sound list
  const filteredInstruments = useMemo(() => {
    return AVAILABLE_INSTRUMENTS.filter((inst) => {
      const matchesCategory =
        selectedCategory === 'All' || inst.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        inst.name.toLowerCase().includes(query) ||
        inst.description.toLowerCase().includes(query) ||
        inst.category.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  // Favorites list
  const favoriteInstruments = useMemo(() => {
    return AVAILABLE_INSTRUMENTS.filter((inst) => favoriteSounds.includes(inst.id));
  }, [favoriteSounds]);

  // Recent list
  const recentInstruments = useMemo(() => {
    return recentSounds
      .map((id) => AVAILABLE_INSTRUMENTS.find((inst) => inst.id === id))
      .filter((inst): inst is InstrumentInfo => Boolean(inst));
  }, [recentSounds]);

  const handlePreview = (id: InstrumentId, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewingId(id);
    AudioEngine.getInstance().playPreviewPhrase(id);
    setTimeout(() => {
      setPreviewingId((prev) => (prev === id ? null : prev));
    }, 1800);
  };

  const handleSelect = (id: InstrumentId) => {
    onSelectInstrument(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="sound-browser-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#121215] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800/90 bg-[#17171c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-stone-100">
                Studio Sound Library
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                37 Concert Timbres across 8 Acoustic & Electronic Categories
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sound Browser"
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-stone-800/80 bg-[#141418] flex flex-col gap-3">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search sounds by name, character, or category (e.g., Felt, Rhodes, Strings)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer
                  ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                      : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800/80'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sound List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. FAVORITES SECTION */}
          {selectedCategory === 'All' && !searchQuery && favoriteInstruments.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5 text-xs font-mono font-semibold tracking-wider text-amber-400/90 uppercase">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Favorites</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {favoriteInstruments.map((inst) => (
                  <SoundCard
                    key={`fav-${inst.id}`}
                    inst={inst}
                    isSelected={currentInstrument === inst.id}
                    isPreviewing={previewingId === inst.id}
                    isFavorite={true}
                    onPreview={(e) => handlePreview(inst.id, e)}
                    onSelect={() => handleSelect(inst.id)}
                    onToggleFavorite={() => onToggleFavorite?.(inst.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. RECENT SOUNDS ROW */}
          {selectedCategory === 'All' && !searchQuery && recentInstruments.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-xs font-mono font-semibold tracking-wider text-stone-400 uppercase">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Recently Played</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentInstruments.map((inst) => (
                  <button
                    key={`recent-${inst.id}`}
                    type="button"
                    onClick={() => handleSelect(inst.id)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer
                      ${
                        currentInstrument === inst.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700 hover:bg-stone-800'
                      }
                    `}
                  >
                    <span>{inst.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. MAIN SOUNDS GRID */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold tracking-wider text-stone-400 uppercase">
                {selectedCategory === 'All' ? 'All Sounds' : selectedCategory} ({filteredInstruments.length})
              </span>
            </div>

            {filteredInstruments.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-sm font-mono">
                No instruments matching &quot;{searchQuery}&quot; found in {selectedCategory}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredInstruments.map((inst) => (
                  <SoundCard
                    key={inst.id}
                    inst={inst}
                    isSelected={currentInstrument === inst.id}
                    isPreviewing={previewingId === inst.id}
                    isFavorite={favoriteSounds.includes(inst.id)}
                    onPreview={(e) => handlePreview(inst.id, e)}
                    onSelect={() => handleSelect(inst.id)}
                    onToggleFavorite={() => onToggleFavorite?.(inst.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800/80 bg-[#141418] flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2 font-mono">
            <span>Selected:</span>
            <span className="text-amber-400 font-semibold">
              {AVAILABLE_INSTRUMENTS.find((i) => i.id === currentInstrument)?.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface SoundCardProps {
  inst: InstrumentInfo;
  isSelected: boolean;
  isPreviewing: boolean;
  isFavorite: boolean;
  onPreview: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

function SoundCard({
  inst,
  isSelected,
  isPreviewing,
  isFavorite,
  onPreview,
  onSelect,
  onToggleFavorite,
}: SoundCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        group relative flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer select-none
        ${
          isSelected
            ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
            : 'bg-[#15151a] border-stone-800/90 hover:border-stone-700 hover:bg-[#1a1a21]'
        }
      `}
    >
      <div className="flex flex-col gap-1 min-w-0 pr-3">
        <div className="flex items-center gap-2">
          <h3
            className={`text-sm font-semibold tracking-tight truncate ${
              isSelected ? 'text-amber-300' : 'text-stone-200 group-hover:text-stone-100'
            }`}
          >
            {inst.name}
          </h3>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700/60">
            {inst.category}
          </span>
          {isSelected && (
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-400 px-1 py-0.2 rounded bg-amber-500/20 border border-amber-500/30">
              <Check className="w-2.5 h-2.5" /> ACTIVE
            </span>
          )}
        </div>
        <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
          {inst.description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Preview Button */}
        <button
          type="button"
          onClick={onPreview}
          title="Audition sound preview (C Major phrase)"
          className={`
            p-2 rounded-lg border transition-all cursor-pointer
            ${
              isPreviewing
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse'
                : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-800'
            }
          `}
        >
          <Play className={`w-3.5 h-3.5 ${isPreviewing ? 'fill-stone-950' : 'fill-stone-300'}`} />
        </button>

        {/* Favorite Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`
            p-2 rounded-lg border transition-all cursor-pointer
            ${
              isFavorite
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300 hover:bg-stone-800'
            }
          `}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>
    </div>
  );
}
