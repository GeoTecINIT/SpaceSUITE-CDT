import { inject, Injectable } from '@angular/core';
import { EducationalOffer } from '../../model/coreModel/educationalOffer';
import { EducationalOfferAdapterService } from '../databaseServices/educationalOfferAdapter.service';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EducationalOfferService {
  private offerMap: BehaviorSubject<Map<string, EducationalOffer> | undefined>;

  private educationalOfferAdapterService: EducationalOfferAdapterService = inject(EducationalOfferAdapterService);

  constructor() {
    this.offerMap = new BehaviorSubject<Map<string, EducationalOffer> | undefined>(undefined);
  }

  getEducationalOffers(): Observable<EducationalOffer[]> {
    if (this.offerMap.getValue() == undefined) {
      this.loadOfferMap();
    }
    return this.offerMap.asObservable().pipe(
      map((mapValue) => {
        if (mapValue == undefined) return [];
        return Array.from(mapValue.values());
      }),
    );
  }

  getEducationalOffer(educationalOfferId: string): Observable<EducationalOffer | undefined> {
    if (this.offerMap.getValue() != undefined) {
      return this.offerMap
        .asObservable()
        .pipe(map((mapValue) => mapValue?.get(educationalOfferId)));
    }
    return this.educationalOfferAdapterService.getEducationalOffer(educationalOfferId);
  }

  deleteEducationalOffer(educationalOfferId: string): Observable<void> {
    return this.educationalOfferAdapterService.deleteEducationalOffer(educationalOfferId);
  }

  submitEducationalOffer(newOffer: EducationalOffer, oldOffer?: EducationalOffer): Observable<void> {
    // TODO
    throw new Error('NOT IMPLEMENTED');
  }

    public getOffersOrganizations(): Observable<string[]> {
    return this.offerMap.asObservable().pipe(
      map(offers => {
        if (offers == undefined || offers.size == 0) return [];
        const orgs = Array.from(offers.values())
          .filter((m: EducationalOffer) => !!m.orgName)
          .map(m => m.orgName!);
        return [...new Set(orgs)];
      })
    )
  }

  private loadOfferMap(): void {
    this.educationalOfferAdapterService.getEdcationalOffers().pipe(
      tap((newValues) => {
        const newMap = new Map<string, EducationalOffer>();
        newValues.forEach((value) => {
          newMap.set(value.id, value);
        });
        this.offerMap.next(newMap);
      }),
    ).subscribe();
  }
}
