import 'package:flutter/material.dart';

class AppColors {
  static const brand50 = Color(0xFFEEF6FF);
  static const brand100 = Color(0xFFD9EBFF);
  static const brand500 = Color(0xFF2F7DFA);
  static const brand600 = Color(0xFF185CEF);
  static const brand700 = Color(0xFF1447D1);
  static const brand800 = Color(0xFF163CA8);
  static const brand900 = Color(0xFF173584);

  static const riskLow = Color(0xFF16A34A);
  static const riskLowBg = Color(0xFFECFDF3);
  static const riskModerate = Color(0xFFD97706);
  static const riskModerateBg = Color(0xFFFFFAEB);
  static const riskHigh = Color(0xFFDC2626);
  static const riskHighBg = Color(0xFFFEF2F2);

  static const slate50 = Color(0xFFF8FAFC);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate400 = Color(0xFF94A3B8);
  static const slate500 = Color(0xFF64748B);
  static const slate600 = Color(0xFF475569);
  static const slate700 = Color(0xFF334155);
  static const slate900 = Color(0xFF0F172A);

  static Color riskColor(String level) {
    switch (level) {
      case 'HIGH':
        return riskHigh;
      case 'MODERATE':
        return riskModerate;
      default:
        return riskLow;
    }
  }

  static Color riskBgColor(String level) {
    switch (level) {
      case 'HIGH':
        return riskHighBg;
      case 'MODERATE':
        return riskModerateBg;
      default:
        return riskLowBg;
    }
  }
}

ThemeData buildAppTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brand600,
      primary: AppColors.brand600,
      surface: Colors.white,
    ),
    scaffoldBackgroundColor: const Color(0xFFF4F7FB),
    fontFamily: 'Roboto',
  );

  return base.copyWith(
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: AppColors.slate900,
      elevation: 0,
      surfaceTintColor: Colors.white,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.slate200),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.brand600,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.slate700,
        side: const BorderSide(color: AppColors.slate200),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.slate200),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.slate200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.brand500, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    ),
    dividerTheme: const DividerThemeData(color: AppColors.slate200),
  );
}
