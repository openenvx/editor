import { TopBarContribution } from '@openenvx/core';

export const EMAIL_TOP_BAR_ID = 'email.topBar';

export class EmailTopBarContribution extends TopBarContribution {
  readonly id = EMAIL_TOP_BAR_ID;
}
