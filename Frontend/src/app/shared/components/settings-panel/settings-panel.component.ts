import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService, FontFamily } from '../../../core/services/settings.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.css'],
})
export class SettingsPanelComponent {
  private settingsService = inject(SettingsService);
  private api = inject(ApiService);
  readonly auth = inject(AuthService);

  @Input() role: 'apoderado' | 'docente' | 'inspector' | 'administrador' = 'apoderado';

  activeTab: 'apariencia' | 'cuenta' | 'notificaciones' | 'sistema' = 'apariencia';

  // Formulario cambio de contraseña
  passwordForm = { current: '', newPass: '', confirm: '' };
  passwordError = '';
  passwordSuccess = '';
  saving = false;

  // Config establecimiento (solo admin)
  configForm: any = {};
  configLoaded = false;

  readonly isAdmin = () => this.role === 'administrador';

  get themes() { return this.settingsService.availableThemes(); }
  get settings() { return this.settingsService.settings(); }

  // ── Apariencia ───────────────────────────────────────

  appearanceSaved = false;

  selectTheme(themeId: string) {
    this.settingsService.selectTheme(themeId);
  }

  selectFont(font: FontFamily) {
    this.settingsService.updateSettings({ font });
  }

  selectFontSize(size: number) {
    this.settingsService.updateSettings({ fontSize: size });
  }

  toggleHighContrast() {
    this.settingsService.updateSettings({ highContrast: !this.settings.highContrast });
  }

  saveAppearance() {
    // Las settings ya se guardan solas en localStorage via el effect.
    // Este botón es solo confirmación visual.
    this.appearanceSaved = true;
    setTimeout(() => this.appearanceSaved = false, 3000);
  }

  toggleNotification(type: 'email' | 'browser') {
    const n = { ...this.settings.notifications };
    n[type] = !n[type];
    this.settingsService.updateSettings({ notifications: n });
  }

  // ── Cuenta ───────────────────────────────────────────

  passwordsVisible = { current: false, newPass: false, confirm: false };

  togglePasswordVisibility(field: 'current' | 'newPass' | 'confirm') {
    this.passwordsVisible[field] = !this.passwordsVisible[field];
  }

  changePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    const { current, newPass, confirm } = this.passwordForm;

    if (!current || !newPass || !confirm) {
      this.passwordError = 'Todos los campos son obligatorios';
      return;
    }

    if (newPass.length < 8) {
      this.passwordError = 'La nueva contraseña debe tener al menos 8 caracteres';
      return;
    }

    if (newPass !== confirm) {
      this.passwordError = 'Las contraseñas nuevas no coinciden';
      return;
    }

    const user = this.auth.user();
    if (!user?.id) {
      this.passwordError = 'No se pudo identificar al usuario';
      return;
    }

    this.saving = true;
    this.api.changePassword(user.id, current, newPass).subscribe({
      next: () => {
        this.saving = false;
        this.passwordSuccess = 'Contraseña actualizada correctamente';
        this.passwordForm = { current: '', newPass: '', confirm: '' };
        setTimeout(() => this.passwordSuccess = '', 3000);
      },
      error: (err: any) => {
        this.saving = false;
        this.passwordError = err?.error?.error || 'Error al cambiar la contraseña';
      },
    });
  }

  // ── Sistema (admin) ──────────────────────────────────

  loadConfigEstablecimiento() {
    if (this.configLoaded) return;
    this.api.getConfiguracionEstablecimiento().subscribe({
      next: (data) => {
        this.configForm = { ...data };
        this.configLoaded = true;
      },
      error: () => {
        this.configForm = {};
        this.configLoaded = true;
      },
    });
  }

  saveConfigEstablecimiento() {
    this.api.updateConfiguracionEstablecimiento(this.configForm).subscribe({
      next: () => {
        this.passwordSuccess = 'Configuración guardada correctamente';
        setTimeout(() => this.passwordSuccess = '', 3000);
      },
      error: (err: any) => {
        this.passwordError = err?.error?.error || 'Error al guardar configuración';
      },
    });
  }

  // ── Utilidades ───────────────────────────────────────

  getPasswordStrength(pass: string): { label: string; class: string } {
    if (!pass) return { label: '', class: '' };
    if (pass.length < 8) return { label: 'Débil', class: 'weak' };
    if (pass.length < 10) return { label: 'Media', class: 'medium' };
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    if (hasUpper && hasNumber) return { label: 'Fuerte', class: 'strong' };
    return { label: 'Media', class: 'medium' };
  }

  readonly fonts: { id: FontFamily; label: string }[] = [
    { id: 'inter', label: 'Inter' },
    { id: 'roboto', label: 'Roboto' },
    { id: 'poppins', label: 'Poppins' },
  ];

  readonly fontSizeOptions: { value: number; label: string }[] = [
    { value: 0, label: 'XS' },
    { value: 1, label: 'Sm' },
    { value: 2, label: 'Base' },
    { value: 3, label: 'Lg' },
    { value: 4, label: 'XL' },
  ];
}
