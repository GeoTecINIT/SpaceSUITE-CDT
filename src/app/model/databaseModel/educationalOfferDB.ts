import { Affiliation } from "../coreModel/affiliation";

export class EducationalOfferDB {
  public readonly id: string;
  public root: string;

  public affiliations: Affiliation[];
  public isPublic: boolean;
  public createdAt: Date;
  public updatedAt?: Date;

  public userId: string;
  public orgId: string;
  public orgName: string;
  public division: string;

  constructor(partialOffer?: Partial<EducationalOfferDB>) {
    this.id = partialOffer?.id || '';
    this.root = partialOffer?.root || '';
		this.affiliations = partialOffer?.affiliations || [];
    this.isPublic = partialOffer?.isPublic ?? false;
    this.createdAt = partialOffer?.createdAt || new Date();
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
      affiliations: this.affiliations.map(affiliation => affiliation.toPlainObject()),
      isPublic: this.isPublic,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : undefined,
      userId: this.userId,
      orgId: this.orgId,
      orgName: this.orgName,
      division: this.division,
    };
  }
}