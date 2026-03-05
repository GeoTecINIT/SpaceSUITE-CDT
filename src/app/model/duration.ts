export enum DurationUnit {
  Hours,
  Minutes,
  Days,
  Weeks,
  Months,
  Trimesters,
  Semesters,
  Years
}

export class Duration {
  public value: number;
  public unit: DurationUnit;

  constructor(currentNode?: Partial<Duration>) {
    this.value = currentNode?.value || 0;
    this.unit = currentNode?.unit || DurationUnit.Semesters;
  }
}