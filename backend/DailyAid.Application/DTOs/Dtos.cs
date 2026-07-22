using DailyAid.Domain.Enums;

namespace DailyAid.Application.DTOs;

public record RegisterDto(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    UserRole Role
);

public record LoginDto(
    string Email,
    string Password
);

public record AuthResponseDto(
    string Token,
    string UserId,
    string FullName,
    string Email,
    string Role
);

public record MedicationDto(
    int Id,
    string Name,
    string Dosage,
    string Frequency,
    string ScheduledTime,
    bool IsActive,
    bool IsTakenToday
);

public record CreateMedicationDto(
    string Name,
    string Dosage,
    string Frequency,
    string ScheduledTime
);

public record UpdateMedicationDto(
    string Name,
    string Dosage,
    string Frequency,
    string ScheduledTime
);

public record RoutineDto(
    int Id,
    string Title,
    string? Description,
    string ScheduledTime,
    bool IsActive,
    bool IsCompletedToday
);

public record CreateRoutineDto(
    string Title,
    string? Description,
    string ScheduledTime
);

public record ChatRequestDto(string Message);

public record ChatResponseDto(
    string Reply, 
    string Sentiment, 
    [property: System.Text.Json.Serialization.JsonPropertyName("is_critical")] bool IsCritical = false
);

public record NotificationDto(
    int Id,
    string Title,
    string Message,
    bool IsRead,
    DateTime CreatedAt,
    string Type
);

public record ElderlyPatientDto(
    string Id,
    string FullName,
    string Email,
    DateTime RelationStartDate,
    string Status,
    bool IsOnline,
    DateTime? LastSeen
);

public record PatientSentimentDto(
    string ElderlyId,
    string FullName,
    int TotalMessages,
    int Positive,
    int Negative,
    int Neutral
);

public record ChatHistoryDto(
    int Id,
    string Content,
    bool IsBot,
    string? Sentiment,
    DateTime SentAt
);
