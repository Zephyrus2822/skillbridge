// ResumePDF.tsx
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

interface ResumePDFProps {
  content: string; // This will be the rewritten resume text
}

// Optional: You can register a font if you want a custom style
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 11,
    lineHeight: 1.6,
  },
  section: {
    marginBottom: 10,
  },
});

export const ResumePDF: React.FC<ResumePDFProps> = ({ content }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          {content.split('\n').map((line, idx) => (
            <Text key={idx}>{line}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
};
