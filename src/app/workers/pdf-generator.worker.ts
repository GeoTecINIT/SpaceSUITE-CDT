/// <reference lib="webworker" />

import jsPDF from 'jspdf';
import { PdfWorkerPayload } from '../model/pdfWorkerPayload';
import { EducationalOffer } from '../model/coreModel/educationalOffer';
import { CurriculumNode, NodeType } from '../model/coreModel/curriculumNode';
import { StudyProgram } from '../model/coreModel/studyProgram';
import { Course } from '../model/coreModel/course';
import { Module } from '../model/coreModel/module';
import { Lecture } from '../model/coreModel/lecture';

addEventListener('message', ({data}: {data: PdfWorkerPayload}) => {
  const { offer, assets, scaleFactor } = data;
  const doc = new jsPDF();

  if (!assets.watermark) assets.watermark = '';

  addWatermark(doc, assets.watermark);
  let y = 25;

  if (assets.poppinsRegular) {
    doc.addFileToVFS('Poppins-Regular.ttf', assets.poppinsRegular);
    doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
  }
  if (assets.poppinsBold) {
    doc.addFileToVFS('Poppins-Bold.ttf', assets.poppinsBold);
    doc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
  } 
  if (assets.poppinsItalic) {
    doc.addFileToVFS('Poppins-Italic.ttf', assets.poppinsItalic);
    doc.addFont('Poppins-Italic.ttf', 'Poppins', 'italic');
  }

  doc.setLineHeightFactor(scaleFactor);

  const hydratedOffer: EducationalOffer = buildOffer(offer);

  applyMetadata(doc, hydratedOffer);
  y = renderHeader(doc, hydratedOffer, y, assets);
  y = renderIndex(doc, hydratedOffer.root, y, assets);
  y = renderCurriculumNodes(doc, hydratedOffer.root, y, assets);
  renderFooter(doc, assets);

  const blob = doc.output('blob');

  postMessage({
    blob,
    filename: buildFilename(hydratedOffer)
  });
});

/* ============================
    METADATA
============================ */

function applyMetadata(doc: jsPDF, offer: EducationalOffer) {
  doc.setProperties({
    title: `${offer.root.name} - ${offer.root.nodeType} `,
    subject: getSubjectMetadata(offer),
    author: 'SpaceSuite',
    creator: 'SpaceSuite Curriculum Design Tool',
    keywords: 'spacesuite, curriculum design tool, study program, course, lecture',
  });
}

function getSubjectMetadata(offer: EducationalOffer) {
  let subject = '@prefix dc: <http://purl.org/dc/terms/> . @prefix geospacebok: <https://geospacebok.eu/> . ';
  subject = subject + '<> dc:type "' + offer.root.nodeType +'"; <> dc:title "' + offer.root.name + '"';
  offer.getAllNodes().forEach((item: CurriculumNode) => {
    item.bokConcepts.forEach(know => {
      const bokCode = know.split(']', 1)[0].split('[', 2)[1];
      if (bokCode) {
        subject = subject + '; dc:relation geospacebok:' + bokCode;
      }
    });
  });
  subject = subject + '  .';
  return subject;
}

/* ============================
    HEADER
============================ */

function renderHeader(doc: jsPDF, p: EducationalOffer, y: number,  assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  doc.setFontSize(26).setFont('Poppins', 'bold');
  doc.setTextColor('#0e145d');

  const lines = doc.splitTextToSize(p.root.name, 170);
  const linesSize = lines.length * 10.4 * 1.35;
  y = checkEnd(doc, y, linesSize, assets);
  doc.text(lines, 20, y);
  y += linesSize;

  doc.setFontSize(10);
  doc.setFont('Poppins', 'italic');
  doc.text(
    [
      p.division ? p.orgName + ', ' + p.division : p.orgName, 
    ].filter(Boolean).join(' | '),
    20,
    y
  );
  doc.setFont('Poppins', 'normal');
  y += 4 * 1.35;

  doc.text(
    [
      'Type: ' + p.root.nodeType, 
      'EQF ' + p.root.eqf,
      p.root.ects + ' ECTS',
      p.root.timeRequired.value + ' ' + p.root.timeRequired.unit,
    ].filter(Boolean).join(' | '),
    20,
    y
  );
  y += 4 * 1.35;

  doc.text(
    [
      'Created: ' + p.createdAt.toLocaleDateString('en-UK'),
      p.updatedAt ? 'Updated: ' + p.updatedAt.toLocaleDateString('en-UK') : undefined,
      'Visibility: ' + (p.isPublic ? 'Public' : 'Private')
    ].filter(Boolean).join(' | '),
    20,
    y
  );
  y += 4 * 1.35;

  return y;
}

