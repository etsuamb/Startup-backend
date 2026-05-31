import 'package:flutter/material.dart';
import '../../models/startup_model.dart';

class StartupCard extends StatelessWidget {
  final StartupModel startup;

  const StartupCard({
    super.key,
    required this.startup,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          /// TOP ROW
          Row(
            children: [
              Expanded(
                child: Text(
                  startup.name,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),

              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Limited Preview',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          /// TAGS
          Row(
            children: [
              _buildTag(
                startup.category.toUpperCase(),
                Colors.grey.shade300,
                Colors.black87,
              ),

              const SizedBox(width: 8),

              _buildTag(
                startup.stage.toUpperCase(),
                const Color(0xFFFFD79A),
                Colors.brown,
              ),
            ],
          ),

          const SizedBox(height: 18),

          /// DESCRIPTION
          Text(
            startup.description,
            style: TextStyle(
              height: 1.7,
              fontSize: 16,
              color: Colors.grey.shade800,
            ),
          ),

          const SizedBox(height: 28),

          /// BUTTON
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.lock_outline),
              label: const Text(
                'View Details',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00695C),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
            ),
          ),

          const SizedBox(height: 14),

          Center(
            child: Text(
              'Login required for full access',
              style: TextStyle(
                color: Colors.grey.shade500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(
    String label,
    Color bg,
    Color textColor,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }
}