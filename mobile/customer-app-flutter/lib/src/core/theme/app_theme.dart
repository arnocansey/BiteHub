import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  static const Color ink = Color(0xFF07120B);
  static const Color forest = Color(0xFF0F6B3C);
  static const Color lime = Color(0xFF31C467);
  static const Color orange = Color(0xFFFF8A34);
  static const Color cream = Color(0xFFFFF8F1);
  static const Color stroke = Color(0xFFE7E1D6);

  static ThemeData light() {
    final textTheme = GoogleFonts.interTextTheme().copyWith(
      displayLarge: GoogleFonts.inter(fontWeight: FontWeight.w800, color: ink),
      displayMedium: GoogleFonts.inter(fontWeight: FontWeight.w800, color: ink),
      headlineLarge: GoogleFonts.inter(fontWeight: FontWeight.w800, color: ink),
      headlineMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w700,
        color: ink,
      ),
      titleLarge: GoogleFonts.inter(fontWeight: FontWeight.w700, color: ink),
      bodyLarge: GoogleFonts.inter(color: ink),
      bodyMedium: GoogleFonts.inter(color: const Color(0xFF445047)),
    );

    final colorScheme = ColorScheme.fromSeed(
      seedColor: orange,
      brightness: Brightness.light,
      primary: orange,
      secondary: lime,
      surface: Colors.white,
    ).copyWith(onPrimary: Colors.white, onSecondary: ink, outline: stroke);

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: cream,
      colorScheme: colorScheme,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        foregroundColor: ink,
        titleTextStyle: textTheme.titleLarge,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 18,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: stroke),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: stroke),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: orange, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: orange,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(58),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: ink,
          minimumSize: const Size.fromHeight(58),
          side: const BorderSide(color: stroke),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        margin: EdgeInsets.zero,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
          side: const BorderSide(color: stroke),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: orange.withValues(alpha: 0.14),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => GoogleFonts.inter(
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
            color: states.contains(WidgetState.selected)
                ? ink
                : const Color(0xFF66726A),
          ),
        ),
      ),
    );
  }
}