/* ============================
  FOOTER
============================ */

function renderFooter(doc: jsPDF, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }, y = 275): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const footerHeight = doc.internal.pageSize.getHeight() - y;

  doc.setFillColor('#0e145d');
  doc.rect(0, y, pageWidth, footerHeight, 'F');

  const page = doc.getCurrentPageInfo().pageNumber;
  doc.setFontSize(9).setFont('Poppins', 'normal');
  doc.setTextColor('#ffffff');
  doc.text(page.toString(), pageWidth / 2, y + footerHeight / 2 + 1) // + 1 
  doc.setFontSize(10).setFont('Poppins', 'normal');
  doc.setTextColor('#0e145d');

  if (assets.euLogo) {
    const props = doc.getImageProperties(assets.euLogo);
    const imgWidthPx = props.width;
    const imgHeightPx = props.height
    const targetWidth = 30;
    const ratio = imgHeightPx / imgWidthPx;
    const targetHeight = targetWidth * ratio;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(
      assets.euLogo,
      'PNG',
      pageWidth - targetWidth - 20,
      y + footerHeight / 2 - targetHeight / 2,
      targetWidth,
      targetHeight
    );
  }

  if (assets.spaceSuiteLogo) {
    const props = doc.getImageProperties(assets.spaceSuiteLogo);
    const imgWidthPx = props.width;
    const imgHeightPx = props.height
    const targetWidth = 30;
    const ratio = imgHeightPx / imgWidthPx;
    const targetHeight = targetWidth * ratio;
    doc.addImage(
      assets.spaceSuiteLogo,
      'PNG',
      20,
      y + footerHeight / 2 - targetHeight / 2,
      targetWidth,
      targetHeight
    );
  }
}

/* ============================
    INDEX
============================ */

function renderIndex(doc: jsPDF, node: CurriculumNode, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }, level = 0): number {

  if(level === 0) {
    y = sectionTitle(doc, 'Index', y, assets);
    y += 4 * 1.35;
  }
  
  const x = 20 + level * 8;
  const lines = doc.splitTextToSize(node.name, 170);
  for (let i = 0; i < lines.length; i++) {
    if (i == 0) lines[i] = '• ' + lines[i];
    else lines[i] = '   ' + lines[i];
  }
  const linesSize = lines.length * 4 * 1.35;
  y = checkEnd(doc, y, linesSize, assets);
  doc.text(lines, x, y);
  y += linesSize;
  
  for (const child of node.getChildren()) {
    y = renderIndex(doc, child, y, assets, level + 1);
  }

  return y;
}

/* ============================
    CURRICULUM NODE
============================ */


