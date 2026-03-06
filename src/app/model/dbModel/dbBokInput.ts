export class DBBokInput {
  public _id: string;
  public name: string;
  public concept_id: string;
  public definition: string;
  public skills: string[];
  public linkedTo: string;
  public bibliography: string[];

  constructor(bokInput: Partial<DBBokInput>) {
    this._id = bokInput?._id || '';
    this.name = bokInput?.name || '';
    this.concept_id = bokInput?.concept_id || '';
    this.definition = bokInput?.definition || '';
    this.skills = bokInput?.skills || [];
    this.linkedTo = bokInput?.linkedTo || '' ;
    this.bibliography = bokInput?.bibliography || [];
  }
}
