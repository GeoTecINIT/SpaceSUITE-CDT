import { inject, Injectable } from "@angular/core";
import { FilterOption } from "../../model/viewModel/filterOption";
import { PaginatorState } from "primeng/paginator";
import { HttpClient } from "@angular/common/http";
import {  concatMap, map, Observable, ReplaySubject, take } from "rxjs";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { EducationalOfferService } from "./educationalOffer.service";

@Injectable({
    providedIn: 'root',
})
export class CardFilterService {
  private filterOptions: ReplaySubject<FilterOption[]> = new ReplaySubject<FilterOption[]>(1);

  public searchValue: string = '';
  public searchOption: string = 'Title';
  public bokConcepts: string[] = [];
  public userItemFilter: boolean = false;
  public paginatorState: PaginatorState = {}

  private educationalOfferService: EducationalOfferService = inject(EducationalOfferService);
  private http: HttpClient = inject(HttpClient);

  constructor(){
    this.http.get<FilterOption[]>('/assets/filters.json').pipe(
      take(1),
      concatMap((filters: FilterOption[]) => {
        return this.educationalOfferService.getOffersOrganizations().pipe(
          map( organizations => ({filters, organizations}))      
        );
      })
    ).subscribe(({ filters, organizations }) => {
      const updatedFilters = [...filters];
      updatedFilters[updatedFilters.length - 1].values = organizations
      this.filterOptions.next(updatedFilters);
    });
  }

  public getFilterOptions(): Observable<FilterOption[]> {
    return this.filterOptions.asObservable();
  }

  public checkItem(item: EducationalOffer, filter: FilterOption): boolean {
    switch(filter.label) {
      case 'EQF Level':
        return filter.selection.some(selection => item.root.eqf.toString() === selection.slice(-1));
      case 'Organizations':
        return filter.selection.some(selection => item.orgName?.toLowerCase() == selection.toLowerCase());
      default:
        return true;
    }
  }

  public getOptionByLabel(label: string): Observable<FilterOption> {
    return this.filterOptions.pipe(
      map(value => {
        const option = value.filter( option => option.label == label)
        if (option.length > 0) return option[0];
        return {
          label: label,
          values: [],
          selection: []
        };
      })
    );
  }
}