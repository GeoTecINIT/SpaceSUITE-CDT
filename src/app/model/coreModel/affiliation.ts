export class Affiliation {
  public name: string;
  public url?: string;

  constructor(affiliation: Partial<Affiliation> | undefined = undefined) {
    this.name = affiliation?.name || "";
    this.url = affiliation?.url;
  }
}