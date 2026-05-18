export enum DurationUnit {
  Hours = 'Hours',
  Minutes = 'Minutes',
  Days = 'Days',
  Weeks = 'Weeks',
  Months = 'Months',
  Trimesters = 'Trimesters',
  Semesters = 'Semesters',
  Years = 'Years'
}

export class Duration {
  public value: number;
  public unit: DurationUnit;

  constructor(currentNode?: Partial<Duration>) {
    this.value = currentNode?.value || 0;
    this.unit = currentNode?.unit || DurationUnit.Semesters;
  }

  public toPlainObject(): any {
    return {
      value: this.value,
      unit: this.unit,
    };
  }
}