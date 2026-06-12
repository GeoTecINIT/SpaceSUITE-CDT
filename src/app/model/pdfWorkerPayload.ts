import { EducationalOffer } from './coreModel/educationalOffer';

export interface PdfWorkerPayload {
  offer: EducationalOffer;
  scaleFactor: number;
  assets: {
    poppinsRegular?: string;
    poppinsBold?: string;
    poppinsItalic?: string;
    watermark?: string;
    euLogo?: string;
    spaceSuiteLogo?: string;
  };
}