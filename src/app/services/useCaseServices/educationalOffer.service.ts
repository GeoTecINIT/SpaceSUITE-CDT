import { Inject, Injectable } from '@angular/core';
import { EducationalOffer } from '../../model/coreModel/educationalOffer';
import { EducationalOfferAdapterService } from '../databaseServices/educationalOfferAdapter.service';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { error } from 'console';

@Injectable({
  providedIn: 'root',
})
export class EducationalOfferService {
  private offerMap: BehaviorSubject<Map<string, EducationalOffer> | undefined>;

  private educationalOfferAdapterService: EducationalOfferAdapterService;

  constructor() {
    this.educationalOfferAdapterService = Inject(EducationalOfferAdapterService);

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

  submitEducationalOffer(newOffer: EducationalOffer, oldOffer?: EducationalOffer): Observable<void> {
    // TODO
    throw new Error('NOT IMPLEMENTED');
  }

  private loadOfferMap(): void {
    this.educationalOfferAdapterService.getEdcationalOffers().pipe(
      tap((newValues) => {
        const newMap = new Map<string, EducationalOffer>();
        newValues.forEach((value) => {
          newMap.set(value.id, value);
        });
      }),
    );
  }
}
