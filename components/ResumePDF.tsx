import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: '40px 50px',
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#000',
    lineHeight: 1.3,
  },
  header: {
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  contactLabel: {
    fontWeight: 'bold',
    width: 60,
  },
  contactText: {
    flex: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  itemGroup: {
    marginBottom: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  itemTitleBold: {
    fontWeight: 'bold',
    fontSize: 10.5,
  },
  itemSubtitleItalic: {
    fontStyle: 'italic',
    marginTop: 1,
  },
  itemDate: {
    fontSize: 9.5,
  },
  bullet: {
    flexDirection: 'row',
    marginTop: 2,
    paddingLeft: 5,
  },
  bulletPoint: {
    width: 10,
  },
  bulletText: {
    flex: 1,
    textAlign: 'justify',
  },
  skillsText: {
    lineHeight: 1.4,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  }
});

export interface ResumeDataState {
  personalInfo: { name: string; email: string; phone: string; linkedin: string; github: string };
  summary: string;
  experience: { title: string; company: string; date: string; description: string }[];
  education: { degree: string; school: string; date: string }[];
  projects: { name: string; date: string; description: string; tech: string }[];
  skills: string;
  certifications: { name: string; link: string }[];
}

export const ResumePDF = ({ data }: { data: ResumeDataState }) => {
  const validExp = data.experience?.filter(e => e.title || e.company || e.description) || [];
  const validProj = data.projects?.filter(p => p.name || p.description) || [];
  const validEdu = data.education?.filter(e => e.school || e.degree) || [];
  const validCerts = data.certifications?.filter(c => c.name) || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.personalInfo.name || 'YOUR NAME'}</Text>
          {data.personalInfo.email && <Text>Email: {data.personalInfo.email}</Text>}
          {data.personalInfo.phone && <Text>Phone: {data.personalInfo.phone}</Text>}
          {data.personalInfo.linkedin && <Text>LinkedIn: {data.personalInfo.linkedin}</Text>}
          {data.personalInfo.github && <Text>GitHub: {data.personalInfo.github}</Text>}
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={{ textAlign: 'justify' }}>{data.summary}</Text>
          </View>
        )}

        {/* Technical Skills */}
        {data.skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            {data.skills.split('\n').filter(Boolean).map((line, i) => (
              <Text key={i} style={styles.skillsText}>{line}</Text>
            ))}
          </View>
        )}

        {/* Experience */}
        {validExp.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {validExp.map((exp, i) => (
              <View key={i} style={styles.itemGroup}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitleBold}>{exp.title}</Text>
                  <Text style={styles.itemDate}>{exp.date}</Text>
                </View>
                {exp.company && <Text style={styles.itemSubtitleItalic}>{exp.company}</Text>}
                {exp.description.split('\n').filter(Boolean).map((bullet, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{bullet.replace('•', '').trim()}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {validEdu.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {validEdu.map((edu, i) => (
              <View key={i} style={styles.itemGroup}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitleBold}>{edu.school}</Text>
                  <Text style={styles.itemDate}>{edu.date}</Text>
                </View>
                {edu.degree && <Text style={styles.itemSubtitleItalic}>{edu.degree}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {validProj.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {validProj.map((proj, i) => (
              <View key={i} style={styles.itemGroup}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitleBold}>
                    {proj.name} {proj.tech ? ` | ${proj.tech}` : ''}
                  </Text>
                  <Text style={styles.itemDate}>{proj.date}</Text>
                </View>
                {proj.description.split('\n').filter(Boolean).map((bullet, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{bullet.replace('•', '').trim()}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {validCerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {validCerts.map((cert, i) => (
              <View key={i} style={styles.certRow}>
                <Text style={styles.itemTitleBold}>{cert.name}</Text>
                {cert.link && <Text style={styles.itemDate}>({cert.link})</Text>}
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  );
};
