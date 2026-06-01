import 'package:flutter/material.dart';

class ContactBottomBanner extends StatelessWidget {
  const ContactBottomBanner({super.key});

  @override
  Widget build(BuildContext context) {

    return ClipRRect(
      borderRadius: BorderRadius.circular(32),

      child: Stack(
        alignment: Alignment.center,

        children: [

          /// IMAGE
          SizedBox(
            height: 260,
            width: double.infinity,

            child: Image.asset(
              'images/contact_page_image.png',
              fit: BoxFit.cover,
            ),
          ),

          /// DARK OVERLAY
          Container(
            height: 260,
            color: Colors.black.withOpacity(0.45),
          ),

          /// TEXT
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 32),

            child: Text(
              'Building Ethiopia\'s future, one connection at a time.',
              textAlign: TextAlign.center,

              style: TextStyle(
                color: Colors.white,
                fontSize: 36,
                height: 1.3,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}