export declare const REACT_PUBLISH_EXTERNALS: string[];
export declare const STUDIO_SUBPATH_EXTERNALS: string[];
export declare const OPENENVX_ARTBOARD_EXTERNALS: string[];

export declare function studioCoreExternals(): string[];
export declare function studioCoreEntryExternals(): string[];
export declare function studioShellExternals(pkg: object): string[];
export declare function artboardPublishExternals(pkg: {
  peerDependencies?: Record<string, string>;
}): string[];

export declare function findBareImport(
  content: string,
  moduleIds: string[]
): string | null;

export declare function bareImportPattern(moduleIds: string[]): RegExp;

export declare function mergePublishPackageJson(
  pkg: Record<string, unknown>
): Record<string, unknown>;
