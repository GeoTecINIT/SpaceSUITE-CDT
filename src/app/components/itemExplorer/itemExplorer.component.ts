import { Component, ElementRef, inject, NgZone, signal, ViewChild, WritableSignal } from "@angular/core";
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { CommonModule } from "@angular/common";
import { combineLatest, filter, map, Observable, Subscription, take, tap } from "rxjs";
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { TabsModule } from 'primeng/tabs';
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { FilterOption } from "../../model/viewModel/filterOption";
import { EducationalOfferService } from "../../services/useCaseServices/educationalOffer.service";
import { CardSortingService } from "../../services/useCaseServices/cardSorting.service";
import { CardFilterService } from "../../services/useCaseServices/cardFilter.service";
import { OrganizationDBService } from "../../services/databaseServices/organizationDB.service";
import { CurriculumNode } from "../../model/coreModel/curriculumNode";
import { FiltersComponent } from "../filters/filters.component";
import { CardComponent } from "../card/card.component";
import { AuthService } from "@eo4geo/ngx-bok-utils";
import { DividerModule } from 'primeng/divider';

@Component({
  standalone: true,
  selector: 'item-explorer',
  templateUrl: './itemExplorer.component.html',
  styleUrls: ['./itemExplorer.component.css'],
  imports: [CardComponent, FiltersComponent, SkeletonModule, CommonModule, 
            PaginatorModule, ToastModule, ButtonModule, MenuModule, ButtonGroupModule, 
            DividerModule, TabsModule],
  providers: [MessageService]
})
export class ItemExplorerComponent {
  educationalOffers: EducationalOffer[] = [];
  filteredEducationalItems: WritableSignal<EducationalOffer[]> = signal([]);

  // Filter fields - no signal (child input)
  filterOptions: FilterOption[] = [];
  advancedFilterOptions: FilterOption[] = [];
  searchValue: string = '';
  searchOption: string = "Title";
  bokConcepts: string[] = [];
  loadingFilters: boolean = true;

  loadingCards = signal(true);

  filterUserItemOptions: any[] = [];
  filterByUserItem: boolean = false;

  skeletonElements: number[] = [];

  first: number = 0;
  rows: number = 16;
  paginationEducationalItems: EducationalOffer[] = [];

  @ViewChild('container') containerRef!: ElementRef;
  buttonBottom = 32;

  sortOptions: MenuItem[] | undefined;
  selectedSortOption: string = "Title";
  sortAsc: boolean = false;

  private educationalOffersSubscription!: Subscription;
  private userOrgIds: string[] = [];
  private userUid: string | undefined;

  // Services