function renderCurriculumNodes(doc: jsPDF, p: CurriculumNode, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  y = sectionTitle(doc, p.name, y, assets);

  y += 4 * 1.35;
  y = checkEnd(doc, y, 0, assets);
  doc.text(
    [
      'Type: ' + p.nodeType, 
      p instanceof Module ? ('Module Type: ' + p.moduleType ) : undefined,
      p instanceof Course && p.courseType ? ('Course Type: ' + p.courseType ) : undefined,
      p instanceof Lecture ? (p.isPractical ? 'Practical' : 'Theorical') : undefined,
      'EQF ' + p.eqf,
      p.ects + ' ECTS',
      p.timeRequired.value + ' ' + p.timeRequired.unit,
    ].filter(Boolean).join(' | '),
    20,
    y
  );
  y += 4 * 1.35;

  y += 4 * 1.35;
  const lines = doc.splitTextToSize(p.description, 170);
  const linesSize = lines.length * 4 * 1.35;
  y = checkEnd(doc, y, linesSize, assets);
  doc.text(lines, 20, y);
  y += linesSize;

  if (p instanceof Course) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Assesment:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    const lines = doc.splitTextToSize(p.assesment, 170);
    const linesSize = lines.length * 4 * 1.35;
    y = checkEnd(doc, y, linesSize, assets);
    doc.text(lines, 20, y);
    y += linesSize;
  }

  if (p.affiliations.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Affiliations:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    p.affiliations.forEach((pre) => {
      const lines = doc.splitTextToSize(pre.name, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      if (pre.url) doc.textWithLink(lines, 20, y, { url: pre.url });
      else doc.text(lines, 20, y);
      y += linesSize;
    });
  }

  if (p.studyAreas.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Study Areas:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    p.studyAreas.forEach((area) => {
      const lines = doc.splitTextToSize(area.getCompleteName(), 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.text(lines, 20, y);
      y += linesSize;
    });
  }

  if (p.bokConcepts.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Knowledge:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    p.bokConcepts.forEach((concept) => {
      const regexMatch = concept.match(/^\[(.*?)\]\s*(.*)$/);
      const lines = doc.splitTextToSize(regexMatch![2], 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.textWithLink(lines, 20, y, { url: 'https://geospacebok.eu/' + regexMatch![1] });
      y += linesSize;
    });
  }

  if (p.transversalSkills.length != 0 || p.customTransversalSkills.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Transversal Skills:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    p.transversalSkills.forEach((skill) => {
      const lines = doc.splitTextToSize(skill.preferredLabel, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.textWithLink(lines, 20, y, { url: skill.uri });
      y += linesSize;
    });
    p.customTransversalSkills.forEach((skill) => {
      const lines = doc.splitTextToSize(skill, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.text(lines, 20, y);
      y += linesSize;
    });
  }

  if (p.prerequisites.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Prerequisites:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    p.prerequisites.forEach((pre) => {
      const lines = doc.splitTextToSize(pre, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.text(lines, 20, y);
      y += linesSize;
    });
  }

  if (p.trainingMaterials.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Training Materials:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    p.trainingMaterials.forEach((pre) => {
      const lines = doc.splitTextToSize(pre.title, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      if (pre.url) doc.textWithLink(lines, 20, y, { url: pre.url });
      else doc.text(lines, 20, y);
      y += linesSize;
    });
  }

  if (p.learningObjectives.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Learning Outcomes:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    p.learningObjectives.forEach((pre) => {
      const lines = doc.splitTextToSize(pre, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.text(lines, 20, y);
      y += linesSize;
    });
  }

  if (p.bibliography.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Bibliography:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    p.bibliography.forEach((pre) => {
      const lines = doc.splitTextToSize(pre, 170);
      for (let i = 0; i < lines.length; i++) {
        if (i == 0) lines[i] = '• ' + lines[i];
        else lines[i] = '   ' + lines[i];
      }
      const linesSize = lines.length * 4 * 1.35;
      y = checkEnd(doc, y, linesSize, assets);
      doc.text(lines, 20, y);
      y += linesSize;
    });
  }

  p.getChildren().forEach(node => {
    y = renderCurriculumNodes(doc, node, y, assets)
  });

  return y;
}

/* ============================
    HELPERS
============================ */

function sectionTitle(doc: jsPDF, title: string, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  y += 8 * 1.35;
  y = checkEnd(doc, y, 0, assets);  
  doc.setFontSize(14).setFont('Poppins', 'bold');
  doc.setTextColor('#0e145d');
  doc.text(title, 20, y);
  doc.setFontSize(10).setFont('Poppins', 'normal');
  doc.setTextColor('#0e145d');
  return y + 2 * 1.35;
}

function checkEnd(doc: jsPDF, y: number, contentSize: number = 0, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  if (y + contentSize > 270) {
    renderFooter(doc, assets);
    doc.addPage();
    addWatermark(doc, assets.watermark || '');
    return 20;
  }
  return y;
}

function addWatermark(doc: jsPDF, watermark: string): void {
  if (watermark) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.addImage(watermark, 'PNG', 0, 0, pageWidth, pageHeight);
  }
}

function buildFilename(p: EducationalOffer): string {
  return `${p.root.name.replace(/\s+/g, '_')}_Educational_Offer.pdf`;
}

function buildOffer(offer: EducationalOffer): EducationalOffer {
  const newRoot = buildNode(offer.root);
  return new EducationalOffer(newRoot, offer);
}

function buildNode(node: CurriculumNode): CurriculumNode {
  let newNode: CurriculumNode;
  switch(node.nodeType) {
    case NodeType.StudyProgram:
      newNode = new StudyProgram(node, node.id);
      break;
    case NodeType.Module:
      newNode = new Module(node, node.id);
      break;
    case NodeType.Course:
      newNode = new Course(node, node.id);
      break;
    case NodeType.Lecture:
      newNode = new Lecture(node, node.id);
      break;
    default:
      newNode = new StudyProgram(node, node.id);
      break;
  }

  for (const child of (node as any).children ?? []) {
    if (!newNode.getChildren().find(node => node.id === child.id)) {
      const newChild = buildNode(child);
      newNode.addChild(newChild);
    }    
  }

  return newNode;
}