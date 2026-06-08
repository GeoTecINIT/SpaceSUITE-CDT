import { inject, Injectable } from "@angular/core";
import { FilterOption } from "../../model/viewModel/filterOption";
import { PaginatorState } from "primeng/paginator";
import { HttpClient } from "@angular/common/http";
import {  combineLatest, concatMap, map, Observable, ReplaySubject, startWith, Subscription, switchMap, take, tap } from "rxjs";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { EducationalOfferService } from "./educationalOffer.service";
import { TranslateService } from "@ngx-translate/core";

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
  public hidePrivate: boolean = false;

  private educationalOfferService: EducationalOfferService = inject(EducationalOfferService);
  private http: HttpClient = inject(HttpClient);
  private translate: TranslateService = inject(TranslateService);

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
      updatedFilters[updatedFilters.length - 1].values = [...organizations];
      this.filterOptions.next(updatedFilters);
    });
  }

  private get translatedFilters$(): Observable<FilterOption[]> {
    return combineLatest([
      this.filterOptions.asObservable(),
      this.translate.onLangChange.pipe(startWith(null))
    ]).pipe(
      map(([filters]) => this.translateFilters(filters))
    );
  }

  public getFilterOptions(): Observable<FilterOption[]> {
    return this.translatedFilters$;
  }

  public checkItem(item: EducationalOffer, filter: FilterOption): boolean {
    switch(filter.id) {
      case 'EQF Level':
        return filter.selection.some(selection => item.root.eqf.toString() === selection.slice(-1));
      case 'Offer Type':
        return filter.selection.some(selection => item.root.nodeType === selection);
      case 'Organizations':
        return filter.selection.some(selection => item.orgName?.toLowerCase() == selection.toLowerCase());
      default:
        return true;
    }
  }

  public getOption(id: string): Observable<FilterOption> {
    return this.translatedFilters$.pipe(
      map(value => {
        const option = value.filter( option => option.id == id)
        if (option.length > 0) return option[0];
        return {
          id: id,
          label: id,
          values: [],
          selection: []
        };
      })
    );
  }

  private translateFilters(filters: FilterOption[]): FilterOption[] {
    return filters.map(value => {
      return {
        id: value.id,
        label: this.translate.instant(value.label),
        values: [...value.values],
        selection: [],
        ...(value.tags ? {
          tags: value.tags.map(tag => this.translate.instant(tag))
        } : {}),
        ...(value.tooltip ? {
          tooltip: this.translate.instant(value.tooltip)
        } : {})
      }
    })
  }
}