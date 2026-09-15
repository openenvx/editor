export interface RunBuildDtsOptions {
  packageRoot?: string;
  tsconfig?: string;
  cssModules?: boolean;
  inlinePackages?: string[];
  entries: [string, string][];
}

export declare function runBuildDts(options: RunBuildDtsOptions): Promise<void>;
