import "server-only";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  renderToBuffer,
} from "@react-pdf/renderer";

// Built-in PDF fonts need no downloads and always render crisply.
const PAGE_MARGIN = 72; // 1 inch, in PDF points

const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE_MARGIN,
    paddingBottom: PAGE_MARGIN + 12,
    paddingHorizontal: PAGE_MARGIN,
    fontFamily: "Times-Roman",
    fontSize: 11.5,
    color: "#111111",
    // NOTE: do not set lineHeight here. On the Page it makes the absolutely
    // positioned footer (page numbers) vanish. Set it on the text styles.
  },
  banner: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    textAlign: "center",
    color: "#555555",
    marginBottom: 14,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 1,
    marginBottom: 24,
  },
  paragraph: {
    // In react-pdf 4.x this value is a multiplier of a ~18pt base, not of the
    // font size: 0.9 gives about 16pt between lines (roughly 1.4x the 11.5pt text).
    lineHeight: 0.9,
    marginBottom: 9,
  },
  footer: {
    position: "absolute",
    bottom: 36,
    left: PAGE_MARGIN,
    right: PAGE_MARGIN,
    fontSize: 9,
    textAlign: "center",
    color: "#555555",
  },
});

interface DraftPdfProps {
  title: string;
  content: string;
}

function DraftPdf({ title, content }: DraftPdfProps) {
  // Blank lines separate paragraphs; single line breaks inside a block
  // (addresses, signature lines) are kept as typed.
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.replace(/^\n+|\n+$/g, ""))
    .filter((block) => block.trim().length > 0);

  return (
    <Document title={title} author="Legal Drafting Assistant" creator="Legal Drafting Assistant">
      <Page size="A4" style={styles.page}>
        <Text style={styles.banner}>
          DRAFT FOR REVIEW. NOT LEGAL ADVICE. Have a qualified attorney review this document before use.
        </Text>
        <Text style={styles.title}>{title}</Text>

        {blocks.map((block, index) => (
          <Text key={index} style={styles.paragraph} orphans={2} widows={2}>
            {block}
          </Text>
        ))}

        <Text
          fixed
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${title}  |  Draft  |  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export async function renderDraftPdf(title: string, content: string): Promise<Buffer> {
  return renderToBuffer(<DraftPdf title={title} content={content} />);
}
