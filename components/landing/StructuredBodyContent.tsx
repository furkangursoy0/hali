import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const isWeb = Platform.OS === 'web';

function WebHeading({
  level,
  text,
  style,
}: {
  level: 'h2' | 'h3';
  text: string;
  style: any;
}) {
  if (!isWeb) {
    return <Text style={style}>{text}</Text>;
  }

  return React.createElement(level, { style: StyleSheet.flatten(style) as any }, text);
}

export default function StructuredBodyContent({ isWide }: { isWide: boolean }) {
  const body = (
    <>
      <View style={[styles.card, isWide && styles.cardWide]}>
        <WebHeading
          level="h2"
          text="Odada halı deneme ile müşteriye daha net sunum yapın"
          style={[styles.sectionTitle, isWide && styles.sectionTitleWide]}
        />
        <Text style={styles.lead}>
          Halı Dene, mağazada ya da uzaktan satış yaparken müşterinin oda fotoğrafına uygun halıyı
          saniyeler içinde gösterir. Böylece müşteri sadece ürün görmez, halının kendi yaşam alanında
          nasıl duracağını da görür.
        </Text>
      </View>

      <View style={[styles.grid, isWide && styles.gridWide]}>
        <View style={styles.item}>
          <WebHeading level="h3" text="Satış sürecini hızlandırır" style={styles.itemTitle} />
          <Text style={styles.itemText}>
            Mağaza personeli veya bayi ekibi, farklı halıları tek tek sergilemeden aynı oda üzerinde
            hızlı karşılaştırma yapabilir.
          </Text>
        </View>

        <View style={styles.item}>
          <WebHeading level="h3" text="İade riskini azaltır" style={styles.itemTitle} />
          <Text style={styles.itemText}>
            Müşteri satın alma kararını verirken renk, desen ve ölçü hissini daha doğru algılar;
            sonradan memnuniyetsizlik ihtimali düşer.
          </Text>
        </View>

        <View style={styles.item}>
          <WebHeading level="h3" text="3D halı deneyimi sunar" style={styles.itemTitle} />
          <Text style={styles.itemText}>
            Yapay zeka destekli görselleştirme sayesinde halı, odanın perspektifine ve yerleşimine
            uygun biçimde daha gerçekçi görünür.
          </Text>
        </View>
      </View>
    </>
  );

  if (!isWeb) {
    return <View style={styles.section}>{body}</View>;
  }

  return React.createElement('section', { style: StyleSheet.flatten(styles.section) as any }, body);
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.xxl,
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardWide: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitleWide: {
    fontSize: 30,
  },
  lead: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  grid: {
    gap: SPACING.md,
  },
  gridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  item: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  itemTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  itemText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
