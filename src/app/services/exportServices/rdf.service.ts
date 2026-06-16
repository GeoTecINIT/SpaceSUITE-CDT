import { Injectable } from '@angular/core';
import { EducationalOffer } from '../../model/coreModel/educationalOffer';
import { CurriculumNode, NodeType } from '../../model/coreModel/curriculumNode';

@Injectable({
  providedIn: 'root'
})
export class RdfService {

  /* ============================
     Public API
     ============================ */

  getRdfTtlUrl(model: EducationalOffer): string {
    const blob = new Blob([this.convertEducationalOfferToTurtle(model)], { type: 'text/ttl' });
    return window.URL.createObjectURL(blob);
  }

  getRdfXmlUrl(model: EducationalOffer): string {
    const blob = new Blob([this.convertEducationalOfferToRdfXml(model)], { type: 'text/xml' });
    console.log('hola')
    return window.URL.createObjectURL(blob);
  }

  getRdfaUrl(model: EducationalOffer): string {
    const blob = new Blob([this.convertEducationalOfferToRDFa(model)], { type: 'text/html' });
    return window.URL.createObjectURL(blob);
  }

  /* ============================
     Turtle
     ============================ */

  private convertEducationalOfferToTurtle(model: EducationalOffer): string {
    let additionalObjects = '';

    let ttl =
  `@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix elm: <http://data.europa.eu/snb/model/elm> .
@prefix geospacebok: <https://geospacebok.eu/> .

`;

    ttl += `geospacebok:EducationalOffer rdf:type rdfs:Class .\n`;
    ttl += `geospacebok:StudyProgram rdf:type rdfs:Class .\n`;
    ttl += `geospacebok:Grouping rdf:type rdfs:Class .\n`;
    ttl += `geospacebok:Course rdf:type rdfs:Class .\n`;
    ttl += `geospacebok:Lecture rdf:type rdfs:Class .\n\n`;

    const offerUri = `<https://geospacebok.eu/educational-offer/${model.id}>`;
    const rootNode = `ROOT`;

    ttl += `${offerUri} a geospacebok:EducationalOffer ;\n`;

    ttl += `  dcterms:hasPart _:${rootNode} ;\n`;

    if (model.createdAt)
      ttl += `  dcterms:created "${model.createdAt instanceof Date ? model.createdAt.toISOString() : model.createdAt}" ;\n`;

    if (model.updatedAt)
      ttl += `  dcterms:modified "${model.updatedAt instanceof Date ? model.updatedAt.toISOString() : model.updatedAt}" ;\n`;

    ttl += `  dcterms:accessRights "${model.isPublic ? 'public' : 'private'}" ;\n`;

    ttl = ttl.trim().replace(/;$/, '.') + '\n\n';

    additionalObjects += this.curriculumNodeToTurtle(model.root, rootNode);
    additionalObjects += `_:ECTS\n`;
    additionalObjects += `  rdf:type elm:CreditPoint ;\n`;
    additionalObjects += `  dcterms:title "ECTS" .\n\n`;

    ttl += additionalObjects;
    return ttl;
  }

