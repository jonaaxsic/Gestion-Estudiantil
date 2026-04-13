// shared-tabs.component.ts – NUEVA VERSIÓN SIN MATERIAL
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: "app-shared-tabs",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ge-tabs-wrapper">
      <div class="ge-tabs" role="tablist">
        @for (tab of tabs; track tab.id) {
          <button
            class="ge-tab"
            [class.active]="isActive(tab.id)"
            role="tab"
            [attr.aria-selected]="isActive(tab.id)"
            (click)="selectTab(tab.id)"
          >
            @if (tab.icon) {
              <span class="material-icons ge-tab-icon">{{ tab.icon }}</span>
            }
            <span class="ge-tab-label">{{ tab.label }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .ge-tabs-wrapper {
        padding: 16px 20px 0;
        background: transparent;
      }

      .ge-tabs {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 5px;
        overflow-x: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
        margin-bottom: 0;
      }

      .ge-tabs::-webkit-scrollbar {
        display: none;
      }

      .ge-tab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 16px;
        border: none;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        background: transparent;
        cursor: pointer;
        transition: all 0.18s ease;
        white-space: nowrap;
        flex-shrink: 0;
        font-family: inherit;
        line-height: 1;
      }

      .ge-tab:hover {
        background: var(--tab-hover-bg);
        color: var(--tab-hover-txt);
      }

      .ge-tab.active {
        background: var(--tab-active-bg);
        color: var(--tab-active-txt);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }

      .ge-tab-icon {
        font-size: 17px;
        line-height: 1;
      }

      .ge-tab-label {
        line-height: 1;
      }

      @media (max-width: 768px) {
        .ge-tabs-wrapper {
          padding: 12px 14px 0;
        }

        .ge-tabs {
          padding: 4px;
          gap: 2px;
          border-radius: var(--radius-sm);
        }

        .ge-tab {
          padding: 9px 14px;
          font-size: 0.82rem;
        }

        .ge-tab-icon {
          font-size: 15px;
        }
      }

      @media (max-width: 480px) {
        .ge-tab {
          padding: 8px 11px;
          font-size: 0.78rem;
        }

        .ge-tab-icon {
          display: none;
        }
      }
    `,
  ],
})
export class SharedTabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() selectedIndex = 0;
  @Output() tabChanged = new EventEmitter<string>();

  isActive(tabId: string): boolean {
    return this.tabs[this.selectedIndex]?.id === tabId;
  }

  selectTab(tabId: string): void {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      this.selectedIndex = index;
      this.tabChanged.emit(tabId);
    }
  }
}