  private educationalOfferService = inject(EducationalOfferService);
  private authService = inject(AuthService);
  private organizationService = inject(OrganizationDBService);
  private filterService = inject(CardFilterService);
  private sortingService = inject(CardSortingService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private ngZone: NgZone = inject(NgZone);

  constructor() {
    this.skeletonElements = Array(16).fill(null);
    this.sortOptions = [{ label: 'Title' }, { label: 'Date' }, {label: 'EQF'}];
  }

  ngOnInit() {
    this.filterUserItemOptions = [{ label: 'My Offers', value: true, icon: 'pi pi-user' },{ label: 'All Offers', value: false, icon: 'pi pi-globe' }];

    // Load filters value from FilterService
    this.filterService.getFilterOptions().pipe(take(1)).subscribe(filters => {
      this.filterOptions = filters;
      this.loadingFilters = false;
    });

    // Load filters & sorting state
    this.searchValue = this.filterService.searchValue;
    this.searchOption = this.filterService.searchOption;
    this.filterByUserItem = this.filterService.userItemFilter;
    this.bokConcepts = this.filterService.bokConcepts;
    this.sortAsc = this.sortingService.sortAsc;
    this.selectedSortOption = this.sortingService.sortOption;

    // Load Items & User orgs
    this.educationalOffersSubscription = combineLatest([
      this.educationalOfferService.getEducationalOffers().pipe(
        filter(value => value !== undefined),
        tap((newValue: EducationalOffer[]) => this.educationalOffers = newValue)
      ),
      this.organizationService.getUserOrganizations().pipe(
        map(orgs => orgs.map(o => o._id)),
        tap(ids => this.userOrgIds = ids)
      )
    ]).subscribe(() => {
      this.filterPipeline()
      if(this.filterService.paginatorState.rows && this.filterService.paginatorState.first) {
        this.onPageChange(this.filterService.paginatorState);
      }
      this.loadingCards.set(false);
      this.ngZone.onStable.pipe(take(1)).subscribe(() => {
        this.updateButtonPosition();
      });
    });
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      const submited: boolean = params['submited'];
      const mode: string = params['mode'];
      if (submited){
        switch (mode){
          case 'delete':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Material deleted without problems.`,
              life: 3000, 
              closable: true 
            }); 
            break
        }
      }
    });
    window.addEventListener('scroll', this.updateButtonPosition);
    window.addEventListener('resize', this.updateButtonPosition);
  }

  updateButtonPosition = () => {
    const element = this.containerRef.nativeElement;
    const rect = element.getBoundingClientRect();
    const bottomOverlap = window.innerHeight - rect.bottom;
    const newButtonBottom = Math.max(bottomOverlap, 32);
    if (this.buttonBottom !== newButtonBottom) {
      this.buttonBottom = newButtonBottom;
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.updateButtonPosition);
    window.removeEventListener('resize', this.updateButtonPosition);
    this.educationalOffersSubscription.unsubscribe();
  }

  switchSortOrientation() {
    this.sortAsc = !this.sortAsc;
    this.sortingService.sortAsc = this.sortAsc;
    this.filterPipeline();
  }

  setSortOption(option: string) {
    this.selectedSortOption = option;
    this.sortingService.sortOption = option;
    this.filterPipeline()
  }

  setSearchOption(option: string) {
    this.searchOption = option;
    this.filterService.searchOption = option;
    this.filterPipeline()
  }

  setSearchValue(option: string) {
    this.searchValue = option;
    this.filterService.searchValue = option;
    this.filterPipeline()
  }

  setFilterByUserMaterial(newValue: boolean) {
    this.filterByUserItem = newValue;
    this.filterService.userItemFilter = newValue;
    this.filterPipeline()
  }

  setBoKConcepts(filterConcepts: string[]) {
    this.bokConcepts = filterConcepts;
    this.filterService.bokConcepts = filterConcepts;
    this.filterPipeline();
  }

  filterPipeline() {
    const sortedItems = this.sortItems(this.educationalOffers);
    const searchedItems = this.searchItems(sortedItems);
    const filteredItems = this.filterItems(searchedItems);
    this.filteredEducationalItems.set(this.filterByBoKConcept(filteredItems));
    this.paginationEducationalItems = this.filteredEducationalItems().slice(this.first, this.first + this.rows)
  }

  sortItems(inputItems: EducationalOffer[]): EducationalOffer[] {
    return this.sortingService.sortItems(inputItems);
  }

  searchItems(sortedItems: EducationalOffer[]) {
    const newSearch: EducationalOffer[] = [];
    switch (this.searchOption) {
      case "Title":
        sortedItems.forEach( offer => {
          if (offer.root.name.toLowerCase().includes(this.searchValue.toLowerCase())) newSearch.push(offer);
        });
        break;
      case "Description":
        sortedItems.forEach( offer => {
          if (offer.root.description.toLowerCase().includes(this.searchValue.toLowerCase())) newSearch.push(offer);
        });
        break;
      case "Learning Outcome":
        sortedItems.forEach( offer => {
          if (offer.root.learningObjectives.join(';').toLowerCase().includes(this.searchValue.toLowerCase())) newSearch.push(offer);
        });
        break;
      default:
        console.log("Invalid Search Option");
    }
    return newSearch;
  }

  filterItems(searchedItems: EducationalOffer[]): EducationalOffer[]  {
    const allFilters = [...this.filterOptions, ...this.advancedFilterOptions];
    const noFilters = allFilters.every(f => !f.selection || f.selection.length === 0);

    let materials = [...searchedItems];
    if (!this.filterByUserItem && noFilters) {
      materials = materials.filter(m =>
        this.userUid ? 
        (m.isPublic || m.userId === this.userUid || (m.orgId && this.userOrgIds.includes(m.orgId))) : m.isPublic
      );
    } else {
      if (this.filterByUserItem && this.userUid) {
        materials = materials.filter(m => m.userId === this.userUid);
      } else if (this.userUid) {
        materials = materials.filter(m => m.isPublic || m.userId === this.userUid || (m.orgId && this.userOrgIds.includes(m.orgId)));
      } else {
        materials = materials.filter(m => m.isPublic);
      }

      materials = materials.filter(m =>
        allFilters.every(f =>
          !f.selection || f.selection.length === 0 || this.filterService.checkItem(m, f)
        )
      );
    }
    return materials; 
  }

  filterByBoKConcept(filteredItems: EducationalOffer[]): EducationalOffer[] {
    if (!this.bokConcepts || this.bokConcepts.length == 0) {
      return filteredItems;
    }
    const bokSet = new Set(this.bokConcepts);
    return filteredItems.filter(item => this.hasMatchingConcept(item.root, bokSet));
  }

  private hasMatchingConcept(node: CurriculumNode, bokSet: Set<string>): boolean {
    if (node.bokConcepts.some(concept => bokSet.has(concept))) {
      return true;
    }
    for (const child of node.getChildren() ?? []) {
      if (this.hasMatchingConcept(child, bokSet)) {
        return true;
      }
    }
    return false;
  }

  isLogged(): Observable<boolean> {
    return this.authService.getUserState().pipe(tap(state => this.userUid = state?.uid), map(state => state?.logged || false));
  }

  onPageChange(event: PaginatorState) {
      this.first = event.first ?? 0;
      this.rows = event.rows ?? 16;
      this.filterService.paginatorState = event;
      this.paginationEducationalItems = this.filteredEducationalItems().slice(this.first, this.first + this.rows)
  }

  createTrainingItem() {
    this.router.navigate(['new']);
  }

  trackById(index: number, item: any): string | number {
    return item._id ?? item.id ?? index;
  }

}