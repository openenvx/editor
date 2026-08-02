import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Code2,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Strikethrough,
  Underline,
} from 'lucide-react';
import {
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import styles from './html-editor-pane.module.css';

/** Bubble portals to body — copy shell theme so `--wb-*` tokens resolve. */
function readDocumentTheme(): string {
  const scoped = document.querySelector('[data-owb-theme]');
  return scoped instanceof HTMLElement
    ? (scoped.dataset.owbTheme ?? 'light')
    : 'light';
}

function subscribeDocumentTheme(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-owb-theme'],
    subtree: true,
  });
  return () => observer.disconnect();
}

type BlockFormat =
  | 'paragraph'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'codeBlock';

const BLOCK_OPTIONS: {
  format: BlockFormat;
  label: string;
  icon: ReactNode;
}[] = [
  { format: 'paragraph', label: 'Text', icon: <Pilcrow size={14} /> },
  { format: 'bulletList', label: 'Bullet List', icon: <List size={14} /> },
  {
    format: 'orderedList',
    label: 'Numbered List',
    icon: <ListOrdered size={14} />,
  },
  { format: 'blockquote', label: 'Quote', icon: <Quote size={14} /> },
  { format: 'codeBlock', label: 'Code', icon: <Code2 size={14} /> },
];

function FormatButton({
  active,
  label,
  onPress,
  children,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`${styles.formatButton} ${active ? styles.formatButtonActive : ''}`}
      onMouseDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className={styles.bubbleMenuDivider} />;
}

function activeBlockFormat(editor: Editor): BlockFormat {
  if (editor.isActive('bulletList')) {
    return 'bulletList';
  }
  if (editor.isActive('orderedList')) {
    return 'orderedList';
  }
  if (editor.isActive('blockquote')) {
    return 'blockquote';
  }
  if (editor.isActive('codeBlock')) {
    return 'codeBlock';
  }
  return 'paragraph';
}

function applyBlockFormat(editor: Editor, format: BlockFormat) {
  const chain = editor.chain().focus();
  switch (format) {
    case 'paragraph': {
      chain.setParagraph().run();
      break;
    }
    case 'bulletList': {
      chain.toggleBulletList().run();
      break;
    }
    case 'orderedList': {
      chain.toggleOrderedList().run();
      break;
    }
    case 'blockquote': {
      chain.toggleBlockquote().run();
      break;
    }
    case 'codeBlock': {
      chain.toggleCodeBlock().run();
      break;
    }
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}

function applyLink(editor: Editor, href: string) {
  const trimmed = href.trim();
  if (!trimmed) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: trimmed })
    .run();
}

