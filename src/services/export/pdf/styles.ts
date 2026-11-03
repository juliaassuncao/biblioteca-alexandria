import { StyleSheet } from '@react-pdf/renderer';
export const pdfStyles = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 46, paddingHorizontal: 36, fontFamily: ['AlexandriaExport', 'AlexandriaSymbols'], fontSize: 10, color: '#000000' },
  title: { fontSize: 24, lineHeight: 1.2, color: '#000000', marginBottom: 18 },
  subtitle: { fontSize: 14, lineHeight: 1.3, marginTop: 15, marginBottom: 9, color: '#000000' },
  small: { fontSize: 8, color: '#000000', marginBottom: 8 },
  paragraph: { marginBottom: 7, lineHeight: 1.35 },
  footer: { position: 'absolute', bottom: 22, left: 36, right: 36, textAlign: 'center', fontSize: 7, color: '#000000' },
  divider: { textAlign: 'center', color: '#000000', marginVertical: 16 },
  box: { borderLeftWidth: 1, borderLeftColor: '#a46f54', paddingLeft: 10, marginVertical: 10 },
  image: { maxWidth: 240, maxHeight: 160, objectFit: 'contain', alignSelf: 'center', marginVertical: 10 },
  link: { color: '#000000', textDecoration: 'underline' },
  notes: { borderTopWidth: .5, borderTopColor: '#e0d7cb', marginTop: 18, paddingTop: 8 },
});
