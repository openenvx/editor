import type { ContributionPoint } from './contribution-point';

export abstract class Contribution {
  abstract readonly contributionPoint: ContributionPoint;
}
