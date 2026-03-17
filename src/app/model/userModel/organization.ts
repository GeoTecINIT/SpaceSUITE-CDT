export class Organization {
  _id: string;
  name: string;
  regular: string[];
  admin: string[];
  divisions: string[];

  constructor(_id: string, name: string, regular: string[], admin: string[], divisions: string[]) {
    this._id = _id;
    this.name = name;
    this.regular = regular;
    this.admin = admin;
    this.divisions = divisions;
  }
}