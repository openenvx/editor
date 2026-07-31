/**
 * Minimal React-in-showUI demo (no CDN).
 * Ships a tiny createElement + useState runtime so authors see the contract;
 * production plugins bundle real React the same way inside `showUI` HTML.
 *
 * Duplex: iframe `postPluginMessage` / `onPluginMessage` ↔ isolate
 * `openenvx.ui.onmessage` / `openenvx.ui.postMessage`.
 */

export const REACT_SHOWUI_DEMO_HTML = `<div id="root"></div>
<script>
(function () {
  var hooks = [];
  var cursor = 0;
  var root = null;
  var tree = null;

  function schedule() {
    cursor = 0;
    var next = tree();
    root.innerHTML = '';
    root.appendChild(next);
  }

  function useState(initial) {
    var i = cursor++;
    if (hooks[i] === undefined) {
      hooks[i] = typeof initial === 'function' ? initial() : initial;
    }
    var set = function (value) {
      hooks[i] = typeof value === 'function' ? value(hooks[i]) : value;
      schedule();
    };
    return [hooks[i], set];
  }

  function createElement(type, props) {
    props = props || {};
    var children = Array.prototype.slice.call(arguments, 2);
    if (typeof type === 'function') {
      return type(Object.assign({}, props, { children: children }));
    }
    var el = document.createElement(type);
    Object.keys(props).forEach(function (key) {
      if (key === 'children' || key === 'style') return;
      if (key === 'className') {
        el.className = props[key];
        return;
      }
      if (key.indexOf('on') === 0 && typeof props[key] === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), props[key]);
        return;
      }
      el.setAttribute(key, props[key]);
    });
    if (props.style && typeof props.style === 'object') {
      Object.assign(el.style, props.style);
    }
    children.flat().forEach(function (child) {
      if (child == null || child === false) return;
      el.appendChild(
        typeof child === 'string' || typeof child === 'number'
          ? document.createTextNode(String(child))
          : child
      );
    });
    return el;
  }

  function App() {
    var countState = useState(0);
    var count = countState[0];
    var setCount = countState[1];
    var themeState = useState('dark');
    var theme = themeState[0];
    var setTheme = themeState[1];

    window.onPluginMessage = function (msg) {
      if (msg && msg.type === 'pong') {
        setCount(function (n) { return n + 1; });
      }
    };
    window.onPluginContext = function (ctx) {
      if (ctx && ctx.theme) setTheme(ctx.theme);
    };

    return createElement(
      'div',
      {
        style: {
          padding: '12px',
          color: theme === 'dark' ? '#f8fafc' : '#111',
          background: theme === 'dark' ? '#111827' : '#f8fafc',
          height: '100%',
          boxSizing: 'border-box',
          fontFamily: 'system-ui,sans-serif',
        },
      },
      createElement('strong', null, 'React-style showUI demo'),
      createElement('p', { style: { margin: '8px 0', opacity: 0.8 } },
        'Theme: ' + theme + ' · pongs: ' + count
      ),
      createElement(
        'button',
        {
          type: 'button',
          style: { padding: '6px 10px', cursor: 'pointer' },
          onClick: function () {
            window.postPluginMessage({ type: 'ping', at: Date.now() });
          },
        },
        'Ping isolate'
      )
    );
  }

  root = document.getElementById('root');
  tree = App;
  schedule();
})();
</script>`;

/** Isolate source paired with REACT_SHOWUI_DEMO_HTML. */
export const REACT_SHOWUI_DEMO_ISOLATE_SOURCE = `
openenvx.ui.onmessage = function (msg) {
  if (msg && msg.type === 'ping') {
    openenvx.notify('ping received');
    openenvx.ui.postMessage({ type: 'pong' });
  }
};
openenvx.showUI(${JSON.stringify(REACT_SHOWUI_DEMO_HTML)}, { width: 320, height: 200 });
`;
