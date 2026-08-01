/**
 * Minimal DOM-like host so Preact can mount widget trees without a browser.
 * After render, walk the fake tree to recover element nodes for scene mapping.
 */

export interface HostNode {
  nodeType: number;
  nodeName: string;
  localName: string;
  ownerDocument: HostDocument;
  parentNode: HostNode | null;
  childNodes: HostNode[];
  textContent: string;
  /** Props Preact assigned onto the node. */
  __oxProps: Record<string, unknown>;
  style: Record<string, string>;
  firstChild: HostNode | null;
  lastChild: HostNode | null;
  nextSibling: HostNode | null;
  previousSibling: HostNode | null;
  appendChild(child: HostNode): HostNode;
  removeChild(child: HostNode): HostNode;
  remove(): void;
  insertBefore(child: HostNode, ref: HostNode | null): HostNode;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  addEventListener(_type: string, _listener: unknown): void;
  removeEventListener(_type: string, _listener: unknown): void;
  // Preact property setters land here for unknown tags
  [key: string]: unknown;
}

export interface HostDocument {
  nodeType: 9;
  nodeName: '#document';
  documentElement: HostNode | null;
  body: HostNode;
  defaultView: null;
  createElement(type: string): HostNode;
  createElementNS(_ns: string | null, type: string): HostNode;
  createTextNode(data: string): HostNode;
}

function linkSiblings(parent: HostNode): void {
  const kids = parent.childNodes;
  for (let i = 0; i < kids.length; i += 1) {
    const node = kids[i];
    if (!node) {
      continue;
    }
    node.previousSibling = kids[i - 1] ?? null;
    node.nextSibling = kids[i + 1] ?? null;
  }
  parent.firstChild = kids[0] ?? null;
  parent.lastChild = kids.at(-1) ?? null;
}

function createNode(
  nodeType: number,
  nodeName: string,
  ownerDocument: HostDocument
): HostNode {
  const node: HostNode = {
    nodeType,
    nodeName,
    localName: nodeName.toLowerCase(),
    ownerDocument,
    parentNode: null,
    childNodes: [],
    textContent: '',
    __oxProps: {},
    style: {},
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    previousSibling: null,
    appendChild(child: HostNode) {
      if (child.parentNode) {
        child.remove();
      }
      child.parentNode = node;
      node.childNodes.push(child);
      linkSiblings(node);
      return child;
    },
    removeChild(child: HostNode) {
      const index = node.childNodes.indexOf(child);
      if (index === -1) {
        throw new Error('Node is not a child');
      }
      node.childNodes.splice(index, 1);
      child.parentNode = null;
      child.nextSibling = null;
      child.previousSibling = null;
      linkSiblings(node);
      return child;
    },
    remove() {
      const parent = node.parentNode;
      if (!parent) {
        return;
      }
      const index = parent.childNodes.indexOf(node);
      if (index === -1) {
        return;
      }
      parent.childNodes.splice(index, 1);
      node.parentNode = null;
      node.nextSibling = null;
      node.previousSibling = null;
      linkSiblings(parent);
    },
    insertBefore(child: HostNode, ref: HostNode | null) {
      if (child.parentNode) {
        child.remove();
      }
      child.parentNode = node;
      if (!ref) {
        node.childNodes.push(child);
      } else {
        const index = node.childNodes.indexOf(ref);
        if (index === -1) {
          node.childNodes.push(child);
        } else {
          node.childNodes.splice(index, 0, child);
        }
      }
      linkSiblings(node);
      return child;
    },
    setAttribute(name: string, value: string) {
      node.__oxProps[name] = value;
    },
    removeAttribute(name: string) {
      delete node.__oxProps[name];
    },
    getAttribute(name: string) {
      const value = node.__oxProps[name];
      return value === null || value === undefined ? null : String(value);
    },
    hasAttribute(name: string) {
      return Object.hasOwn(node.__oxProps, name);
    },
    addEventListener() {
      // Events are handled via props (onClick) on the element tree, not DOM.
    },
    removeEventListener() {
      // no-op
    },
  };

  return new Proxy(node, {
    set(target, prop, value) {
      if (typeof prop === 'string') {
        if (
          prop === 'parentNode' ||
          prop === 'childNodes' ||
          prop === 'textContent' ||
          prop === 'firstChild' ||
          prop === 'lastChild' ||
          prop === 'nextSibling' ||
          prop === 'previousSibling' ||
          prop === 'style' ||
          prop === '__oxProps'
        ) {
          Reflect.set(target, prop, value);
          return true;
        }
        // Preact assigns unknown props onto the DOM node.
        target.__oxProps[prop] = value;
        Reflect.set(target, prop, value);
        return true;
      }
      return Reflect.set(target, prop, value);
    },
  });
}

export function createHostDocument(): HostDocument {
  const doc = {
    nodeType: 9 as const,
    nodeName: '#document',
    documentElement: null as HostNode | null,
    body: null as unknown as HostNode,
    defaultView: null,
    createElement(type: string) {
      return createNode(1, type, doc as HostDocument);
    },
    createElementNS(_ns: string | null, type: string) {
      return createNode(1, type, doc as HostDocument);
    },
    createTextNode(data: string) {
      const text = createNode(3, '#text', doc as HostDocument);
      text.textContent = data;
      return text;
    },
  };
  doc.body = createNode(1, 'body', doc as HostDocument);
  doc.documentElement = createNode(1, 'html', doc as HostDocument);
  return doc as HostDocument;
}

export function createHostContainer(
  doc: HostDocument = createHostDocument()
): HostNode {
  return doc.createElement('openenvx-root');
}
