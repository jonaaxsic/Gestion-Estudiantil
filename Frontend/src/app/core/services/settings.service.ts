import { Injectable, signal, effect, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type ThemeMode = 'light' | 'dark';
export type FontFamily = 'inter' | 'roboto' | 'poppins';

export interface ThemeDefinition {
  id: string;
  label: string;
  palette: string[];
}

export interface UserSettings {
  theme: string;
  /** CSS variables pre-calculadas del tema para cada modo, para aplicar al instante sin esperar HTTP */
  themeCss?: { light?: Record<string, string>; dark?: Record<string, string> };
  font: FontFamily;
  fontSize: number;
  highContrast: boolean;
  notifications: { email: boolean; browser: boolean };
  themeMode: ThemeMode;
}

const STORAGE_KEY_PREFIX = 'ge-settings-';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'default',
  font: 'inter',
  fontSize: 2,
  highContrast: false,
  notifications: { email: true, browser: true },
  themeMode: 'light',
};

// ── Helpers de color ─────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getContrastText(bgHex: string): string {
  const { r, g, b } = hexToRgb(bgHex);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? '#1a1f36' : '#ffffff';
}

// ── Temas con ruta de archivo ────────────────────
interface ThemeEntry {
  id: string;
  folder: string;
  file: string;
}

