import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

ThemeData buildTheme() {
  const primaryGreen = Color(0xFF0B6B57);
  const lightBackground = Color(0xFFF5F7FA);

  final baseTextTheme = GoogleFonts.interTextTheme();

  return ThemeData(
    useMaterial3: false,
    scaffoldBackgroundColor: lightBackground,
    primaryColor: primaryGreen,
    textTheme: baseTextTheme.copyWith(
      headlineMedium: baseTextTheme.headlineMedium?.copyWith(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: Colors.black,
      ),
      bodyMedium: baseTextTheme.bodyMedium?.copyWith(
        fontSize: 14,
        color: Colors.black87,
      ),
    ),
    appBarTheme: const AppBarTheme(
      elevation: 0,
      backgroundColor: Colors.transparent,
      foregroundColor: Colors.black,
    ),
  );
}