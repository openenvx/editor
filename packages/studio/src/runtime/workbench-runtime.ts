import type { ContextKeyContribution } from '../contributions/context-key-contribution';
import { LocalizationServiceImpl } from '../i18n/localization-service';
import { LocalizationServiceId } from '../i18n/localization-service-id';
import {
  MenuChoiceRegistryImpl,
  MenuChoiceRegistryId,
} from '../menu/menu-choice-registry';
import { WorkbenchThemeMenuChoiceProvider } from '../menu/workbench-theme-menu-choice-provider';
import { DisposableStore } from '../runtime/emitter';
import { InstantiationService } from '../runtime/instantiation-service';
import type { CommandContext } from '../runtime/types';
import {
  WorkbenchEventService,
  WorkbenchEvents,
} from '../runtime/workbench-events';
import type { EventBus } from '../runtime/workbench-events';
import { ContextKeyServiceId } from '../tokens';
import type { ContextKeyService } from '../workbench/context-key-service';
import { createContextKeyService } from '../workbench/context-key-service';
import {
  EditorViewportServiceImpl,
  EditorViewportServiceId,
} from '../workbench/editor-viewport-service';
import { IconRegistryImpl } from '../workbench/icon-registry-service';
import { IconRegistryId } from '../workbench/icon-registry-service-id';
import { ThemeServiceImpl } from '../workbench/theme-service';
import { ThemeServiceId } from '../workbench/theme-service-id';

/** Headless workbench host: DI, commands, context keys. No document. */
export class WorkbenchRuntime {
  readonly services = new InstantiationService();
  private readonly contextKeyContributions: ContextKeyContribution[] = [];
  private readonly disposables = new DisposableStore();
  private readonly contextKeys = createContextKeyService();
  private readonly events = new WorkbenchEventService();

  constructor() {
    this.installCoreServices();
    this.wireEvents();
  }

  registerContextKeyContribution(contribution: ContextKeyContribution): void {
    this.contextKeyContributions.push(contribution);
  }

  private installCoreServices(): void {
    this.services.registerInstance(ContextKeyServiceId, this.contextKeys);
    this.services.registerInstance(
      EditorViewportServiceId,
      new EditorViewportServiceImpl()
    );
    this.services.registerInstance(
      LocalizationServiceId,
      new LocalizationServiceImpl()
    );
    const localization = this.services.get(LocalizationServiceId);
    const menuChoiceRegistry = new MenuChoiceRegistryImpl();
    const themeService = new ThemeServiceImpl();
    this.services.registerInstance(MenuChoiceRegistryId, menuChoiceRegistry);
    this.services.registerInstance(ThemeServiceId, themeService);
    menuChoiceRegistry.register(
      new WorkbenchThemeMenuChoiceProvider(themeService, localization)
    );
    this.services.registerInstance(IconRegistryId, new IconRegistryImpl());
    this.disposables.add(
      localization.onDidChangeLocale((locale) => {
        this.events.emit(WorkbenchEvents.DidChangeLocale, locale);
      })
    );
  }

  private wireEvents(): void {
    this.disposables.add(
      this.contextKeys.onDidChangeContext(() => {
        this.events.emit(WorkbenchEvents.DidChangeContext);
      })
    );
  }

  syncContextKeys(): void {
    const ctx = this.createCommandContext();
    for (const contribution of this.contextKeyContributions) {
      const value = contribution.evaluate(ctx);
      this.contextKeys.set(contribution.key, value);
    }
  }

  getEvents(): EventBus {
    return this.events;
  }

  getContextKeys(): ContextKeyService {
    return this.contextKeys;
  }

  createCommandContext(): CommandContext {
    return {
      events: this.events,
      services: this.services,
    };
  }

  dispose(): void {
    this.disposables.dispose();
    this.contextKeys.dispose();
    this.events.dispose();
  }
}

/** @deprecated Use {@link WorkbenchRuntime}. */
export const EditorRuntime = WorkbenchRuntime;