const THEME_ENTRIES: ThemeEntry[] = [
  { id: 'dewot',       folder: 'dewot theme',       file: 'pokemon-theme.json' },
  { id: 'chien-pao',   folder: 'chien pao theme',   file: 'pokemon-theme.json' },
  { id: 'dottler',     folder: 'dottler theme',     file: 'pokemon-theme.json' },
  { id: 'garadous',    folder: 'garadous theme',    file: 'pokemon-theme.json' },
  { id: 'gliscor',     folder: 'gliscor theme',     file: 'pokemon-theme.json' },
  { id: 'komala',      folder: 'komala theme',      file: 'pokemon-theme.json' },
  { id: 'sirfetchd',   folder: 'Sirfetchd theme',   file: 'pokemon-theme.json' },
  { id: 'wartortle',   folder: 'Wartortle theme',   file: 'Wartortle-theme.json' },
];

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  private readonly themeJsonCache = new Map<string, any>();

  readonly availableThemes = signal<ThemeDefinition[]>([
    { id: 'default', label: 'Clásico', palette: ['#3d6fe8', '#ff6b47', '#18b87a'] },
  ]);

  readonly settings = signal<UserSettings>(this._load());

  readonly themeMode = signal<ThemeMode>(DEFAULT_SETTINGS.themeMode);

  readonly activeThemeId = computed(() => this.settings().theme);

  // ── Cargar temas desde los JSONs ───────────────
  async loadThemes(): Promise<void> {
    try {
      const loaded: ThemeDefinition[] = [
        { id: 'default', label: 'Clásico', palette: ['#3d6fe8', '#ff6b47', '#18b87a'] },
      ];

      for (const entry of THEME_ENTRIES) {
        try {
          const url = `/themes/${encodeURIComponent(entry.folder)}/${entry.file}`;
          const json: any = await firstValueFrom(this.http.get(url));
          this.themeJsonCache.set(entry.id, json);

          const displayName = entry.id
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          loaded.push({
            id: entry.id,
            label: displayName,
            palette: json.palette || ['#888', '#888', '#888'],
          });
        } catch {
          console.warn(`Theme not loaded: ${entry.id}`);
        }
      }
      this.availableThemes.set(loaded);

      const savedTheme = this.settings().theme;
      if (savedTheme !== 'default' && this.themeJsonCache.has(savedTheme)) {
        this._applyThemeVars(savedTheme, this.themeMode());
        // Cachear vars para AMBOS modos, así al recargar es instantáneo
        // sin importar si el usuario usa modo claro u oscuro
        const json = this.themeJsonCache.get(savedTheme);
        const css: Record<string, Record<string, string>> = {};
        for (const m of ['light', 'dark'] as ThemeMode[]) {
          const palette = json?.[m];
          if (palette) css[m] = this._computeAllVars(palette, m);
        }
        if (Object.keys(css).length > 0) {
          this.settings.update(s => ({ ...s, themeCss: css }));
        }
      }
    } catch (e) {
      console.error('Error loading themes:', e);
    }
  }

  constructor() {
    const savedMode = localStorage.getItem('ge-theme') as ThemeMode | null;
    if (savedMode) {
      this.themeMode.set(savedMode);
    }

    this._applyFont(DEFAULT_SETTINGS.font);
    this._applyFontSize(DEFAULT_SETTINGS.fontSize);
    this._applyHighContrast(DEFAULT_SETTINGS.highContrast);

    // Efecto: persistir settings y aplicar cambios visuales
    effect(() => {
      const s = this.settings();
      this._save(s);
      this._applyFont(s.font);
      this._applyFontSize(s.fontSize);
      this._applyHighContrast(s.highContrast);
    });

    // Efecto: cambio de modo claro/oscuro
    effect(() => {
      const mode = this.themeMode();
      const s = this.settings();
      const theme = s.theme;
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(mode);
      localStorage.setItem('ge-theme', mode);

      if (theme === 'default') {
        this._clearThemeVars();
      } else if (this.themeJsonCache.has(theme)) {
        this._applyThemeVars(theme, mode);
      } else if (s.themeCss?.[mode]) {
        // ⚡ Instantáneo: aplicar vars cacheados de localStorage
        // sin esperar la respuesta HTTP de los JSONs del tema
        this._applyVarsToDom(s.themeCss[mode]!);
      }
      // Si no hay nada → loadThemes() lo aplica cuando los JSONs lleguen
    });

    // Cargar temas inmediatamente (para aplicar el tema guardado al recargar)
    // Se hace al final para que los efectos ya estén registrados
    this.loadThemes();
  }

  // ── API pública ────────────────────────────────

  updateSettings(partial: Partial<UserSettings>): void {
    this.settings.update(s => ({ ...s, ...partial }));
  }

  async selectTheme(themeId: string): Promise<void> {
    let json = this.themeJsonCache.get(themeId);
    if (!json && themeId !== 'default') {
      json = await this._fetchThemeJson(themeId);
      if (json) this.themeJsonCache.set(themeId, json);
    }

    this.settings.update(s => ({ ...s, theme: themeId }));

    if (json) {
      const mode = this._detectDefaultMode(json);
      // Cachear vars para AMBOS modos
      const css: Record<string, Record<string, string>> = {};
      for (const m of ['light', 'dark'] as ThemeMode[]) {
        const palette = json[m];
        if (palette) css[m] = this._computeAllVars(palette, m);
      }
      this.settings.update(s => ({
        ...s,
        themeCss: { ...s.themeCss, ...css },
      }));
      this.themeMode.set(mode);
    } else {
      this.settings.update(s => ({ ...s, themeCss: undefined }));
      this._applyThemeVars(themeId, this.themeMode());
    }
  }

  resetSettings(): void {
    this.settings.set({ ...DEFAULT_SETTINGS });
    this.themeMode.set(DEFAULT_SETTINGS.themeMode);
    this._clearThemeVars();
  }

  /**
   * Alterna modo claro/oscuro con efecto circular + fade de colores.
   *
   * 1. Un ripple circular semi-transparente emerge desde el botón cerrar sesión
   *    — crece y se desvanece, SIN ocultar el contenido (opacidad máxima 25%)
   * 2. El modo cambia instantáneamente y las transiciones CSS (300ms)
   *    hacen fade suave de todos los colores
   *
   * Combinación: el usuario VE el círculo crecer, y los colores cambian suavemente.
   */
  toggleMode(): void {
    const logoutBtn = document.querySelector('.btn-logout');
    const rect = logoutBtn?.getBoundingClientRect();
    const centerX = rect ? Math.round(rect.left + rect.width / 2) : window.innerWidth / 2;
    const centerY = rect ? Math.round(rect.top + rect.height / 2) : window.innerHeight / 2;

    const isDark = this.themeMode() === 'dark';

    // ── 1. Ripple circular (solo visual, no cubre contenido) ──────
    const ripple = document.createElement('div');
    ripple.style.cssText = [
      'position:fixed;z-index:999999;pointer-events:none;border-radius:50%',
      `left:${centerX}px;top:${centerY}px`,
      'width:0;height:0',
      // Tinte sutil del color opuesto (blanco si oscuro, negro si claro)
      `background:radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'} 0%, transparent 70%)`,
      'transform:translate(-50%,-50%)',
    ].join(';');
    document.body.appendChild(ripple);

    // ── 2. Cambiar modo — las transiciones CSS hacen el fade ──────
    this.themeMode.update(m => (m === 'light' ? 'dark' : 'light'));

    // ── 3. Animar ripple: crece y se desvanece ────────────────────
    const start = performance.now();
    const DURATION = 500;

    function tick(now: number): void {
      const elapsed = now - start;
      const t = Math.min(elapsed / DURATION, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - t, 3);

      const size = eased * 2000; // crece hasta 2000px
      const opacity = 1 - eased; // se desvanece

      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.opacity = String(opacity);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        ripple.remove();
      }
    }
    requestAnimationFrame(tick);
  }

  isDark(): boolean {
    return this.themeMode() === 'dark';
  }

  // ── Persistencia ───────────────────────────────

  private get storageKey(): string {
    try {
      const authRaw = localStorage.getItem('user');
      if (authRaw) {
        const auth = JSON.parse(authRaw);
        if (auth?.id) return `${STORAGE_KEY_PREFIX}${auth.id}`;
      }
    } catch { /* ignore */ }
    return `${STORAGE_KEY_PREFIX}default`;
  }

  private _load(): UserSettings {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }

      // Migración: si hay settings guardados bajo la clave antigua
      // (ge-settings-default), migrarlos a la clave por usuario.
      if (this.storageKey !== `${STORAGE_KEY_PREFIX}default`) {
        const oldRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}default`);
        if (oldRaw) {
          localStorage.setItem(this.storageKey, oldRaw);
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}default`);
          const parsed = JSON.parse(oldRaw);
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
  }

  private _save(settings: UserSettings): void {
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
  }

  // ── Aplicar estilos ────────────────────────────

  private _applyFont(font: FontFamily): void {
    document.querySelectorAll('.theme-root').forEach(el => {
      el.classList.remove('font-inter', 'font-roboto', 'font-poppins');
      el.classList.add(`font-${font}`);
    });
  }

  private _applyFontSize(size: number): void {
    document.querySelectorAll('.theme-root').forEach(el => {
      el.classList.remove('text-size-xs', 'text-size-sm', 'text-size-base', 'text-size-lg', 'text-size-xl');
      const sizes = ['xs', 'sm', 'base', 'lg', 'xl'];
      const clamped = Math.max(0, Math.min(size, sizes.length - 1));
      el.classList.add(`text-size-${sizes[clamped]}`);
    });
  }

  private _applyHighContrast(enabled: boolean): void {
    document.querySelectorAll('.theme-root').forEach(el => {
      el.classList.toggle('high-contrast', enabled);
    });
  }

  private _applyThemeVars(themeId: string, mode: ThemeMode): void {
    const rootEls = document.querySelectorAll('.theme-root');
    if (rootEls.length === 0) return;
    const targets = Array.from(rootEls);

    if (themeId === 'default') {
      targets.forEach(el => { (el as HTMLElement).style.cssText = ''; });
      return;
    }

    const json = this.themeJsonCache.get(themeId);
    if (!json) {
      targets.forEach(el => { (el as HTMLElement).style.cssText = ''; });
      return;
    }

    const palette = json[mode];
    if (!palette) {
      targets.forEach(el => { (el as HTMLElement).style.cssText = ''; });
      return;
    }

    const vars = this._computeAllVars(palette, mode);

    this._applyVarsToDom(vars);
  }

  /** Aplica CSS variables pre-calculadas al DOM (sin depender del JSON del tema) */
  private _applyVarsToDom(vars: Record<string, string>): void {
    document.querySelectorAll('.theme-root').forEach(el => {
      const root = el as HTMLElement;
      root.style.cssText = '';
      for (const [name, value] of Object.entries(vars)) {
        root.style.setProperty(name, value);
      }
    });
  }

  private _clearThemeVars(): void {
    document.querySelectorAll('.theme-root').forEach(el => {
      (el as HTMLElement).style.cssText = '';
    });
  }

  // ── Calcular TODAS las variables de la app ─────
  private _computeAllVars(p: any, mode: 'light' | 'dark'): Record<string, string> {
    const brand = p.primary || '#3d6fe8';
    const shadowRgb = mode === 'light' ? '0, 0, 0' : '0, 0, 0';

    const brandLum = hexToRgb(brand);
    const brandLuminance = 0.299 * brandLum.r + 0.587 * brandLum.g + 0.114 * brandLum.b;

    const stat1 = brand;
    const stat2 = p.secondary || p.chart2 || brand;
    const stat3 = brandLuminance > 180 ? darken(brand, 0.3) : lighten(brand, 0.4);
    const stat4 = p.destructive || '#e8344a';

    const success = p.chart2 || p.secondary || '#18b87a';
    const warning = p.chart3 || p.accent || '#f5a623';
    const danger = p.destructive || '#e8344a';
    const brandAccent = brandLuminance > 180 ? darken(brand, 0.25) : brand;
    const hoverStrength = brandLuminance > 180 ? 0.2 : 0.08;

    return {
      '--bg-page': p.background || '#f0f4fc',
      '--bg-card': p.card || '#ffffff',
      '--bg-card-2': lighten(p.card || '#ffffff', 0.03),
      '--bg-header': p.sidebar || p.card || '#ffffff',
      '--bg-hover': rgba(brand, hoverStrength),
      '--bg-subtle': p.muted || '#f4f6fc',

      '--brand': brand,
      '--brand-dark': darken(brand, 0.15),
      '--brand-light': rgba(brand, 0.15),
      '--brand-muted': rgba(brand, 0.4),

      '--accent': p.secondary || p.chart2 || '#ff6b47',
      '--accent-dark': darken(p.secondary || p.chart2 || '#ff6b47', 0.15),
      '--accent-light': rgba(p.secondary || p.chart2 || '#ff6b47', 0.15),

      '--border': p.border || '#dde3f0',
      '--border-light': lighten(p.border || '#dde3f0', 0.1),
      '--color-border-focus': p.ring || brand,

      '--color-surface-raised': p.card || '#ffffff',
      '--color-surface-overlay': `rgba(0, 0, 0, ${mode === 'light' ? '0.55' : '0.7'})`,
      '--color-text-on-brand': getContrastText(brand),
      '--color-focus': `oklch(60% 0.15 258 / 0.45)`,

      '--text-primary': p.foreground || '#1a1f36',
      '--text-secondary': p.mutedForeground || '#5a6380',
      '--text-muted': p.mutedForeground || '#9099b8',
      '--text-inverse': getContrastText(brand),
      '--text-accent': brand,

      '--tab-active-bg': brandAccent,
      '--tab-active-txt': getContrastText(brandAccent),
      '--tab-hover-bg': rgba(brand, 0.1),
      '--tab-hover-txt': brand,

      '--stat-1': brandAccent,
      '--stat-2': stat2,
      '--stat-3': stat3,
      '--stat-4': stat4,
      '--text-on-stat-1': getContrastText(brandAccent),
      '--text-on-stat-2': getContrastText(stat2),
      '--text-on-stat-3': getContrastText(stat3),
      '--text-on-stat-4': getContrastText(stat4),

      '--btn-primary-bg': brandAccent,
      '--btn-primary-txt': getContrastText(brandAccent),
      '--btn-primary-hover': darken(brandAccent, 0.12),
      '--btn-primary-border': 'transparent',
      '--btn-secondary-bg': p.card || '#ffffff',
      '--btn-secondary-txt': p.foreground || '#1a1f36',
      '--btn-secondary-border': p.border || '#dde3f0',
      '--btn-secondary-hover': rgba(brand, 0.1),

      '--success': success,
      '--warning': warning,
      '--danger': danger,
      '--info': brand,
      '--text-on-success': getContrastText(success),
      '--text-on-warning': getContrastText(warning),
      '--text-on-danger': getContrastText(danger),

      '--shadow-sm': `0 2px 8px rgba(${shadowRgb}, ${mode === 'light' ? '0.08' : '0.3'})`,
      '--shadow-md': `0 4px 20px rgba(${shadowRgb}, ${mode === 'light' ? '0.12' : '0.4'})`,
      '--shadow-lg': `0 12px 40px rgba(${shadowRgb}, ${mode === 'light' ? '0.15' : '0.5'})`,
      '--shadow-accent': `0 4px 16px ${rgba(brand, mode === 'light' ? 0.2 : 0.3)}`,
      '--shadow-brand': `0 4px 16px ${rgba(brand, mode === 'light' ? 0.25 : 0.2)}`,

      '--toggle-bg': p.muted || '#ebf0ff',
      '--toggle-icon': brandAccent,
      '--toggle-border': p.border || '#dde3f0',
      '--toggle-active': brandAccent,
      '--toggle-inactive': mode === 'light' ? '#c0c0c0' : '#555870',
    };
  }

  // ── Helpers ────────────────────────────────────

  private async _fetchThemeJson(themeId: string): Promise<any> {
    const entry = THEME_ENTRIES.find(e => e.id === themeId);
    if (!entry) return null;
    try {
      const url = `/themes/${encodeURIComponent(entry.folder)}/${entry.file}`;
      const json = await firstValueFrom(this.http.get(url));
      this.themeJsonCache.set(themeId, json);
      return json;
    } catch {
      return null;
    }
  }

  private _detectDefaultMode(json: any): ThemeMode {
    if (!json?.light?.primary) return 'light';
    const color = json.light.primary;
    const { r, g, b } = hexToRgb(color);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 180 ? 'light' : 'dark';
  }
}
