import { Injectable } from "@angular/core";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";

@Injectable({
    providedIn: 'root',
})
export class CardSortingService {
  public sortOption: string = 'Title';
  public sortAsc: boolean = false;

  public sortItems(inputItems: EducationalOffer[]) {
    let sortedItems: EducationalOffer[] = [...inputItems];
    switch(this.sortOption) {
      case 'Title':
        if (this.sortAsc) {
          sortedItems = sortedItems.sort((a, b) => b.root.name.localeCompare(a.root.name));
        }
        else {
          sortedItems = sortedItems.sort((a, b) => a.root.name.localeCompare(b.root.name));
        }
        break;
      case 'Date':
        if (this.sortAsc) {
          sortedItems = sortedItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        else {
          sortedItems = sortedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        break;
      case 'EQF':
        sortedItems = sortedItems.sort((a, b) => this.sortAsc ? a.root.eqf - b.root.eqf : b.root.eqf - a.root.eqf);
        break;
    }
    return sortedItems;
  }
}