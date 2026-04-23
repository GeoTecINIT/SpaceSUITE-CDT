export class ISCEDFArea { 
  public name: string; 
  public code: string; 
  public parent: string; 
  public grandparent: string; 
  public greatgrandparent: string;

  constructor(area: Partial<ISCEDFArea> | undefined = undefined) {
    this.name = area?.name || "";
    this.code = area?.code || "";
    this.parent = area?.parent || "";
    this.grandparent = area?.grandparent || "";
    this.greatgrandparent = area?.greatgrandparent || "";
  }

  public getCompleteName(): string {
    return `${this.name} (${this.grandparent})`;
  }

  public toPlainObject(): any {
    return {
      name: this.name,
      code: this.code,
      parent: this.parent,
      grandparent: this.grandparent,
      greatgrandparent: this.greatgrandparent,
    };
  }
}