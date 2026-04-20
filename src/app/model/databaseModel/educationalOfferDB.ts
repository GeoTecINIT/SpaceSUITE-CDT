import { Timestamp } from "@angular/fire/firestore";
import { Affiliation } from "../coreModel/affiliation";

export class EducationalOfferDB {
  public readonly id: string;
  public root: string;

  public isPublic: boolean;
  public createdAt: Timestamp;
  public updatedAt?: Timestamp;

  public userId: string;
  public orgId: string;
  public orgName: string;
  public division: string;

  constructor(partialOffer?: Partial<EducationalOfferDB>) {
    this.id = partialOffer?.id || '';
    this.root = partialOffer?.root || '';
    this.isPublic = partialOffer?.isPublic ?? false;
    this.createdAt = partialOffer?.createdAt || Timestamp.fromDate(new Date());
    this.updatedAt = partialOffer?.updatedAt;  
    this.userId = partialOffer?.userId || '';
    this.orgId = partialOffer?.orgId || '';
    this.orgName = partialOffer?.orgName || '';
    this.division = partialOffer?.division || '';
  }

  public toPlainObject(): any {
    return {
      id: this.id,
      root: this.root,
      isPublic: this.isPublic,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt ? this.updatedAt : undefined,
      userId: this.userId,
      orgId: this.orgId,
      orgName: this.orgName,
      division: this.division,
    };
  }
}