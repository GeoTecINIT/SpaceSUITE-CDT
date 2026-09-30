import { Injectable } from '@angular/core';
import { EducationalOffer } from '../model/coreModel/educationalOffer';


@Injectable({
  providedIn: 'root',
})
export class DraftStorageService {
  private readonly storageKey = 'educational-offer-draft';

  saveDraft(item: EducationalOffer): void {
    this.setDraft(this.storageKey, item);
  }

  loadDraft(): EducationalOffer | null {
    const plain = this.getDraft<EducationalOffer>(this.storageKey);
    if (plain) {
      plain.createdAt = new Date(plain.createdAt);
      plain.updatedAt = plain.updatedAt ? new Date(plain.updatedAt) : undefined;
      return new EducationalOffer(plain.root, plain)
    } 
    return null;
  }

  clearDraft(): void {
    localStorage.removeItem(this.storageKey);
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