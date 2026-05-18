import { CommonModule } from "@angular/common";
import { EducationalOffer } from "../../model/coreModel/educationalOffer";
import { OfferFormComponent } from "../offerForm/offerForm.component";
import { ActivatedRoute, Router } from "@angular/router";
import { Component, inject } from "@angular/core";
import { AuthService, ExitWithoutSavingService } from "@eo4geo/ngx-bok-utils";
import { EducationalOfferService } from "../../services/useCaseServices/educationalOffer.service";
import { combineLatest, concatMap, forkJoin } from "rxjs";
import { OrganizationDBService } from "../../services/databaseServices/organizationDB.service";

@Component({
  standalone: true,
  selector: 'edit-page',
  template: '<offer-form *ngIf="educationalOffer" [inputOffer]="educationalOffer" pageName="Edit Educational Offer">',
  imports: [OfferFormComponent, CommonModule],
})
export class EditPageComponent {
  educationalOffer?: EducationalOffer;

  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private exitWithoutSavingService: ExitWithoutSavingService = inject(ExitWithoutSavingService);
  private eduOfferService: EducationalOfferService = inject(EducationalOfferService);
  private organizationService: OrganizationDBService = inject(OrganizationDBService);
  private authService: AuthService = inject(AuthService);

  ngOnInit() {
    this.route.paramMap.pipe(
      concatMap(params => {
        const offerId = params.get('dynamicValue') || '';
        return this.eduOfferService.getEducationalOffer(offerId);
      }),
      concatMap( (offer: EducationalOffer | undefined) => {
        if (offer) this.educationalOffer = offer;
        const userData$ = this.authService.getUserState();
        const userOrgs$ = this.organizationService.getUserOrganizations();
        return combineLatest([userData$, userOrgs$]);
      })
    ).subscribe(
      ([userData, orgsList]) => {
        const userOrgIds = orgsList.map(org => org._id);
        if (!this.educationalOffer || !((this.educationalOffer.orgId && userOrgIds.includes(this.educationalOffer.orgId)) || (userData && this.educationalOffer.userId === userData.uid))) {
          this.exitWithoutSavingService.bypassGuard.next(true);
          this.router.navigate(['/not_found']);
        }
      }
    );
  }
}