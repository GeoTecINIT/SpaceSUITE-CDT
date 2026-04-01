import { Component, Inject, signal, WritableSignal } from '@angular/core';
import { EducationalOffer } from '../../model/coreModel/educationalOffer';
import { EducationalOfferService } from '../../services/useCaseServices/educationalOffer.service';

@Component({
  standalone: true,
  selector: 'main-page',
  templateUrl: './mainPage.component.html',
  styleUrls: ['./mainPage.component.css'],
  imports: [],
})
export class MainPageComponent {
  private educationalOfferService: EducationalOfferService;
  
  educationalOfferList: WritableSignal<EducationalOffer[]>;

  constructor() {
    this.educationalOfferService = Inject(EducationalOfferService);
    this.educationalOfferList = signal([]);
  }

  ngOnInit() {
    this.educationalOfferService.getEducationalOffers().subscribe(
      newEducationalOffers => this.educationalOfferList.set(newEducationalOffers)
    );
  }
}