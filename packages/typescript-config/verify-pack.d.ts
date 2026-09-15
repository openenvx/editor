export declare function fail(message: string): never;

export declare function readDist(
  distRoot: string,
  file: string
): Promise<string>;

export declare function assertNoSourcemaps(listing: string): void;

export declare function assertDistExport(
  pkg: {
    exports?: Record<string, { default?: string } | string>;
    publishConfig?: {
      exports?: Record<string, { default?: string } | string>;
    };
  },
  exportKey?: string
): string;

export declare function packTarball(packageRoot: string): Promise<{
  tgz: string;
  listing: string;
  pkgJson: string;
  pkg: Record<string, unknown>;
}>;

export interface DistCheck {
  file: string;
  assert?: (content: string) => boolean;
  message?: string;
  includes?: string[];
  maxLines?: number;
  mustNotMatch?: RegExp;
}

export interface VerifyPackOptions {
  packageRoot?: string;
  packageLabel: string;
  distChecks?: DistCheck[];
  beforePack?: () => void | Promise<void>;
  requiredTarballPaths?: string[];
  forbidTarballPatterns?: RegExp[];
  forbidSourcemaps?: boolean;
  afterPack?: (ctx: {
    listing: string;
    pkg: Record<string, unknown>;
    tgz: string;
  }) => void | Promise<void>;
}

export declare function createVerifyPack(options: VerifyPackOptions): {
  run(): Promise<void>;
};
