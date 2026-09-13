import { describe, expect, it } from 'vitest';

import { MAX_SHOW_UI_HTML_CHARS } from '../sandbox-caps';
import {
  REACT_SHOWUI_DEMO_HTML,
  REACT_SHOWUI_DEMO_ISOLATE_SOURCE,
} from './react-showui-demo';

describe('react showUI demo fixture', () => {
  it('fits under showUI HTML cap and wires duplex helpers', () => {
    expect(REACT_SHOWUI_DEMO_HTML.length).toBeLessThan(MAX_SHOW_UI_HTML_CHARS);
    expect(REACT_SHOWUI_DEMO_HTML).toContain('postPluginMessage');
    expect(REACT_SHOWUI_DEMO_HTML).toContain('onPluginMessage');
    expect(REACT_SHOWUI_DEMO_HTML).toContain('onPluginContext');
    expect(REACT_SHOWUI_DEMO_ISOLATE_SOURCE).toContain('openenvx.ui.postMessage');
    expect(REACT_SHOWUI_DEMO_ISOLATE_SOURCE).toContain('openenvx.showUI');
  });
});
