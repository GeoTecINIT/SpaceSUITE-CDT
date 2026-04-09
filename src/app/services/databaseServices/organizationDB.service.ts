import { inject, Injectable } from "@angular/core";
import { collection, collectionData, CollectionReference, doc, docData, Firestore, query, where } from "@angular/fire/firestore";
import { Organization } from "../../model/userModel/organization";
import { combineLatest, map, Observable, switchMap } from "rxjs";
import { AuthService } from "@eo4geo/ngx-bok-utils";

@Injectable({
    providedIn: 'root',
})
export class OrganizationDBService {
  private db: Firestore = inject(Firestore);
  private organizationCollection: CollectionReference;

  private authService: AuthService = inject(AuthService);

  constructor() { 
    this.organizationCollection = collection(this.db, 'Organizations');
  }

  getOrganizations(): Observable<Organization[]> {
    return collectionData(this.organizationCollection) as Observable<Organization[]>;
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

  getUserOrganizations(): Observable<Organization[]> {
    return this.authService.getUserState().pipe(
      switchMap(userState => {
        if (userState == undefined) return [];

        const regularQuery = query(
          this.organizationCollection,
          where('regular', 'array-contains', userState.uid)
        );
        const adminQuery = query(
          this.organizationCollection,
          where('admin', 'array-contains', userState.uid)
        );

        return combineLatest([
          collectionData(regularQuery) as Observable<Organization[]>,
          collectionData(adminQuery) as Observable<Organization[]>
        ]).pipe(
          map(([regular, admin]) => {
            const seen = new Set<string>();
            return [...regular, ...admin].filter(org => {
              if (seen.has(org._id)) return false;
              seen.add(org._id);
              return true;
            })
          })
        );
      })
    )
  }
}
