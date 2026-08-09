/** @jsxImportSource preact */
import {
  defineCanvasComponent,
  list,
  select,
  string,
} from '@xmazu/openenvxee-extensions';
import { Grid, Stack, Text } from '@xmazu/openenvxee-extensions/canvas';

const STATUS = ['free', 'held', 'seated'] as const;
const COLORS: Record<(typeof STATUS)[number], string> = {
  free: '#d1fae5',
  held: '#fef3c7',
  seated: '#fecaca',
};

const DEFAULT_TABLES = [
  { id: 't1', label: '1', status: 'free' as const },
  { id: 't2', label: '2', status: 'held' as const },
  { id: 't3', label: '3', status: 'free' as const },
  { id: 't4', label: '4', status: 'seated' as const },
];

/** Seating plan canvas widget — authored with the widget SDK. */
export const seatingWidget = defineCanvasComponent({
  id: 'wm.seating',
  label: 'Seating plan',
  props: {
    tables: list(
      {
        id: string({ label: 'Id' }),
        label: string({ label: 'Label' }),
        status: select(
          [
            { label: 'Free', value: 'free' },
            { label: 'Held', value: 'held' },
            { label: 'Seated', value: 'seated' },
          ],
          { label: 'Status', default: 'free' }
        ),
      },
      { label: 'Tables', default: DEFAULT_TABLES }
    ),
  },
  render({ props, setProps }) {
    const tables = Array.isArray(props.tables) ? props.tables : DEFAULT_TABLES;

    return (
      <Grid columns={2} gap={12} width={220} height={180}>
        {tables.map((table, index) => {
          const status = STATUS.includes(
            table.status as (typeof STATUS)[number]
          )
            ? (table.status as (typeof STATUS)[number])
            : 'free';
          const cycle = () => {
            const i = STATUS.indexOf(status);
            const nextStatus = STATUS[(i + 1) % STATUS.length] ?? 'free';
            const next = tables.map((entry, entryIndex) =>
              entryIndex === index ? { ...entry, status: nextStatus } : entry
            );
            setProps({ tables: next });
          };

          return (
            <Stack
              direction="vertical"
              fill={COLORS[status]}
              gap={4}
              height={72}
              key={table.id}
              onClick={cycle}
              padding={8}
              width={88}
            >
              <Text fill="#111827" fontSize={14} onClick={cycle}>
                {`Table ${String(table.label || table.id)}`}
              </Text>
              <Text fill="#4b5563" fontSize={11} onClick={cycle}>
                {status}
              </Text>
            </Stack>
          );
        })}
      </Grid>
    );
  },
});
