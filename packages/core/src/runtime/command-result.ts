export interface CommandExecutionResult<T = unknown> {
  executed: boolean;
  result?: T;
}
