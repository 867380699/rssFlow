const parser = new DOMParser();
const xsltProcessor = new XSLTProcessor();
const serializer = new XMLSerializer();

const stylesheet = `
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
 <xsl:output omit-xml-declaration="yes" indent="yes"/>
    <xsl:template match="node()|@*">
      <xsl:copy>
        <xsl:apply-templates select="node()|@*"/>
      </xsl:copy>
    </xsl:template>
</xsl:stylesheet>
`;

xsltProcessor.importStylesheet(
  parser.parseFromString(stylesheet, 'application/xml')
);

const parse = (xmlString: string) => {
  return parser.parseFromString(xmlString, 'application/xml');
};

const serialize = (document: Document) => {
  const resultDoc = xsltProcessor.transformToDocument(document);

  return serializer
    .serializeToString(resultDoc)
    .replace(/ *xmlns="[^"]+" */g, ' ');
};

export const xmlService = {
  parse,
  serialize,
};

export default xmlService;
