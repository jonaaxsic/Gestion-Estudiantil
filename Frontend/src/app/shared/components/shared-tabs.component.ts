// shared-tabs.component.ts – Scroll arrows + avatar-ready
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from "@angular/core";
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
      <div class="ge-tabs-scroll" #scrollContainer (scroll)="updateArrowVisibility()">
        <button
          class="ge-scroll-arrow left"
          [class.visible]="showLeftArrow"
          (click)="scrollTabs(-200)"
          aria-label="Desplazar tabs a la izquierda"
        >
          <span class="material-icons">chevron_left</span>
        </button>
        <div class="ge-tabs" role="tablist" #tabsContainer>
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
        <button
          class="ge-scroll-arrow right"
          [class.visible]="showRightArrow"
          (click)="scrollTabs(200)"
          aria-label="Desplazar tabs a la derecha"
        >
          <span class="material-icons">chevron_right</span>
        </button>
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
        position: relative;
        display: flex;
        align-items: center;
        overflow-x: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 0;
      }

      .ge-tabs-scroll::-webkit-scrollbar {
        display: none;
      }

      .ge-scroll-arrow {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        border: none;
        background: linear-gradient(90deg, var(--bg-card) 60%, transparent);
        color: var(--text-secondary);
        cursor: pointer;
        opacity: 0;
        transition:
          opacity var(--dur-fast) var(--ease-out),
          color var(--dur-fast) var(--ease-out);
        font-family: inherit;
        pointer-events: none;
      }

      .ge-scroll-arrow.visible {
        opacity: 1;
        pointer-events: auto;
      }

      .ge-scroll-arrow:hover {
        color: var(--brand);
      }

      .ge-scroll-arrow .material-icons {
        font-size: 22px;
      }

      .ge-scroll-arrow.left {
        left: 0;
        background: linear-gradient(90deg, var(--bg-card) 60%, transparent);
        padding-right: 8px;
        border-radius: var(--radius-md) 0 0 var(--radius-md);
      }

      .ge-scroll-arrow.right {
        right: 0;
        background: linear-gradient(270deg, var(--bg-card) 60%, transparent);
        padding-left: 8px;
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
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

      @media (max-width: 480px) {
        .ge-tabs-wrapper {
          padding: 12px 0 0;
        }

        .ge-tabs {
          padding: 4px 28px;
        }

        .ge-tab {
          padding: 10px 12px;
          font-size: 0.85rem;
        }
      }
    `,
  ],
})
export class SharedTabsComponent implements AfterViewInit, OnDestroy {
  @Input() tabs: TabItem[] = [];
  @Input() selectedIndex = 0;
  @Output() tabChanged = new EventEmitter<string>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('tabsContainer') tabsContainer!: ElementRef;

  showLeftArrow = false;
  showRightArrow = false;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.updateArrowVisibility();
    this.resizeObserver = new ResizeObserver(() => this.updateArrowVisibility());
    this.resizeObserver.observe(this.scrollContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  updateArrowVisibility(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    this.showLeftArrow = el.scrollLeft > 10;
    this.showRightArrow = el.scrollLeft < el.scrollWidth - el.clientWidth - 10;
  }

  scrollTabs(offset: number): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  }

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