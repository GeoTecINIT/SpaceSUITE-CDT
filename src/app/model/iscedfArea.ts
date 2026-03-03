export class ISCEDFArea { 
  public name: string; 
  public code: number; 
  public parent: string; 
  public grandparent: string; 
  public greatgrandparent: string;

  constructor(area: Partial<ISCEDFArea> | undefined = undefined) {
    this.name = area?.name || "";
    this.code = area?.code || 0;
    this.parent = area?.parent || "";
    this.grandparent = area?.grandparent || "";
    this.greatgrandparent = area?.greatgrandparent || "";
  }

  public getCompleteName(): string {
    return `${this.name} (${this.grandparent})`;
  }
}