export class ESCOSkill {
  public uri: string;
  public skillType: string;
  public reuseLevel: string;
  public preferredLabel: string;
  public description: string;
  public altLabels: string[];

  constructor(escoSkill: Partial<ESCOSkill> | undefined = undefined) {
    this.uri = escoSkill?.uri || "";
    this.skillType = escoSkill?.skillType || "";
    this.reuseLevel = escoSkill?.reuseLevel || "";
    this.preferredLabel = escoSkill?.preferredLabel || "";
    this.description = escoSkill?.description || "";
    this.altLabels = escoSkill?.altLabels || [];
  }

  public toPlainObject(): any {
    return {
      uri: this.uri,
      skillType: this.skillType,
      reuseLevel: this.reuseLevel,
      preferredLabel: this.preferredLabel,
      description: this.description,
      altLabels: this.altLabels,
    };
  }
}