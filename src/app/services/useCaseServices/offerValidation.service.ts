import { Injectable } from '@angular/core';
import { EducationalOffer } from '../../model/coreModel/educationalOffer';
import { Lecture } from '../../model/coreModel/lecture';
import { Course } from '../../model/coreModel/course';
import { Module } from '../../model/coreModel/module';
import { CurriculumNode } from '../../model/coreModel/curriculumNode';

@Injectable({
  providedIn: 'root',
})
export class OfferValidationService {

  public validateEducationalOffer(offer: EducationalOffer): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    this.validateOfferFields(offer, errors);

    for (const node of offer.getAllNodes()) {
      this.validateNode(node, errors);
    }

    return errors;
  }

  private addError(errors: Record<string, string[]>, path: string, message: string) {
    (errors[path] ??= []).push(message);
  }

  private isBlank(value?: string | null): boolean {
    return !value || value.trim().length === 0;
  }

  private isValidDate(value?: Date): boolean {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }

  private validateOfferFields(offer: EducationalOffer, errors: Record<string, string[]>): void {
    if (!this.isValidDate(offer.createdAt)) {
      this.addError(errors, 'createdAt', 'Creation date is invalid.');
    }

    if (offer.updatedAt && !this.isValidDate(offer.updatedAt)) {
      this.addError(errors, 'updatedAt', 'Update date is invalid.');
    }

    if (this.isBlank(offer.userId)) {
      this.addError(errors, 'userId', 'User ID is required.');
    }

    if (this.isBlank(offer.orgId)) {
      this.addError(errors, 'orgId', 'Organization is required.');
    }
  }

  private validateNode(node: CurriculumNode, errors: Record<string, string[]>): void {
    const base = `${node.id}`;

    if (this.isBlank(node.name)) {
      this.addError(errors, `${base}.name`, 'Name is required.');
    }

    if (this.isBlank(node.description)) {
      this.addError(errors, `${base}.description`, 'Description is required.');
    }

    if (node.bokConcepts.length === 0) {
      this.addError(errors, `${base}.bokConcepts`, 'At least one BoK concept is required.');
    }

    if (node.eqf < 1 || node.eqf > 8) {
      this.addError(errors, `${base}.eqf`, 'EQF level must be between 1 and 8.');
    }

    if (node.ects <= 0) {
      this.addError(errors, `${base}.ects`, 'Workload must be greater than zero.');
    }

    if (node.timeRequired.value <= 0) {
      this.addError(errors, `${base}.timeRequired`, 'Time required must be greater than zero.');
    }

    if (node.studyAreas.length === 0) {
      this.addError(errors, `${base}.studyAreas`, 'At least one study area is required.');
    }

    if (node.transversalSkills.length === 0 && node.customTransversalSkills.length === 0) {
      this.addError(errors, `${base}.transversalSkills`, 'At least one transversal skill is required.');
    }

    if (node.learningObjectives.length === 0) {
      this.addError(errors, `${base}.learningObjectives`, 'At least one learning objective is required.');
    }

    if (node.affiliations.length === 0) {
      this.addError(errors, `${base}.affiliations`, 'At least one affiliation is required.');
    }

    node.affiliations.forEach((affiliation, index) => {
      if (this.isBlank(affiliation.name)) {
        this.addError(errors, `${base}.affiliations.${index}.name`, 'Affiliation name is required.');
      }
    });

    if (node instanceof Lecture) {
      this.validateLecture(node, errors, base);
    }

    if (node instanceof Course) {
      this.validateCourse(node, errors, base);
    }

    if (node instanceof Module) {
      this.validateModule(node, errors, base);
    }
  }

  private validateLecture(node: Lecture, errors: Record<string, string[]>, base: string): void {
    if (typeof node.isPractical !== 'boolean') {
      this.addError(errors, `${base}.isPractical`, 'isPractical is required.');
    }
  }

  private validateCourse(node: Course, errors: Record<string, string[]>, base: string): void {
    if (this.isBlank(node.assesment)) {
      this.addError(errors, `${base}.assesment`, 'Assessment is required.');
    }
  }

  private validateModule(node: Module, errors: Record<string, string[]>, base: string): void {
    if (node.moduleType === undefined || node.moduleType === null) {
      this.addError(errors, `${base}.moduleType`, 'Module type is required.');
    }
  }
}
