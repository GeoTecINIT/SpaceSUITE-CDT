import { inject, Injectable } from "@angular/core";
import { collection, collectionData, CollectionReference, doc, docData, Firestore } from "@angular/fire/firestore";
import { Organization } from "../model/userModel/organization";
import { combineLatest, map, Observable } from "rxjs";
import { User } from "../model/userModel/user";

@Injectable({
    providedIn: 'root',
})
export class OrganizationService {
  private db: Firestore;
  private organizationCollection: CollectionReference;

  constructor() { 
    this.db = inject(Firestore);
    this.organizationCollection = collection(this.db, 'Organizations');
  }

  getOrganizations(): Observable<Organization[]> {
    return collectionData(this.organizationCollection) as Observable<Organization[]>;
  }

  getUserOrganizations(user: User): Observable<Organization[]> {
    const orgIds = user.organizations.map(org => org._id);
     const orgObservables = orgIds.map(id => this.getOrganizationById(id));
    return combineLatest(orgObservables).pipe(
      map(orgs => orgs.filter((org): org is Organization => !!org))
    );
  }

  getOrganizationDivisions(orgId: string): Observable<string[]> {
    return this.getOrganizationById(orgId).pipe(
      map(org => org?.divisions ?? [])
    );
  }

  getOrganizationById(orgId: string): Observable<Organization | undefined> {
    const orgDocRef = doc(this.organizationCollection, orgId);
    return docData(orgDocRef) as Observable<Organization | undefined>;
  }
}
