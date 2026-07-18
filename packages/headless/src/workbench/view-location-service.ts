import type { ViewContainerLocation } from '../contributions/view-contribution';

type Listener = () => void;

/**
 * Tracks default vs current location per view container and the active
 * container in each location (VS Code ViewDescriptorService analogue).
 */
export class ViewLocationService {
  private readonly defaults = new Map<string, ViewContainerLocation>();
  private readonly locations = new Map<string, ViewContainerLocation>();
  private readonly activeByLocation: Record<
    ViewContainerLocation,
    string | null
  > = {
    primary: null,
    secondary: null,
  };
  private readonly listeners = new Set<Listener>();
  private viewLocationsSnapshot: Record<string, ViewContainerLocation> = {};
  private activeByLocationSnapshot: Record<
    ViewContainerLocation,
    string | null
  > = {
    primary: null,
    secondary: null,
  };

  ensureRegistered(
    containerId: string,
    defaultLocation: ViewContainerLocation
  ): void {
    if (!this.defaults.has(containerId)) {
      this.defaults.set(containerId, defaultLocation);
      this.locations.set(containerId, defaultLocation);
      this.invalidateViewLocationsSnapshot();
    }
    const location = this.getLocation(containerId);
    if (this.activeByLocation[location] === null) {
      this.activeByLocation[location] = containerId;
      this.invalidateActiveSnapshot();
    }
  }

  getLocation(containerId: string): ViewContainerLocation {
    return this.locations.get(containerId) ?? 'primary';
  }

  getDefaultLocation(containerId: string): ViewContainerLocation {
    return this.defaults.get(containerId) ?? 'primary';
  }

  moveContainer(containerId: string, location: ViewContainerLocation): void {
    const previous = this.getLocation(containerId);
    if (previous === location) {
      return;
    }
    this.locations.set(containerId, location);
    this.invalidateViewLocationsSnapshot();
    if (this.activeByLocation[previous] === containerId) {
      this.activeByLocation[previous] =
        this.findFirstInLocation(previous, containerId) ?? null;
      this.invalidateActiveSnapshot();
    }
    if (this.activeByLocation[location] === null) {
      this.activeByLocation[location] = containerId;
      this.invalidateActiveSnapshot();
    }
    this.notify();
  }

  getActiveContainer(location: ViewContainerLocation): string | null {
    return this.activeByLocation[location];
  }

  setActiveContainer(
    location: ViewContainerLocation,
    containerId: string
  ): void {
    if (this.getLocation(containerId) !== location) {
      return;
    }
    if (this.activeByLocation[location] === containerId) {
      return;
    }
    this.activeByLocation[location] = containerId;
    this.invalidateActiveSnapshot();
    this.notify();
  }

  getViewLocations(): Record<string, ViewContainerLocation> {
    return this.viewLocationsSnapshot;
  }

  getActiveContainerByLocation(): Record<ViewContainerLocation, string | null> {
    return this.activeByLocationSnapshot;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private invalidateViewLocationsSnapshot(): void {
    this.viewLocationsSnapshot = Object.fromEntries(this.locations);
  }

  private invalidateActiveSnapshot(): void {
    this.activeByLocationSnapshot = { ...this.activeByLocation };
  }

  private findFirstInLocation(
    location: ViewContainerLocation,
    excludeId?: string
  ): string | undefined {
    for (const [id, loc] of this.locations) {
      if (loc === location && id !== excludeId) {
        return id;
      }
    }
    return undefined;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