export function HtmlRichTextBubbleMenuToolbar({ editor }: { editor: Editor }) {
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const theme = useSyncExternalStore(
    subscribeDocumentTheme,
    readDocumentTheme,
    () => 'light'
  );

  const state = useEditorState({
    editor,
    selector: ({ editor: active }) => ({
      blockFormat: activeBlockFormat(active),
      bold: active.isActive('bold'),
      italic: active.isActive('italic'),
      underline: active.isActive('underline'),
      strike: active.isActive('strike'),
      code: active.isActive('code'),
      link: active.isActive('link'),
      linkHref: (active.getAttributes('link').href as string | undefined) ?? '',
      alignLeft: active.isActive({ textAlign: 'left' }),
      alignCenter: active.isActive({ textAlign: 'center' }),
      alignRight: active.isActive({ textAlign: 'right' }),
      color:
        (active.getAttributes('textStyle').color as string | undefined) ?? '',
    }),
  });

  useEffect(() => {
    if (!(blockMenuOpen || linkOpen)) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setBlockMenuOpen(false);
        setLinkOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [blockMenuOpen, linkOpen]);

  const currentBlock =
    BLOCK_OPTIONS.find((option) => option.format === state.blockFormat) ??
    BLOCK_OPTIONS[0]!;

  const stopBlur = (event: ReactMouseEvent) => {
    event.preventDefault();
  };

  const submitLink = (event: FormEvent) => {
    event.preventDefault();
    applyLink(editor, linkValue);
    setLinkOpen(false);
  };

  return (
    <div
      aria-label="Text formatting"
      className={styles.bubbleMenu}
      data-openenvx-rich-text-bubble=""
      data-owb-theme={theme}
      onMouseDown={stopBlur}
      role="toolbar"
      tabIndex={-1}
    >
      <div className={styles.bubbleMenuGroup} ref={popoverRef}>
        <button
          aria-expanded={blockMenuOpen}
          aria-haspopup="menu"
          aria-label="Block type"
          className={styles.blockTypeButton}
          onClick={() => {
            setLinkOpen(false);
            setBlockMenuOpen((open) => !open);
          }}
          type="button"
        >
          <span>{currentBlock.label}</span>
          <ChevronDown size={14} />
        </button>
        <FormatButton
          active={state.link}
          label="Link"
          onPress={() => {
            setBlockMenuOpen(false);
            setLinkValue(state.linkHref || 'https://');
            setLinkOpen((open) => !open);
          }}
        >
          <LinkIcon size={14} />
        </FormatButton>
        {blockMenuOpen ? (
          <div className={styles.blockTypeMenu} role="menu">
            {BLOCK_OPTIONS.map((option) => {
              const selected = option.format === state.blockFormat;
              return (
                <button
                  aria-checked={selected}
                  className={`${styles.blockTypeMenuItem} ${selected ? styles.blockTypeMenuItemActive : ''}`}
                  key={option.format}
                  onClick={() => {
                    applyBlockFormat(editor, option.format);
                    setBlockMenuOpen(false);
                  }}
                  role="menuitemradio"
                  type="button"
                >
                  <span className={styles.blockTypeMenuIcon}>
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                  {selected ? (
                    <span aria-hidden className={styles.blockTypeMenuCheck}>
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
        {linkOpen ? (
          <form className={styles.linkPopover} onSubmit={submitLink}>
            <input
              aria-label="Link URL"
              autoFocus
              className={styles.linkInput}
              onChange={(event) => setLinkValue(event.target.value)}
              placeholder="https://"
              value={linkValue}
            />
            <button className={styles.linkApply} type="submit">
              Apply
            </button>
            {state.link ? (
              <button
                className={styles.linkApply}
                onClick={() => {
                  applyLink(editor, '');
                  setLinkOpen(false);
                }}
                type="button"
              >
                Remove
              </button>
            ) : null}
          </form>
        ) : null}
      </div>

      <Divider />

      <div className={styles.bubbleMenuGroup}>
        <FormatButton
          active={state.bold}
          label="Bold"
          onPress={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={14} />
        </FormatButton>
        <FormatButton
          active={state.italic}
          label="Italic"
          onPress={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={14} />
        </FormatButton>
        <FormatButton
          active={state.underline}
          label="Underline"
          onPress={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline size={14} />
        </FormatButton>
        <FormatButton
          active={state.strike}
          label="Strikethrough"
          onPress={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={14} />
        </FormatButton>
        <FormatButton
          active={state.code}
          label="Inline code"
          onPress={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={14} />
        </FormatButton>
        <label
          className={`${styles.formatButton} ${styles.colorSwatch}`}
          title="Text color"
        >
          <Highlighter size={14} />
          <input
            aria-label="Text color"
            onChange={(event) => {
              editor.chain().focus().setColor(event.target.value).run();
            }}
            type="color"
            value={
              /^#[0-9a-fA-F]{6}$/.test(state.color) ? state.color : '#000000'
            }
          />
        </label>
      </div>

      <Divider />

      <div className={styles.bubbleMenuGroup}>
        <FormatButton
          active={state.alignLeft}
          label="Align left"
          onPress={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft size={14} />
        </FormatButton>
        <FormatButton
          active={state.alignCenter}
          label="Align center"
          onPress={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter size={14} />
        </FormatButton>
        <FormatButton
          active={state.alignRight}
          label="Align right"
          onPress={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight size={14} />
        </FormatButton>
      </div>
    </div>
  );
}
