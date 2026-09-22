import { describe, expect, it } from 'vitest';

import { ViewLocationService } from './view-location-service';

describe('ViewLocationService order', () => {
  it('reorders containers within a location', () => {
    const service = new ViewLocationService();
    service.ensureRegistered('a', 'primary');
    service.ensureRegistered('b', 'primary');
    service.ensureRegistered('c', 'primary');
    expect(service.getOrder('primary')).toEqual(['a', 'b', 'c']);

    service.reorderContainer('c', 'a', 'before');
    expect(service.getOrder('primary')).toEqual(['c', 'a', 'b']);

    service.setContainerOrder('primary', ['b', 'c', 'a']);
    expect(service.getOrder('primary')).toEqual(['b', 'c', 'a']);
  });

  it('ignores moveContainer for unregistered ids', () => {
    const service = new ViewLocationService();
    service.ensureRegistered('a', 'primary');
    service.moveContainer('ghost', 'secondary');
    expect(service.getViewLocations()).toEqual({ a: 'primary' });
    expect(service.getOrder('secondary')).toEqual([]);
  });
});
