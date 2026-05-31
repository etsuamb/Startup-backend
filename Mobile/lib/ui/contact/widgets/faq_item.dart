import 'package:flutter/material.dart';

class FaqItem extends StatefulWidget {
  final String question;
  final String answer;
  final bool initiallyExpanded;

  const FaqItem({
    super.key,
    required this.question,
    required this.answer,
    this.initiallyExpanded = false,
  });

  @override
  State<FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<FaqItem> {

  late bool expanded;

  @override
  void initState() {
    super.initState();
    expanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),

      margin: const EdgeInsets.only(bottom: 16),

      padding: const EdgeInsets.all(22),

      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),

        border: expanded
            ? Border.all(
                color: const Color(0xFFD2F1EB),
                width: 1.5,
              )
            : null,
      ),

      child: Column(
        children: [

          GestureDetector(
            onTap: () {
              setState(() {
                expanded = !expanded;
              });
            },

            child: Row(
              children: [

                Expanded(
                  child: Text(
                    widget.question,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: expanded
                          ? const Color(0xFF00695C)
                          : Colors.black87,
                    ),
                  ),
                ),

                Icon(
                  expanded
                      ? Icons.remove
                      : Icons.add,
                  size: 28,
                  color: expanded
                      ? const Color(0xFF00695C)
                      : Colors.grey.shade700,
                ),
              ],
            ),
          ),

          if (expanded) ...[

            const SizedBox(height: 18),

            Text(
              widget.answer,
              style: TextStyle(
                height: 1.8,
                fontSize: 16,
                color: Colors.grey.shade700,
              ),
            ),
          ]
        ],
      ),
    );
  }
}