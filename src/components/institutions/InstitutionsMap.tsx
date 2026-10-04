'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Institution, api } from '@/lib/api';
import { directusCms } from '@/lib/directus';
import { PillBadge } from '@/components/ui/PillBadge';
import { Search, MapPin, Globe, ExternalLink, Filter, GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';

export const InstitutionsMap: React.FC = () => {
  const { locale } = useSettingsStore();
  const t = translations[locale].institutions;
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

  // Selected item to center map
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  // 1. Fetch institutions from Directus CMS / Go backend API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try Directus CMS first
        const directusData = await directusCms.getInstitutions();
        if (directusData && directusData.length > 0) {
          const mapped: Institution[] = directusData.map((d) => ({
            id: d.id,
            name: d.name,
            country: d.country,
            city: d.city,
            state: d.state,
            minScore: d.min_score,
            subscoreReqs: d.subscore_reqs,
            latitude: d.latitude,
            longitude: d.longitude,
            websiteUrl: d.website_url,
            logoUrl: d.logo_url,
            category: d.category || 'Top Global',
            acceptanceRate: d.acceptance_rate,
            programs: d.programs || [],
            createdAt: new Date().toISOString(),
          }));
          setInstitutions(mapped);
          setFilteredInstitutions(mapped);
          return;
        }

        // Fallback to Go Backend API
        const res = await api.getInstitutions();
        setInstitutions(res.institutions);
        setFilteredInstitutions(res.institutions);
      } catch (err) {
        console.error('Failed to load institutions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Filter logic
  useEffect(() => {
    let result = institutions;

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        (inst) =>
          inst.name.toLowerCase().includes(q) ||
          inst.city.toLowerCase().includes(q) ||
          inst.country.toLowerCase().includes(q)
      );
    }

    if (selectedCountry !== 'All') {
      result = result.filter((inst) => inst.country === selectedCountry);
    }

    if (selectedCategory !== 'All') {
      result = result.filter((inst) => inst.category === selectedCategory);
    }

    if (minScoreFilter > 0) {
      result = result.filter((inst) => inst.minScore >= minScoreFilter);
    }

    setFilteredInstitutions(result);
  }, [search, selectedCountry, selectedCategory, minScoreFilter, institutions]);

  // 3. Initialize Leaflet Map safely in client
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Load leaflet css dynamically if not already loaded
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let isSubscribed = true;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      // Clean existing map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map centered at global view (Europe / Atlantic view)
      const map = L.map(mapContainerRef.current, {
        center: [38.0, -20.0],
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
        scrollWheelZoom: false,
      });

      // OpenStreetMap Standard Tiles (100% Free, no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      updateMarkers(L, map, filteredInstitutions);
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 4. Update markers on map when filteredInstitutions changes
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      if (!mapInstanceRef.current) return;
      updateMarkers(L, mapInstanceRef.current, filteredInstitutions);
    });
  }, [filteredInstitutions]);

  // Helper to draw markers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateMarkers = (L: any, map: any, list: Institution[]) => {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    list.forEach((inst) => {
      if (!inst.latitude || !inst.longitude) return;

      // Color based on score
      const badgeBg = inst.minScore >= 125 ? '#0C2418' : inst.minScore >= 120 ? '#111315' : '#1e293b';
      const badgeText = '#D2F544';

      const customIcon = L.divIcon({
        className: 'custom-det-marker',
        html: `
          <div style="
            background: ${badgeBg};
            color: ${badgeText};
            border: 2px solid #D2F544;
            border-radius: 9999px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            <span>${inst.minScore}</span>
          </div>
        `,
        iconSize: [40, 24],
        iconAnchor: [20, 12],
      });

      const marker = L.marker([inst.latitude, inst.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; padding: 4px; max-width: 240px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #16a34a; margin-bottom: 2px;">
            ${inst.category} • ${inst.country}
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px; line-height: 1.2;">
            ${inst.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            📍 ${inst.city}${inst.state ? ', ' + inst.state : ''}
          </div>
          <div style="background: #f1f5f9; padding: 6px 8px; border-radius: 8px; font-size: 11px; margin-bottom: 8px;">
            <strong>Минимальный балл DET:</strong> <span style="color: #047857; font-weight: 800;">${inst.minScore}+</span>
            ${inst.subscoreReqs ? `<div style="font-size: 10px; color: #475569; margin-top: 2px;">${inst.subscoreReqs}</div>` : ''}
          </div>
          <a href="${inst.websiteUrl}" target="_blank" rel="noopener noreferrer" style="
            display: inline-block;
            background: #0f172a;
            color: #D2F544;
            font-size: 11px;
            font-weight: 700;
            padding: 5px 10px;
            border-radius: 9999px;
            text-decoration: none;
          ">
            Сайт приемной комиссии ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedInstitution(inst);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  };

  const handleFocusInstitution = (inst: Institution) => {
    setSelectedInstitution(inst);
    if (mapInstanceRef.current && inst.latitude && inst.longitude) {
      mapInstanceRef.current.flyTo([inst.latitude, inst.longitude], 11, {
        duration: 1.2,
      });
      // Find marker and open popup
      const marker = markersRef.current.find((m) => {
        const latLng = m.getLatLng();
        return Math.abs(latLng.lat - inst.latitude) < 0.001 && Math.abs(latLng.lng - inst.longitude) < 0.001;
      });
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const countries = ['All', 'United States', 'United Kingdom', 'Canada', 'Germany', 'Australia', 'Singapore'];
  const categories = ['All', 'Ivy League', 'Top Global', 'Top STEM', 'Public Ivy', 'Russell Group', 'Canadian Top', 'Europe'];

  return (
    <div className="space-y-8">
      {/* Search and Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#0E1012] rounded-2xl pl-11 pr-4 py-3 text-sm text-neutral-900 outline-none font-medium placeholder-neutral-400"
            />
          </div>

          {/* Country filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-800 outline-none cursor-pointer"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? t.allCountries : c}
                </option>
              ))}
            </select>
          </div>

          {/* Min Score filter */}
          <div className="md:col-span-3">
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-800 outline-none cursor-pointer"
            >
              <option value={0}>{t.scoreAny}</option>
              <option value={115}>{t.score115}</option>
              <option value={120}>{t.score120}</option>
              <option value={125}>{t.score125}</option>
              <option value={130}>{t.score130}</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
          <span className="text-xs font-bold text-neutral-400 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> {t.categoriesLabel}
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0E1012] text-[#D2F544] shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat === 'All' ? t.allCategories : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map and Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Interactive Map (8 cols) */}
        <div className="lg:col-span-8 bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl relative">
          {/* Map Top Bar */}
          <div className="bg-[#111315] px-6 py-3 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D2F544] animate-pulse" />
              <span>{t.mapHeading}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline">{t.mapPinsNote}</span>
              <span className="font-mono text-[#D2F544] font-bold">{t.foundLabel} {filteredInstitutions.length}</span>
            </div>
          </div>

          {/* Leaflet Container */}
          <div
            ref={mapContainerRef}
            className="w-full h-[520px] bg-neutral-900 z-10"
            style={{ minHeight: '520px' }}
          />

          {/* Selected Institution Banner if any */}
          {selectedInstitution && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-neutral-200 shadow-lg z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {selectedInstitution.category}
                </span>
                <h4 className="text-base font-extrabold text-[#0E1012] mt-1">
                  {selectedInstitution.name}
                </h4>
                <p className="text-xs text-neutral-500">
                  📍 {selectedInstitution.city}, {selectedInstitution.country} • {t.minScoreLabel} <strong className="text-emerald-700">{selectedInstitution.minScore}+</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedInstitution.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0E1012] hover:bg-neutral-800 text-[#D2F544] px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  {t.admissionsSite} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Institutions List / Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-black uppercase text-[#0E1012]">
                {t.sidebarTitle}
              </h3>
              <p className="text-xs text-neutral-400">
                {t.sidebarSubtitle}
              </p>
            </div>
            <Link
              href="/test"
              className="bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] text-xs font-black px-3.5 py-1.5 rounded-full transition-transform active:scale-95 shadow-sm inline-flex items-center gap-1"
            >
              {t.sidebarTakeTest} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-3xl border border-neutral-200 text-center py-12">
              <div className="w-7 h-7 border-2 border-neutral-300 border-t-[#0C2418] rounded-full animate-spin mx-auto mb-3" />
              <span className="text-xs text-neutral-400 font-medium">{t.loadingCatalog}</span>
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-neutral-200 text-center py-12 space-y-3">
              <GraduationCap className="w-8 h-8 text-neutral-400 mx-auto" />
              <h4 className="text-sm font-bold text-neutral-800">{t.notFoundTitle}</h4>
              <p className="text-xs text-neutral-400">{t.notFoundDesc}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredInstitutions.map((inst) => {
                const isSelected = selectedInstitution?.id === inst.id;
                return (
                  <div
                    key={inst.id}
                    onClick={() => handleFocusInstitution(inst)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-800 shadow-md scale-[1.01]'
                        : 'bg-white hover:bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-[#D2F544]/20 text-[#D2F544]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {inst.category}
                      </span>
                      <span
                        className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                          isSelected
                            ? 'bg-[#D2F544] text-[#0C2418]'
                            : 'bg-neutral-900 text-white'
                        }`}
                      >
                        {inst.minScore}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold leading-snug mb-1 ${isSelected ? 'text-white' : 'text-[#0E1012]'}`}>
                      {inst.name}
                    </h4>

                    <div className={`text-xs flex items-center justify-between ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      <span>📍 {inst.city}, {inst.country}</span>
                      {inst.acceptanceRate && (
                        <span>{t.acceptanceLabel} {inst.acceptanceRate}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
