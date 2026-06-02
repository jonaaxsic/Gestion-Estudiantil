import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-shared-header",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header-bar">
      <div class="header-left">
        <button class="btn-icon mobile-menu-btn" (click)="menuToggled.emit()">
          <span class="material-icons">menu</span>
        </button>
        <span class="material-icons header-icon">{{ icon }}</span>
        <h1 class="header-title">{{ title }}</h1>
      </div>
      <div class="header-right">
        <button
          class="btn-theme-toggle"
          (click)="themeToggled.emit()"
          [title]="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        >
          <span class="material-icons">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
        </button>
        <button class="btn-logout" (click)="logout.emit()">
          <span class="material-icons">logout</span>
          <span class="btn-text">Cerrar</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 32px;
        background: var(--bg-card);
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 0;
        z-index: 50;
        gap: 12px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .header-icon {
        color: var(--brand);
        font-size: 26px;
        line-height: 1;
        display: inline-flex;
      }

      .header-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
        white-space: nowrap;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: nowrap;
      }

      .btn-theme-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--radius-pill);
        border: none;
        background: var(--bg-subtle);
        color: var(--text-secondary);
        cursor: pointer;
        transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-spring);
        font-family: inherit;
      }

      .btn-theme-toggle:hover {
        background: var(--brand-light);
        color: var(--brand);
        transform: scale(1.05);
      }

      .btn-theme-toggle:active {
        transform: scale(0.95);
      }

      .btn-theme-toggle .material-icons {
        font-size: 20px;
        line-height: 1;
      }

      .btn-logout {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-pill);
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-out);
        font-family: inherit;
        white-space: nowrap;
      }

      .btn-logout:hover {
        background: var(--danger);
        color: var(--text-on-danger);
        border-color: var(--danger);
        transform: translateY(-1px);
      }

      .btn-logout:active {
        transform: translateY(0);
      }

      .btn-logout .material-icons {
        font-size: 18px;
        line-height: 1;
      }

      .mobile-menu-btn {
        display: none;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--radius-pill);
        border: none;
        background: var(--bg-subtle);
        color: var(--text-secondary);
        cursor: pointer;
        transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-spring);
        font-family: inherit;
        flex-shrink: 0;
      }

      .mobile-menu-btn:hover {
        background: var(--brand-light);
        color: var(--brand);
        transform: scale(1.05);
      }

      .mobile-menu-btn:active {
        transform: scale(0.95);
      }

      .mobile-menu-btn .material-icons {
        font-size: 22px;
        line-height: 1;
      }

      .btn-text {
        display: inline;
      }

      @media (max-width: 1024px) {
        .header-bar {
          padding: 12px 20px;
        }
        .mobile-menu-btn { display: flex; }
        .btn-text { display: none; }
      }

      @media (max-width: 768px) {
        .header-bar {
          padding: 12px 14px;
        }
        .header-title {
          font-size: 1rem;
        }
        .header-icon {
          font-size: 22px;
        }
      }
    `,
  ],
})
export class SharedHeaderComponent {
  @Input() title = "";
  @Input() icon = "school";
  @Input() isDark = false;
  @Output() menuToggled = new EventEmitter<void>();
  @Output() themeToggled = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
}
