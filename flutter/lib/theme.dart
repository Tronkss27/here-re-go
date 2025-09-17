import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData build() {
    const brandBase = Color(0xFF245841); // contorni/dettagli
    const ctaStart = Color(0xFF006909);
    const ctaEnd = Color(0xFF00FF89);
    const text = Color(0xFF111111);
    const muted = Color(0xFF6B7280);
    const border = Color(0xFFE5E7EB);

    final colorScheme = ColorScheme(
      brightness: Brightness.light,
      primary: brandBase,
      onPrimary: Colors.white,
      secondary: brandGreenDark,
      onSecondary: Colors.white,
      error: const Color(0xFFB00020),
      onError: Colors.white,
      background: Colors.white,
      onBackground: text,
      surface: Colors.white,
      onSurface: text,
    );

    final base = ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      fontFamily: 'Hubot Sans Expanded',
      scaffoldBackgroundColor: Colors.white,
      textTheme: const TextTheme(
        displaySmall: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, height: 40 / 32),
        titleLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 32 / 24),
        bodyMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, height: 24 / 16),
        labelSmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, height: 16 / 12),
      ),
    );

    return base.copyWith(
      dividerColor: border,
      hintColor: muted,
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ButtonStyle(
          padding: WidgetStateProperty.all(const EdgeInsets.symmetric(horizontal: 20, vertical: 14)),
          foregroundColor: WidgetStateProperty.all(Colors.white),
          shape: WidgetStateProperty.all(RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          // Gradient via container wrapper: gestito nei widget CTA dedicati
          backgroundColor: WidgetStateProperty.all(brandBase),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: Colors.white,
        selectedColor: brandGreen.withOpacity(0.1),
        shape: StadiumBorder(side: BorderSide(color: border)),
        labelStyle: TextStyle(color: text, fontWeight: FontWeight.w600),
      ),
      cardTheme: const CardTheme(
        elevation: 0,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
      ),
    );
  }
}


