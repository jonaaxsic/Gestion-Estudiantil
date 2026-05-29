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
      <div class="ge-tabs-scroll">
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
    </div>
  `,
  styles: [
    `
      .ge-tabs-wrapper {
        padding: 20px 0 0;
        background: transparent;
      }

      .ge-tabs-scroll {
        overflow-x: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
      }

      .ge-tabs-scroll::-webkit-scrollbar {
        display: none;
      }

      .ge-tabs {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 36px;
        margin-bottom: 0;
      }

      .ge-tab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 20px;
        border: none;
        border-radius: var(--radius-sm);
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-secondary);
        background: transparent;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        font-family: inherit;
        line-height: 1;
        transition:
          background-color var(--dur-fast) var(--ease-out),
          color var(--dur-fast) var(--ease-out),
          box-shadow var(--dur-fast) var(--ease-out);
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

      @media (max-width: 1024px) {
        .ge-tabs-wrapper {
          padding: 16px 0 0;
        }
      }

      @media (max-width: 768px) {
        .ge-tabs-wrapper {
          padding: 14px 0 0;
        }

        .ge-tabs {
          padding: 5px 32px;
          gap: 3px;
        }

        .ge-tab {
          padding: 11px 16px;
          font-size: 0.88rem;
        }

        .ge-tab-icon {
          font-size: 16px;
        }
      }

      @media (max-width: 499px) {
        .ge-tabs-wrapper {
          padding: 12px 0 0;
        }

        .ge-tabs {
          padding: 4px 20px;
        }

        .ge-tab {
          padding: 10px 14px;
        }

        /* Opción A: ocultar texto del tab, solo íconos visibles */
        .ge-tab-label {
          display: none;
        }

        .ge-tab-icon {
          font-size: 22px;
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
