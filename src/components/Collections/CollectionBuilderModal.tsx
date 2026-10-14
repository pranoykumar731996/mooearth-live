// ============================================================
// MooEarth Live — Discovery Collection Builder & Creator Studio
// ============================================================
// Phase 10: Allows users, educators, and creators to assemble
// curated geographic collections using templates, saved bookmarks,
// educational notes, and publisher article citations.

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DiscoveryCollection,
  CollectionLocationItem,
  CollectionTemplateId,
  CollectionCategory,
} from '@/types/collections';
import {
  COLLECTION_TEMPLATES,
  createCollection,
  updateCollection,
} from '@/services/collectionService';
import { getSavedPlaces, SavedPlace } from '@/services/personalizationService';
import { validateCollectionInput } from '@/lib/collectionValidator';
import { trackCollectionCreated, trackCollectionPublished } from '@/services/analytics';

interface CollectionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionSaved: (collection: DiscoveryCollection) => void;
  editingCollection?: DiscoveryCollection | null;
  currentUser?: { uid?: string; displayName?: string | null; photoURL?: string | null } | null;
}

export default function CollectionBuilderModal({
  isOpen,
  onClose,
  onCollectionSaved,
  editingCollection,
  currentUser,
}: CollectionBuilderModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CollectionTemplateId>('custom');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CollectionCategory>('education');
  const [coverEmoji, setCoverEmoji] = useState('🌍');
  const [locations, setLocations] = useState<CollectionLocationItem[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New location manual input state
  const [manualName, setManualName] = useState('');
  const [manualCountry, setManualCountry] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualArticleUrl, setManualArticleUrl] = useState('');
  const [manualPublisher, setManualPublisher] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Initialize from editing collection or default
  useEffect(() => {
    if (editingCollection) {
      setTitle(editingCollection.title);
      setDescription(editingCollection.description);
      setCategory(editingCollection.category || 'education');
      setCoverEmoji(editingCollection.coverEmoji || '🌍');
      setLocations(editingCollection.locations || []);
      setIsPublic(editingCollection.status === 'published');
      setSelectedTemplate(editingCollection.templateId || 'custom');
    } else {
      // Reset for new creation
      setTitle('');
      setDescription('');
      setCategory('education');
      setCoverEmoji('🌍');
      setLocations([]);
      setIsPublic(false);
      setSelectedTemplate('custom');
    }

    // Load user's saved places for quick addition
    if (typeof window !== 'undefined') {
      getSavedPlaces(currentUser?.uid).then((places: SavedPlace[]) => {
        setSavedPlaces(places || []);
      });
    }
  }, [editingCollection, currentUser?.uid, isOpen]);

  // Handle template selection
  const handleSelectTemplate = (templateId: CollectionTemplateId) => {
    setSelectedTemplate(templateId);
    const tmpl = COLLECTION_TEMPLATES[templateId];
    if (tmpl) {
      setTitle(tmpl.title);
      setDescription(tmpl.description);
      setCategory(tmpl.category);
      setCoverEmoji(tmpl.coverEmoji);
      setLocations(tmpl.sampleLocations.map((loc, idx) => ({ ...loc, order: idx + 1 })));
    }
  };

  // Add from user's saved places
  const handleAddSavedPlace = (place: SavedPlace) => {
    if (locations.some((l) => l.id === place.id)) {
      setErrorMessage(`"${place.name}" is already in this collection.`);
      return;
    }

    const newItem: CollectionLocationItem = {
      id: place.id,
      name: place.name,
      country: place.country,
      coordinates: place.coordinates,
      order: locations.length + 1,
      notesAttribution: 'creator',
      articleRef: place.url && place.publisher ? {
        articleId: place.articleId || place.id,
        title: place.name,
        url: place.url,
        publisher: place.publisher,
      } : undefined,
    };

    setLocations([...locations, newItem]);
    setErrorMessage('');
  };

  // Add custom manual place
  const handleAddManualPlace = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (!manualName.trim()) {
      setErrorMessage('Please enter a place name.');
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMessage('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setErrorMessage('Longitude must be a valid number between -180 and 180.');
      return;
    }

    const id = `loc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
    const newItem: CollectionLocationItem = {
      id,
      name: manualName.trim(),
      country: manualCountry.trim() || undefined,
      coordinates: { lat, lng },
      order: locations.length + 1,
      educationalNotes: manualNotes.trim() || undefined,
      notesAttribution: manualNotes.trim() ? 'creator' : undefined,
      articleRef: manualArticleUrl.trim() ? {
        articleId: `art_${Date.now()}`,
        title: manualName.trim(),
        url: manualArticleUrl.trim(),
        publisher: manualPublisher.trim() || 'Verified Source',
      } : undefined,
    };

    setLocations([...locations, newItem]);
    // Reset manual form
    setManualName('');
    setManualCountry('');
    setManualLat('');
    setManualLng('');
    setManualNotes('');
    setManualArticleUrl('');
    setManualPublisher('');
    setShowAddForm(false);
    setErrorMessage('');
  };

  // Remove place
  const handleRemoveLocation = (index: number) => {
    const updated = locations.filter((_, idx) => idx !== index).map((loc, idx) => ({
      ...loc,
      order: idx + 1,
    }));
    setLocations(updated);
  };

  // Move place order
  const handleMoveLocation = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= locations.length) return;

    const copy = [...locations];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);

    const reordered = copy.map((loc, idx) => ({ ...loc, order: idx + 1 }));
    setLocations(reordered);
  };

  // Save or Publish Collection
  const handleSave = async (publish: boolean) => {
    setIsSaving(true);
    setErrorMessage('');

    // Pre-validation
    const validation = validateCollectionInput({
      title,
      description,
      locations,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.errors[0]);
      setIsSaving(false);
      return;
    }

    try {
      if (editingCollection) {
        // Update existing collection
        const res = await updateCollection(
          editingCollection.id,
          {
            title: title.trim(),
            description: description.trim(),
            category,
            coverEmoji,
            locations,
            status: publish ? 'published' : 'draft',
            publishedAt: publish ? (editingCollection.publishedAt || Date.now()) : undefined,
          },
          currentUser
        );

        if (!res.success) {
          setErrorMessage(res.error || 'Failed to update collection.');
          setIsSaving(false);
          return;
        }

        const updated: DiscoveryCollection = {
          ...editingCollection,
          title: title.trim(),
          description: description.trim(),
          category,
          coverEmoji,
          locations,
          status: publish ? 'published' : 'draft',
          updatedAt: Date.now(),
        };

        if (publish) {
          trackCollectionPublished(editingCollection.id);
        }

        onCollectionSaved(updated);
        onClose();
      } else {
        // Create new collection
        const res = await createCollection(
          {
            title,
            description,
            category,
            templateId: selectedTemplate,
            locations,
            coverEmoji,
            isPublic: publish,
          },
          currentUser
        );

        if (!res.success || !res.collection) {
          setErrorMessage(res.error || 'Failed to create collection.');
          setIsSaving(false);
          return;
        }

        trackCollectionCreated(res.collection.id, category, locations.length);
        if (publish) {
          trackCollectionPublished(res.collection.id);
        }

        onCollectionSaved(res.collection);
        onClose();
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-2xl bg-slate-950 border border-white/15 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              {coverEmoji}
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                {editingCollection ? 'Edit Discovery Collection' : 'Create Curated Discovery Collection'}
              </h2>
              <p className="text-xs text-white/50">
                Assemble interactive journeys across the 3D globe with educational context.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Template Selection Pills (New creation only) */}
          {!editingCollection && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Choose an Educational Template or Start Custom
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    { id: 'custom', label: 'Custom Tour', emoji: '🧭' },
                    { id: 'five_countries', label: '5 Diverse Nations', emoji: '🌍' },
                    { id: 'landmarks', label: 'World Heritage', emoji: '🏛️' },
                    { id: 'capitals', label: 'Global Capitals', emoji: '🏙️' },
                    { id: 'journey', label: 'Ring of Fire', emoji: '🌋' },
                    { id: 'challenge', label: 'Geo Challenge', emoji: '🎯' },
                  ] as const
                ).map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 cursor-pointer ${
                      selectedTemplate === tmpl.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{tmpl.emoji}</span>
                    <span className="truncate">{tmpl.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Emoji Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                Collection Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Hidden Natural Wonders of South America"
                maxLength={90}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                Cover Emoji
              </label>
              <select
                value={coverEmoji}
                onChange={(e) => setCoverEmoji(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
              >
                {['🌍', '🧭', '🏛️', '🏙️', '🌋', '🏖️', '⛰️', '🎯', '🌿', '🗺️'].map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white/60">
              Overview & Educational Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the educational or thematic purpose of this curated collection..."
              rows={2}
              maxLength={400}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-white/60">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'education',
                  'landmarks',
                  'capitals',
                  'journey',
                  'news_stories',
                  'custom',
                ] as CollectionCategory[]
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Locations Section */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Curated Locations ({locations.length} of 25)
                </h3>
                <p className="text-[11px] text-white/40">
                  Ordered stops visited during the 3D globe interactive tour.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{showAddForm ? '✕ Close' : '+ Add Place'}</span>
              </button>
            </div>

            {/* Quick add from saved places */}
            {savedPlaces.length > 0 && !showAddForm && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  ⚡ Quick Add from Your Saved Places ({savedPlaces.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {savedPlaces.map((sp) => {
                    const isAdded = locations.some((l) => l.id === sp.id);
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddSavedPlace(sp)}
                        className={`px-2 py-1 rounded-lg text-[11px] border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-white/10 hover:bg-emerald-500/20 border-white/15 text-white/80 hover:text-emerald-300 hover:border-emerald-500/30'
                        }`}
                      >
                        <span>{sp.flag || '📍'}</span>
                        <span>{sp.name}</span>
                        {isAdded && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manual Add Place Form Drawer */}
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-2xl bg-cyan-950/20 border border-cyan-500/30 p-4 space-y-3"
              >
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Add New Geographic Discovery
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-white/60 mb-1 block">Location Name *</label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g., Mount Everest Base Camp"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 mb-1 block">Country / Region</label>
                    <input
                      type="text"
                      value={manualCountry}
                      onChange={(e) => setManualCountry(e.target.value)}
                      placeholder="e.g., Nepal"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 mb-1 block">Latitude (-90 to 90) *</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="e.g., 28.0044"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 mb-1 block">Longitude (-180 to 180) *</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      placeholder="e.g., 86.8530"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="text-white/60 mb-1 block">
                    Educational / Creator Context (Optional)
                  </label>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Add verified factual or geographical context for this stop..."
                    rows={2}
                    maxLength={300}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-white/60 mb-1 block">Article Link (Optional)</label>
                    <input
                      type="url"
                      value={manualArticleUrl}
                      onChange={(e) => setManualArticleUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 mb-1 block">Publisher Name</label>
                    <input
                      type="text"
                      value={manualPublisher}
                      onChange={(e) => setManualPublisher(e.target.value)}
                      placeholder="e.g., National Geographic, Reuters"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddManualPlace}
                  className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Confirm & Add to Collection
                </button>
              </motion.div>
            )}

            {/* Current Locations List */}
            {locations.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-white/40 text-xs">
                No locations added yet. Pick a template above or add places from your bookmarks.
              </div>
            ) : (
              <div className="space-y-2">
                {locations.map((loc, idx) => (
                  <div
                    key={loc.id + idx}
                    className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center font-mono font-bold text-cyan-400 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {loc.name} {loc.country ? `(${loc.country})` : ''}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono truncate">
                          {loc.coordinates.lat.toFixed(2)}°, {loc.coordinates.lng.toFixed(2)}°
                          {loc.educationalNotes && ' • 📖 Note attached'}
                          {loc.articleRef && ` • 📰 ${loc.articleRef.publisher}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveLocation(idx, 'up')}
                        title="Move Up"
                        className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white/70"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === locations.length - 1}
                        onClick={() => handleMoveLocation(idx, 'down')}
                        title="Move Down"
                        className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white/70"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(idx)}
                        title="Remove Location"
                        className="p-1 rounded bg-white/5 hover:bg-rose-500/20 text-rose-400 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
            >
              Save as Private Draft
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Publish Publicly 🚀'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
