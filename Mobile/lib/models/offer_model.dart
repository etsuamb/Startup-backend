class OfferModel {
  final int? id;
  final String? type;
  final String? fromName;
  final String? amount;
  final String? equity;
  final String? terms;
  final String? status;
  final String? message;
  final String? createdAt;

  OfferModel({
    this.id,
    this.type,
    this.fromName,
    this.amount,
    this.equity,
    this.terms,
    this.status,
    this.message,
    this.createdAt,
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    return OfferModel(
      id: json['id'],
      type: json['type'],
      fromName: json['from_name'] ?? json['investor_name'] ?? json['mentor_name'],
      amount: json['amount']?.toString(),
      equity: json['equity']?.toString(),
      terms: json['terms'],
      status: json['status'],
      message: json['message'],
      createdAt: json['created_at'],
    );
  }
}
