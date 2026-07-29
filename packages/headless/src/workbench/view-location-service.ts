import type { ViewContainerLocation } from '../contributions/view-contribution';

type Listener = () => void;

/**
 * Tracks default vs current location per view container, per-location order,
 * and the active container in each location (VS Code ViewDescriptorService analogue).
 */
export class ViewLocationService {
  private readonly defaults = new Map<string, ViewContainerLocation>();
  private readonly locations = new Map<string, ViewContainerLocation>();
  private readonly orders: Record<ViewContainerLocation, string[]> = {
    primary: [],
    secondary: [],
  };
  private readonly activeByLocation: Record<
    ViewContainerLocation,
    string | null
  > = {
    primary: null,
    secondary: null,
  };
  private readonly listeners = new Set<Listener>();
  private viewLocationsSnapshot: Record<string, ViewContainerLocation> = {};
  private ordersSnapshot: Record<ViewContainerLocation, string[]> = {
    primary: [],
    secondary: [],
  };
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
      this.appendToOrder(defaultLocation, containerId);
      this.invalidateViewLocationsSnapshot();
      this.invalidateOrdersSnapshot();
    }
    const location = this.getLocation(containerId);
    if (this.activeByLocation[location] === null) {
      this.activeByLocation[location] = containerId;
      this.invalidateActiveSnapshot();
    }
  }

  hasContainer(containerId: string): boolean {
    return this.defaults.has(containerId);
  }

  getLocation(containerId: string): ViewContainerLocation {
    return this.locations.get(containerId) ?? 'primary';
  }

  getDefaultLocation(containerId: string): ViewContainerLocation {
    return this.defaults.get(containerId) ?? 'primary';
  }

  moveContainer(containerId: string, location: ViewContainerLocation): void {
    if (!this.defaults.has(containerId)) {
      return;
    }
    const previous = this.getLocation(containerId);
    if (previous === location) {
      return;
    }
    this.removeFromOrder(previous, containerId);
    this.locations.set(containerId, location);
    this.appendToOrder(location, containerId);
    this.invalidateViewLocationsSnapshot();
    this.invalidateOrdersSnapshot();
    if (this.activeByLocation[previous] === containerId) {
      this.activeByLocation[previous] = this.orders[previous][0] ?? null;
      this.invalidateActiveSnapshot();
    }
    if (this.activeByLocation[location] === null) {
      this.activeByLocation[location] = containerId;
      this.invalidateActiveSnapshot();
    }
    this.notify();
  }

  /**
   * Reorder a container within its current location.
   * `targetId` is the neighbor; `position` places the source before/after it.
   */
  reorderContainer(
    containerId: string,
    targetId: string,
    position: 'before' | 'after'
  ): void {
    if (containerId === targetId) {
      return;
    }
    const location = this.getLocation(containerId);
    if (this.getLocation(targetId) !== location) {
      return;
    }
    const order = this.orders[location];
    const fromIndex = order.indexOf(containerId);
    const targetIndex = order.indexOf(targetId);
    if (fromIndex === -1 || targetIndex === -1) {
      return;
    }
    order.splice(fromIndex, 1);
    let insertIndex = order.indexOf(targetId);
    if (insertIndex === -1) {
      order.push(containerId);
    } else {
      if (position === 'after') {
        insertIndex += 1;
      }
      order.splice(insertIndex, 0, containerId);
    }
    this.invalidateOrdersSnapshot();
    this.notify();
  }

  /** Replace the ordered id list for a location (used by drag-and-drop). */
  setContainerOrder(
    location: ViewContainerLocation,
    orderedIds: string[]
  ): void {
    const known = new Set(
      [...this.locations.entries()]
        .filter(([, loc]) => loc === location)
        .map(([id]) => id)
    );
    const next = orderedIds.filter((id) => known.has(id));
    for (const id of known) {
      if (!next.includes(id)) {
        next.push(id);
      }
    }
    const prev = this.orders[location];
    if (
      prev.length === next.length &&
      prev.every((id, index) => id === next[index])
    ) {
      return;
    }
    this.orders[location] = next;
    this.invalidateOrdersSnapshot();
    this.notify();
  }

  getOrder(location: ViewContainerLocation): string[] {
    return this.ordersSnapshot[location];
  }

  getOrders(): Record<ViewContainerLocation, string[]> {
    return this.ordersSnapshot;
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

  private appendToOrder(
    location: ViewContainerLocation,
    containerId: string
  ): void {
    if (!this.orders[location].includes(containerId)) {
      this.orders[location].push(containerId);
    }
  }

  private removeFromOrder(
    location: ViewContainerLocation,
    containerId: string
  ): void {
    const order = this.orders[location];
    const index = order.indexOf(containerId);
    if (index !== -1) {
      order.splice(index, 1);
    }
  }

  private invalidateViewLocationsSnapshot(): void {
    this.viewLocationsSnapshot = Object.fromEntries(this.locations);
  }

  private invalidateOrdersSnapshot(): void {
    this.ordersSnapshot = {
      primary: [...this.orders.primary],
      secondary: [...this.orders.secondary],
    };
  }

  private invalidateActiveSnapshot(): void {
    this.activeByLocationSnapshot = { ...this.activeByLocation };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
