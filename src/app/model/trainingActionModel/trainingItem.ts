export enum WorkloadUnit {
  ECTS = "ECTS",
  Hours = "Hours"
}

export class TrainingItem {
  // SpaceSuite Metadata
  _id: string;
  title: string
  creators: string[];
  subject: string[];
  description: string;
  abstract: string;
  learningOutcomes: string[];
  audience: string[];
  created: any;
  publisher: string;
  url: string;
  language?: string;
  source?: string;
  educationLevel: string[];
  tableOfContents: string[];
  workload?: number;
  workloadUnit: WorkloadUnit;
  prerequisites: string[];
  assessment: string[];
  concepts: string[];
  
  // Training Catalogue Metadata
  image: string;
  orgId?: string;
  orgName?: string;
  division?: string;
  userId: string;
  isPublic: boolean;
  updatedAt: any;

  // BMT required Metadata
  collection: string;
  collectionDisplay: string;
  type: number;
  hasMetadata: string;

  constructor(data?: Partial<TrainingItem>) {
    this._id = data?._id ?? '';
    this.title = data?.title ?? '';
    this.creators = data?.creators ?? [];
    this.subject = data?.subject ?? [];
    this.description = data?.description ?? '';
    this.abstract = data?.abstract ?? '';
    this.learningOutcomes = data?.learningOutcomes ?? [];
    this.audience = data?.audience ?? [];
    this.created = data?.created ?? new Date();
    this.publisher = data?.publisher ?? '';
    this.url = data?.url ?? '';
    this.language = data?.language;
    this.source = data?.source;
    this.educationLevel = data?.educationLevel ?? [];
    this.tableOfContents = data?.tableOfContents ?? [];
    this.workload = data?.workload;
    this.workloadUnit = data?.workloadUnit ?? WorkloadUnit.ECTS;
    this.prerequisites = data?.prerequisites ?? [];
    this.assessment = data?.assessment ?? [];
    this.concepts = data?.concepts ?? [];
    this.image = data?.image ?? '';
    this.orgId = data?.orgId;
    this.orgName = data?.orgName;
    this.division = data?.division;
    this.userId = data?.userId ?? '';
    this.isPublic = data?.isPublic ?? false;
    this.updatedAt = data?.updatedAt ?? new Date();
    this.collection = data?.collection ?? 'TrainingMaterials';
    this.collectionDisplay = data?.collectionDisplay ?? 'TrainingMaterials';
    this.type = data?.type ?? 4;
    this.hasMetadata = data?.hasMetadata ?? 'True';
    this.formatUrl()
  }

  public toPlain(): Record<string, any> {
    return {
      _id: this._id,
      title: this.title,
      creators: this.creators,
      subject: this.subject,
      description: this.description,
      abstract: this.abstract,
      learningOutcomes: this.learningOutcomes,
      audience: this.audience,
      created: this.created,
      publisher: this.publisher,
      url: this.url,
      language: this.language || null,
      source: this.source || "",
      educationLevel: this.educationLevel,
      tableOfContents: this.tableOfContents,
      workload: this.workload || null,
      workloadUnit: this.workloadUnit,
      prerequisites: this.prerequisites,
      assessment: this.assessment,
      concepts: this.concepts,
      image: this.image,
      orgId: this.orgId,
      orgName: this.orgName,
      division: this.division,
      userId: this.userId,
      isPublic: this.isPublic,
      updatedAt: this.updatedAt,
      collection: this.collection,
      collectionDisplay: this.collectionDisplay,
      type: this.type,
      hasMetadata: this.hasMetadata
    };
  }

  // This method maintains compatibility with old items that represent malformed URLs
  private formatUrl() {
    const startsWithHttp = (url: string): boolean => /^https?:\/\//.test(url);
    if (this.url && !startsWithHttp(this.url)) this.url = 'http://' + this.url
  }
}
