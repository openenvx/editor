import { Button } from '../../primitives/button';
import { Input } from '../../primitives/input';

import styles from '../../renderers/property-panel.module.css';

export interface ImageInputProps {
  id: string;
  value: string;
  uploadCommandId?: string;
  onChange: (value: string) => void;
  onUpload?: () => void;
}

export function ImageInput({
  id,
  value,
  uploadCommandId,
  onChange,
  onUpload,
}: ImageInputProps) {
  return (
    <div className={styles.imageRow}>
      <Input
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {uploadCommandId && onUpload ? (
        <Button onClick={onUpload} size="sm">
          Upload
        </Button>
      ) : null}
    </div>
  );
}