  private curriculumNodeToTurtle(node: CurriculumNode, nodeRef: string): string {
    let ttl = `_:${nodeRef} a ${this.getCurriculumNodeType(node)} ;\n`;
    let additionalObjects = '';

    if (node.name)
      ttl += `  dcterms:title "${this.escape(node.name)}" ;\n`;

    if (node.description)
      ttl += `  dcterms:description "${this.escape(node.description)}" ;\n`;

    if (node.prerequisites) {
      node.prerequisites.forEach((prerequisite: string, index: number) => {
        ttl += `  elm:entryRequirement _:${nodeRef}_PREREQUISITE${index} ;\n`;
        additionalObjects += `_:${nodeRef}_PREREQUISITE${index}\n`;
        additionalObjects += `  rdf:type elm:Note ;\n`;
        additionalObjects += `  dcterms:description "${prerequisite}" .\n\n`;
      });
    }

    if (node.learningObjectives) {
      node.learningObjectives.forEach((outcome: string, index: number) => {
        ttl += `  elm:learningOutcome _:${nodeRef}_LO${index} ;\n`;
        additionalObjects += `_:${nodeRef}_LO${index}\n`;
        additionalObjects += `  rdf:type elm:LearningOutcome ;\n`;
        additionalObjects += `  dcterms:description "${outcome}" .\n\n`
      });
    }

    if (node.eqf)
      ttl += `  elm:EQFLevel "${node.eqf}" ;\n`;

    if (node.ects) {
      ttl += `  elm:creditPoint _:ECTS ;\n`;
      ttl += `  elm:creditReceived "${node.ects}" ;\n`;
    }

    if (node.timeRequired)
      ttl += `  elm:duration "${node.timeRequired.value}  ${node.timeRequired.unit}" ;\n`;

    if (node.bibliography) {
      node.bibliography.forEach((bib: string) => {
        ttl += `  dcterms:bibliographicCitation "${this.escape(bib)}" ;\n`;
      });
    }

    node.bokConcepts?.forEach(c => {
      ttl += `  dcterms:relation geospacebok:${this.escape(c)} ;\n`;
    });

    node.studyAreas?.forEach(area => {
      ttl += `  elm:ISCEDFCode "${this.escape(area.code)}" ;\n`;
    });

    node.transversalSkills?.forEach(skill => {
      ttl += `  elm:relatedESCOSkill <${skill.uri}> ;\n`;
    });

    node.customTransversalSkills?.forEach((skill: string) => {
      ttl += `  elm:relatedSkill "${this.escape(skill)}" ;\n`;
    });

    node.trainingMaterials?.forEach((mat, index) => {
      if (mat.url)
        ttl += `  elm:hasPart <${mat.url}> ;\n`;
      else {
        ttl += `  elm:hasPart _:${nodeRef}_MATERIAL${index} ;\n`;
        additionalObjects += `_:${nodeRef}_MATERIAL${index}\n`;
        additionalObjects += `  dcterms:title "${mat.title}" .\n\n`;
      }
    });

    node.affiliations?.forEach((aff, index) => {
      if (aff.url)
        ttl += `  elm:providedBy <${aff.url}> ;\n`;
      else {
        ttl += `  elm:providedBy _:${nodeRef}_PROVIDER${index} ;\n`;
        additionalObjects += `_:${nodeRef}_PROVIDER${index}\n`;
        additionalObjects += `  rdf:type dcterms:Agent ;\n`;
        additionalObjects += `  dcterms:title "${aff.name}" .\n\n`;
      }
    });

    const children = node.getChildren();
    let childBlocks = '';

    children.forEach((child, i) => {
      const childRef = `${nodeRef}_CHILD${i}`;

      ttl += `  elm:hasPart _:${childRef} ;\n`;
      childBlocks += this.curriculumNodeToTurtle(child, childRef);
    });

    ttl = ttl.trim().replace(/;$/, '.') + '\n\n';
    ttl += additionalObjects;
    ttl += childBlocks;

    return ttl;
  }

  private getCurriculumNodeType(node: CurriculumNode): string {
    switch (node.nodeType) {
      case NodeType.StudyProgram:
        return 'geospacebok:StudyProgram';
      case NodeType.Grouping:
        return 'geospacebok:Grouping';
      case NodeType.Course:
        return 'geospacebok:Course';
      case NodeType.Lecture:
        return 'geospacebok:Lecture';
      default:
        return 'geospacebok:CurriculumNode';
    }
  }

  /* ============================
   RDF/XML
   ============================ */

