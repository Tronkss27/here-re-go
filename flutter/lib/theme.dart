import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData build() {
    const brandGreen = Color(0xFF00A85A);
    const brandGreenDark = Color(0xFF0B5D3B);
    const text = Color(0xFF111111);
    const muted = Color(0xFF6B7280);
    const border = Color(0xFFE5E7EB);

    final colorScheme = ColorScheme(
      brightness: Brightness.light,
      primary: brandGreen,
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
        style: ElevatedButton.styleFrom(
          backgroundColor: brandGreen,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
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


