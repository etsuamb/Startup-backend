import 'package:flutter/material.dart';

class SectionTitle extends StatelessWidget {
  final String title;

  const SectionTitle({
    super.key,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [

        Expanded(
          child: Divider(
            color: Colors.grey.shade300,
          ),
        ),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Text(
            title,
            style: TextStyle(
              color: Colors.grey.shade600,
              letterSpacing: 2,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ),

        Expanded(
          child: Divider(
            color: Colors.grey.shade300,
          ),
        ),
      ],
    );
  }
}