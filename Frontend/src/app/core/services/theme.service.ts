import { Injectable, computed, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/**
 * ThemeService es ahora una CAPA DE COMPATIBILIDAD sobre SettingsService.
 * 
 * SettingsService es la única fuente de verdad para el modo claro/oscuro.
 * ThemeService solo existe para no tener que cambiar todos los templates
 * que usan `theme.toggle()`, `theme.isDark()` y `theme.theme()`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly settings = inject(SettingsService);

  /** Señal reactiva: 'light' | 'dark' — lee desde SettingsService que es la fuente de verdad */
  readonly theme = computed<'light' | 'dark'>(() => this.settings.themeMode());

  /** Cambia entre modo claro y oscuro delegando en SettingsService */
  toggle(): void {
    this.settings.toggleMode();
  }

  /** ¿Está en modo oscuro? */
  isDark(): boolean {
    return this.settings.isDark();
  }
}
