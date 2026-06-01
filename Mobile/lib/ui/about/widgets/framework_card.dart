import 'package:flutter/material.dart';

class FrameworkCard extends StatelessWidget {
  final String title;
  final String description;
  final Color backgroundColor;
  final Color titleColor;
  final bool isDark;

  const FrameworkCard({
    super.key,
    required this.title,
    required this.description,
    required this.backgroundColor,
    required this.titleColor,
    this.isDark = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),

      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(28),
      ),

      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          Text(
            title,
            style: TextStyle(
              color: titleColor,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),

          const SizedBox(height: 18),

          Text(
            description,
            style: TextStyle(
              color: isDark ? Colors.white : Colors.black87,
              fontSize: 18,
              height: 1.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}