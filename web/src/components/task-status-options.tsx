import { TASK_STATUSES } from '@auxilius-take-home/types';

export const renderTaskStatusOptions = () =>
  TASK_STATUSES.map((status) => (
    <option key={status} value={status}>
      {status.replace('_', ' ')}
    </option>
  ));
