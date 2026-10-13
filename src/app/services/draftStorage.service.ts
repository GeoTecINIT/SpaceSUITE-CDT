import { inject, Injectable } from '@angular/core';
import { EducationalOfferDB } from '../model/databaseModel/educationalOfferDB';
import { EducationalOfferAdapterService } from './databaseServices/educationalOfferAdapter.service';
import { EducationalOffer } from '../model/coreModel/educationalOffer';
import { StudyProgramDB } from '../model/databaseModel/studyProgramDB';
import { CourseDB } from '../model/databaseModel/courseDB';
import { LectureDB } from '../model/databaseModel/lectureDB';
import { GroupingDB } from '../model/databaseModel/groupingDB';
import { DomainError } from '../model/domainError';
import { Timestamp } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root',
})
export class DraftStorageService {
  private educationalOfferAdapter = inject(EducationalOfferAdapterService)
  private readonly offerKey = 'educational-offer-draft';
  private readonly studyProgramKey = 'study-program-draft';
  private readonly lectureKey = 'lecture-draft';
  private readonly courseKey = 'course-draft';
  private readonly groupingKey = 'grouping-draft';

  saveDraft(offer: EducationalOffer): void {
    this.educationalOfferAdapter.toStorage(offer).subscribe(({educationalOffer, curriculumNodes}) => {
      this.setDraft(this.offerKey, educationalOffer);
      const studyPrograms: StudyProgramDB[] = [];
      const courses: CourseDB[] = [];
      const lectures: LectureDB[] =[];
      const groupings: GroupingDB[] = [];
      curriculumNodes.forEach(node => {
        switch(true){
          case node instanceof StudyProgramDB:
            studyPrograms.push(node);
            break;
          case node instanceof CourseDB:
            courses.push(node);
            break;
          case node instanceof LectureDB:
            lectures.push(node);
            break;
          case node instanceof GroupingDB:
            groupings.push(node);
            break;
          default:
            throw new DomainError(
              'NODE_TYPE_INVALID', 
              `Unknown node type: ${node.nodeType}. Cannot save curriculum node with id ${node.id} to local storage.`
            );
        }
      })
      this.setDraft(this.studyProgramKey, studyPrograms);
      this.setDraft(this.courseKey, courses);
      this.setDraft(this.lectureKey, lectures);
      this.setDraft(this.groupingKey, groupings);
    })
  }

  loadDraft(): EducationalOffer | null {
    const plain = this.getDraft<EducationalOfferDB>(this.offerKey);
    const plainStudyPrograms = this.getDraft<StudyProgramDB[]>(this.studyProgramKey) || [];
    const plainCourses= this.getDraft<CourseDB[]>(this.courseKey) || [];
    const plainLectures = this.getDraft<LectureDB[]>(this.lectureKey) || [];
    const plainGroupings = this.getDraft<GroupingDB[]>(this.groupingKey) || [];
    if (plain) {
      plain.createdAt = new Timestamp(plain.createdAt.seconds, plain.createdAt.nanoseconds);
      plain.updatedAt = plain.updatedAt ? new Timestamp(plain.updatedAt.seconds, plain.updatedAt.nanoseconds) : undefined;
      return this.educationalOfferAdapter.fromStorage(plain, [...plainStudyPrograms, ...plainCourses, ...plainLectures, ...plainGroupings])
    }
    return null;
  }

  clearDraft(): void {
    localStorage.removeItem(this.offerKey);
    localStorage.removeItem(this.studyProgramKey);
    localStorage.removeItem(this.courseKey);
    localStorage.removeItem(this.lectureKey);
    localStorage.removeItem(this.groupingKey);
  }

  private setDraft<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private getDraft<T>(key: string): T | null {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    try {
      const payload = JSON.parse(raw) as T;
      return payload;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }
}