  private convertEducationalOfferToRdfXml(model: EducationalOffer): string {
    const rdfNS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    const rdfsNS = 'http://www.w3.org/2000/01/rdf-schema#';
    const dctermsNS = 'http://purl.org/dc/terms/';
    const elmNS = 'http://data.europa.eu/snb/model/elm/';
    const uriBase = 'https://geospacebok.eu';
    const geospacebokNS = `${uriBase}/`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rdf:RDF xmlns:rdf="${rdfNS}" xmlns:rdfs="${rdfsNS}" xmlns:dcterms="${dctermsNS}" xmlns:elm="${elmNS}" xmlns:geospacebok="${geospacebokNS}">\n\n`;

    ['EducationalOffer', 'StudyProgram', 'Grouping', 'Course', 'Lecture', 'CurriculumNode'].forEach(c => {
      xml += `  <rdf:Description rdf:about="${geospacebokNS}${c}">\n`;
      xml += `    <rdf:type rdf:resource="${rdfsNS}Class"/>\n`;
      xml += `  </rdf:Description>\n\n`;
    });

    xml += `  <rdf:Description rdf:about="${uriBase}/credit-point/ECTS">\n`;
    xml += `    <rdf:type rdf:resource="${elmNS}CreditPoint"/>\n`;
    xml += `    <dcterms:title>ECTS</dcterms:title>\n`;
    xml += `  </rdf:Description>\n\n`;

    const offerUri = `${uriBase}/educational-offer/${this.escapeXml(String(model.id))}`;

    xml += `  <rdf:Description rdf:about="${offerUri}">\n`;
    xml += `    <rdf:type rdf:resource="${geospacebokNS}EducationalOffer"/>\n`;

    if (model.createdAt) {
      const created = model.createdAt instanceof Date
        ? model.createdAt.toISOString()
        : String(model.createdAt);
      xml += `    <dcterms:created>${this.escapeXml(created)}</dcterms:created>\n`;
    }

    if (model.updatedAt) {
      const updated = model.updatedAt instanceof Date
        ? model.updatedAt.toISOString()
        : String(model.updatedAt);
      xml += `    <dcterms:modified>${this.escapeXml(updated)}</dcterms:modified>\n`;
    }

    xml += `    <dcterms:accessRights>${model.isPublic ? 'public' : 'private'}</dcterms:accessRights>\n`;
    xml += `    <dcterms:hasPart>\n`;
    xml += this.curriculumNodeToRdfXml(model.root, 3, elmNS, geospacebokNS, dctermsNS, uriBase);
    xml += `    </dcterms:hasPart>\n`;
    xml += `  </rdf:Description>\n\n`;

    xml += `</rdf:RDF>\n`;
    return xml;
  }

  private curriculumNodeToRdfXml(
    node: CurriculumNode,
    indentLevel: number,
    elmNS: string,
    geospacebokNS: string,
    dctermsNS: string,
    uriBase: string
  ): string {
    const indent = (level: number) => '  '.repeat(level);
    let xml = `${indent(indentLevel)}<rdf:Description>\n`;

    xml += `${indent(indentLevel + 1)}<rdf:type rdf:resource="${this.getCurriculumNodeTypeUri(node, geospacebokNS)}"/>\n`;

    if (node.name) {
      xml += `${indent(indentLevel + 1)}<dcterms:title>${this.escapeXml(node.name)}</dcterms:title>\n`;
    }

    if (node.description) {
      xml += `${indent(indentLevel + 1)}<dcterms:description>${this.escapeXml(node.description)}</dcterms:description>\n`;
    }

    node.prerequisites?.forEach((prerequisite: string) => {
      xml += `${indent(indentLevel + 1)}<elm:entryRequirement>\n`;
      xml += `${indent(indentLevel + 2)}<rdf:Description>\n`;
      xml += `${indent(indentLevel + 3)}<rdf:type rdf:resource="${elmNS}Note"/>\n`;
      xml += `${indent(indentLevel + 3)}<dcterms:description>${this.escapeXml(prerequisite)}</dcterms:description>\n`;
      xml += `${indent(indentLevel + 2)}</rdf:Description>\n`;
      xml += `${indent(indentLevel + 1)}</elm:entryRequirement>\n`;
    });

    node.learningObjectives?.forEach((outcome: string) => {
      xml += `${indent(indentLevel + 1)}<elm:learningOutcome>\n`;
      xml += `${indent(indentLevel + 2)}<rdf:Description>\n`;
      xml += `${indent(indentLevel + 3)}<rdf:type rdf:resource="${elmNS}LearningOutcome"/>\n`;
      xml += `${indent(indentLevel + 3)}<dcterms:description>${this.escapeXml(outcome)}</dcterms:description>\n`;
      xml += `${indent(indentLevel + 2)}</rdf:Description>\n`;
      xml += `${indent(indentLevel + 1)}</elm:learningOutcome>\n`;
    });

    if (node.eqf) {
      xml += `${indent(indentLevel + 1)}<elm:EQFLevel>${this.escapeXml(String(node.eqf))}</elm:EQFLevel>\n`;
    }

    if (node.ects) {
      xml += `${indent(indentLevel + 1)}<elm:creditPoint rdf:resource="${uriBase}/credit-point/ECTS"/>\n`;
      xml += `${indent(indentLevel + 1)}<elm:creditReceived>${this.escapeXml(String(node.ects))}</elm:creditReceived>\n`;
    }

    if (node.timeRequired) {
      xml += `${indent(indentLevel + 1)}<elm:duration>${this.escapeXml(`${node.timeRequired.value} ${node.timeRequired.unit}`)}</elm:duration>\n`;
    }

    node.bibliography?.forEach((bib: string) => {
      xml += `${indent(indentLevel + 1)}<dcterms:bibliographicCitation>${this.escapeXml(bib)}</dcterms:bibliographicCitation>\n`;
    });

    node.bokConcepts?.forEach((c: string) => {
      xml += `${indent(indentLevel + 1)}<dcterms:relation rdf:resource="${geospacebokNS}${this.escapeXml(c)}"/>\n`;
    });

    node.studyAreas?.forEach(area => {
      xml += `${indent(indentLevel + 1)}<elm:ISCEDFCode>${this.escapeXml(area.code)}</elm:ISCEDFCode>\n`;
    });

    node.transversalSkills?.forEach(skill => {
      xml += `${indent(indentLevel + 1)}<elm:relatedESCOSkill rdf:resource="${this.escapeXml(skill.uri)}"/>\n`;
    });

    node.customTransversalSkills?.forEach((skill: string) => {
      xml += `${indent(indentLevel + 1)}<elm:relatedSkill>${this.escapeXml(skill)}</elm:relatedSkill>\n`;
    });

    node.trainingMaterials?.forEach(mat => {
      if (mat.url) {
        xml += `${indent(indentLevel + 1)}<elm:hasPart rdf:resource="${this.escapeXml(mat.url)}"/>\n`;
      } else {
        xml += `${indent(indentLevel + 1)}<elm:hasPart>\n`;
        xml += `${indent(indentLevel + 2)}<rdf:Description>\n`;
        if (mat.title) {
          xml += `${indent(indentLevel + 3)}<dcterms:title>${this.escapeXml(mat.title)}</dcterms:title>\n`;
        }
        xml += `${indent(indentLevel + 2)}</rdf:Description>\n`;
        xml += `${indent(indentLevel + 1)}</elm:hasPart>\n`;
      }
    });

    node.affiliations?.forEach(aff => {
      if (aff.url) {
        xml += `${indent(indentLevel + 1)}<elm:providedBy rdf:resource="${this.escapeXml(aff.url)}"/>\n`;
      } else {
        xml += `${indent(indentLevel + 1)}<elm:providedBy>\n`;
        xml += `${indent(indentLevel + 2)}<rdf:Description>\n`;
        xml += `${indent(indentLevel + 3)}<rdf:type rdf:resource="${dctermsNS}Agent"/>\n`;
        if (aff.name) {
          xml += `${indent(indentLevel + 3)}<dcterms:title>${this.escapeXml(aff.name)}</dcterms:title>\n`;
        }
        xml += `${indent(indentLevel + 2)}</rdf:Description>\n`;
        xml += `${indent(indentLevel + 1)}</elm:providedBy>\n`;
      }
    });

    const children = node.getChildren();
    children.forEach(child => {
      xml += `${indent(indentLevel + 1)}<elm:hasPart>\n`;
      xml += this.curriculumNodeToRdfXml(child, indentLevel + 2, elmNS, geospacebokNS, dctermsNS, uriBase);
      xml += `${indent(indentLevel + 1)}</elm:hasPart>\n`;
    });

    xml += `${indent(indentLevel)}</rdf:Description>\n`;
    return xml;
  }

  private getCurriculumNodeTypeUri(node: CurriculumNode, geospacebokNS: string): string {
    switch (node.nodeType) {
      case NodeType.StudyProgram:
        return `${geospacebokNS}StudyProgram`;
      case NodeType.Grouping:
        return `${geospacebokNS}Grouping`;
      case NodeType.Course:
        return `${geospacebokNS}Course`;
      case NodeType.Lecture:
        return `${geospacebokNS}Lecture`;
      default:
        return `${geospacebokNS}CurriculumNode`;
    }
  }

  /* ============================
      RDFa 
      ============================ */

  private convertEducationalOfferToRDFa(model: EducationalOffer): string {
    const dcterms = 'http://purl.org/dc/terms/';
    const geospacebok = 'https://geospacebok.eu/';
    const elm = 'http://data.europa.eu/snb/model/elm/';
    const uriBase = 'https://geospacebok.eu';

    let html =
`<div
  vocab="${dcterms}"
  prefix="geospacebok: ${geospacebok} elm: ${elm}"
  about="${uriBase}/educational-offer/${this.escapeHtml(String(model.id))}"
  typeof="geospacebok:EducationalOffer"
>\n`;

    if (model.createdAt) {
      const created = model.createdAt instanceof Date
        ? model.createdAt.toISOString()
        : String(model.createdAt);
      html += `  <time property="created" datetime="${this.escapeHtml(created)}">${this.escapeHtml(created)}</time><br/>\n`;
    }

    if (model.updatedAt) {
      const updated = model.updatedAt instanceof Date
        ? model.updatedAt.toISOString()
        : String(model.updatedAt);
      html += `  <time property="modified" datetime="${this.escapeHtml(updated)}">${this.escapeHtml(updated)}</time><br/>\n`;
    }

    html += `  <span property="accessRights">${model.isPublic ? 'public' : 'private'}</span><br/>\n`;
    html += `  <div rel="hasPart" about="#ROOT" typeof="${this.getCurriculumNodeTypeRDFa(model.root)}">\n`;
    html += this.curriculumNodeToRDFa(model.root, 'ROOT', 2, uriBase);
    html += `  </div>\n`;
    html += `</div>\n`;

    return html;
  }

  private curriculumNodeToRDFa(
    node: CurriculumNode,
    nodeId: string,
    indentLevel: number = 0,
    uriBase: string = 'https://geospacebok.eu'
  ): string {
    const indent = '  '.repeat(indentLevel);
    const childIndent = '  '.repeat(indentLevel + 1);
    let html = '';

    if (node.name) {
      html += `${indent}<span property="title">${this.escapeHtml(node.name)}</span><br/>\n`;
    }

    if (node.description) {
      html += `${indent}<span property="description">${this.escapeHtml(node.description)}</span><br/>\n`;
    }

    node.prerequisites?.forEach((prerequisite: string, index: number) => {
      const prereqId = `${nodeId}_PREREQUISITE${index}`;
      html +=
`${indent}<div rel="elm:entryRequirement" about="#${prereqId}" typeof="elm:Note">\n` +
`${childIndent}<span property="description">${this.escapeHtml(prerequisite)}</span><br/>\n` +
`${indent}</div>\n`;
    });

    node.learningObjectives?.forEach((outcome: string, index: number) => {
      const loId = `${nodeId}_LO${index}`;
      html +=
`${indent}<div rel="elm:learningOutcome" about="#${loId}" typeof="elm:LearningOutcome">\n` +
`${childIndent}<span property="description">${this.escapeHtml(outcome)}</span><br/>\n` +
`${indent}</div>\n`;
    });

    if (node.eqf !== undefined && node.eqf !== null) {
      html += `${indent}<span property="elm:EQFLevel">${this.escapeHtml(String(node.eqf))}</span><br/>\n`;
    }

    if (node.ects !== undefined && node.ects !== null) {
      html += `${indent}<a rel="elm:creditPoint" href="${uriBase}/credit-point/ECTS">ECTS</a><br/>\n`;
      html += `${indent}<span property="elm:creditReceived">${this.escapeHtml(String(node.ects))}</span><br/>\n`;
    }

    if (node.timeRequired) {
      html += `${indent}<span property="elm:duration">${this.escapeHtml(`${node.timeRequired.value} ${node.timeRequired.unit}`)}</span><br/>\n`;
    }

    node.bibliography?.forEach((bib: string) => {
      html += `${indent}<span property="bibliographicCitation">${this.escapeHtml(bib)}</span><br/>\n`;
    });

    node.bokConcepts?.forEach((c: string) => {
      const conceptUri = `${uriBase}/${encodeURIComponent(c)}`;
      html += `${indent}<a rel="relation" href="${this.escapeHtml(conceptUri)}">${this.escapeHtml(c)}</a><br/>\n`;
    });

    node.studyAreas?.forEach(area => {
      html += `${indent}<span property="elm:ISCEDFCode">${this.escapeHtml(area.code)}</span><br/>\n`;
    });

    node.transversalSkills?.forEach(skill => {
      html += `${indent}<a rel="elm:relatedESCOSkill" href="${this.escapeHtml(skill.uri)}">${this.escapeHtml(skill.uri)}</a><br/>\n`;
    });

    node.customTransversalSkills?.forEach((skill: string) => {
      html += `${indent}<span property="elm:relatedSkill">${this.escapeHtml(skill)}</span><br/>\n`;
    });

    node.trainingMaterials?.forEach((mat, index) => {
      const materialId = `${nodeId}_MATERIAL${index}`;

      if (mat.url) {
        html += `${indent}<a rel="elm:hasPart" href="${this.escapeHtml(mat.url)}">${this.escapeHtml(mat.title || mat.url)}</a><br/>\n`;
      } else {
        html += `${indent}<div rel="elm:hasPart" about="#${materialId}">\n`;
        if (mat.title) {
          html += `${childIndent}<span property="title">${this.escapeHtml(mat.title)}</span><br/>\n`;
        }
        html += `${indent}</div>\n`;
      }
    });

    node.affiliations?.forEach((aff, index) => {
      const providerId = `${nodeId}_PROVIDER${index}`;

      if (aff.url) {
        html += `${indent}<a rel="elm:providedBy" href="${this.escapeHtml(aff.url)}">${this.escapeHtml(aff.name || aff.url)}</a><br/>\n`;
      } else {
        html += `${indent}<div rel="elm:providedBy" about="#${providerId}" typeof="dcterms:Agent">\n`;
        if (aff.name) {
          html += `${childIndent}<span property="title">${this.escapeHtml(aff.name)}</span><br/>\n`;
        }
        html += `${indent}</div>\n`;
      }
    });

    const children = node.getChildren();
    children.forEach((child, i) => {
      const childId = `${nodeId}_CHILD${i}`;
      html += `${indent}<div rel="elm:hasPart" about="#${childId}" typeof="${this.getCurriculumNodeTypeRDFa(child)}">\n`;
      html += this.curriculumNodeToRDFa(child, childId, indentLevel + 1, uriBase);
      html += `${indent}</div>\n`;
    });

    return html;
  }

  private getCurriculumNodeTypeRDFa(node: CurriculumNode): string {
    switch (node.nodeType) {
      case NodeType.StudyProgram:
        return 'geospacebok:StudyProgram';
      case NodeType.Grouping:
        return 'geospacebok:Grouping';
      case NodeType.Course:
        return 'geospacebok:Course';
      case NodeType.Lecture:
        return 'geospacebok:Lecture';
      default:
        return 'geospacebok:CurriculumNode';
    }
  }



  /* ============================
     Escaping helpers
     ============================ */

  private escape(str: string): string {
    console.log('Escaping string:', str);
    const inlineString: string = str
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(" ");
    return inlineString.replace(/[<>&'"]/g, c =>
      ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '\'':'&apos;', '"':'&quot;' }[c]!)
    );
  }

  private escapeXml(str: string): string {
    return this.escape(str);
  }

  private escapeHtml(str: string): string {
    return str.replace(/[<>&]/g, c =>
      ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]!)
    );
  }
}
