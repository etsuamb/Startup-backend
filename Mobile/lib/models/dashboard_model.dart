class DashboardInfo {
  final String? startupName;
  final String? status;
  final String? stage;
  final double? projectProgress;
  final String? fundingRequired;
  final String? fundingApplied;
  final String? fundingReceived;
  final int? documentsUploaded;
  final int? documentsMissing;
  final String? mentorName;
  final String? mentorTitle;
  final String? latestFeedback;
  final String? welcomeMessage;
  final List<ActivityItem>? recentActivity;
  final List<EventItem>? upcomingEvents;

  DashboardInfo({
    this.startupName,
    this.status,
    this.stage,
    this.projectProgress,
    this.fundingRequired,
    this.fundingApplied,
    this.fundingReceived,
    this.documentsUploaded,
    this.documentsMissing,
    this.mentorName,
    this.mentorTitle,
    this.latestFeedback,
    this.welcomeMessage,
    this.recentActivity,
    this.upcomingEvents,
  });

  factory DashboardInfo.fromJson(Map<String, dynamic> json) {
    final info = json['info'] ?? json;
    return DashboardInfo(
      startupName: info['startup_name'] ?? info['name'],
      status: info['status'],
      stage: info['stage'],
      projectProgress: (info['project_progress'] ?? 0).toDouble(),
      fundingRequired: info['funding_required'],
      fundingApplied: info['funding_applied'],
      fundingReceived: info['funding_received'],
      documentsUploaded: info['documents_uploaded'],
      documentsMissing: info['documents_missing'],
      mentorName: info['mentor_name'],
      mentorTitle: info['mentor_title'],
      latestFeedback: info['latest_feedback'],
      welcomeMessage: json['welcome_message'] ?? info['welcome_message'],
      recentActivity: (json['activity'] as List<dynamic>?)?.map((e) => ActivityItem.fromJson(e)).toList(),
      upcomingEvents: (json['events'] as List<dynamic>?)?.map((e) => EventItem.fromJson(e)).toList(),
    );
  }
}

class ActivityItem {
  final String? title;
  final String? description;
  final String? time;

  ActivityItem({this.title, this.description, this.time});

  factory ActivityItem.fromJson(Map<String, dynamic> json) {
    return ActivityItem(
      title: json['title'] ?? json['action'],
      description: json['description'],
      time: json['time'] ?? json['created_at'],
    );
  }
}

class EventItem {
  final String? title;
  final String? description;
  final String? date;
  final String? time;

  EventItem({this.title, this.description, this.date, this.time});

  factory EventItem.fromJson(Map<String, dynamic> json) {
    return EventItem(
      title: json['title'],
      description: json['description'],
      date: json['date'],
      time: json['time'],
    );
  }
}
