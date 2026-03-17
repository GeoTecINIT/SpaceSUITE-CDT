import { Organization } from "./organization";

export class User {
  _id: string;
  name: string;
  email: string;
  organizations: Organization[];

  constructor(_id: string, name: string, email: string, organizations: Organization[]) {
    this._id = _id;
    this.name = name;
    this.email = email;
    this.organizations = organizations;
  }
}