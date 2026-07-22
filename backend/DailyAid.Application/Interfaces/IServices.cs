using DailyAid.Application.DTOs;

namespace DailyAid.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
}

public interface IMedicationService
{
    Task<List<MedicationDto>> GetMedicationsAsync(string elderlyId);
    Task<MedicationDto> CreateMedicationAsync(string elderlyId, CreateMedicationDto dto);
    Task<MedicationDto> UpdateMedicationAsync(string elderlyId, int medicationId, UpdateMedicationDto dto);
    Task MarkAsTakenAsync(string elderlyId, int medicationId);
    Task UntakeMedicationAsync(string elderlyId, int medicationId);
    Task DeleteMedicationAsync(string elderlyId, int medicationId);
}

public interface IRoutineService
{
    Task<List<RoutineDto>> GetRoutinesAsync(string elderlyId);
    Task<RoutineDto> CreateRoutineAsync(string elderlyId, CreateRoutineDto dto);
    Task CompleteRoutineAsync(string elderlyId, int routineId);
    Task UncompleteRoutineAsync(string elderlyId, int routineId);
    Task DeleteRoutineAsync(string elderlyId, int routineId);
}

public interface IChatService
{
    Task<ChatResponseDto> SendMessageAsync(string elderlyId, string message);
    Task RecordChatLeaveAsync(string elderlyId);
}

public interface ICaregiverService
{
    Task<List<ElderlyPatientDto>> GetPatientsAsync(string caregiverId);
    Task<List<PatientSentimentDto>> GetAllPatientsSentimentAsync(string caregiverId);
    Task<List<ChatHistoryDto>> GetPatientChatHistoryAsync(string caregiverId, string elderlyId);
    Task<List<MedicationDto>> GetPatientMedicationsAsync(string caregiverId, string elderlyId);
    Task<List<RoutineDto>> GetPatientRoutinesAsync(string caregiverId, string elderlyId);
    Task<MedicationDto> AddPatientMedicationAsync(string caregiverId, string elderlyId, CreateMedicationDto dto);
    Task<MedicationDto> UpdatePatientMedicationAsync(string caregiverId, string elderlyId, int medicationId, UpdateMedicationDto dto);
    Task DeletePatientMedicationAsync(string caregiverId, string elderlyId, int medicationId);
    Task RestorePatientMedicationAsync(string caregiverId, string elderlyId, int medicationId);
    Task UntakePatientMedicationAsync(string caregiverId, string elderlyId, int medicationId);
    Task<RoutineDto> AddPatientRoutineAsync(string caregiverId, string elderlyId, CreateRoutineDto dto);
    Task DeletePatientRoutineAsync(string caregiverId, string elderlyId, int routineId);
    Task RestorePatientRoutineAsync(string caregiverId, string elderlyId, int routineId);
    Task UncompletePatientRoutineAsync(string caregiverId, string elderlyId, int routineId);
    Task RequestPatientAsync(string caregiverId, string elderlyEmail);
    Task AcceptRequestAsync(string elderlyId, int relationId);
    Task RejectRequestAsync(string elderlyId, int relationId);
    Task DisconnectPatientAsync(string caregiverId, string elderlyId);
}

public interface INotificationService
{
    Task<List<NotificationDto>> GetNotificationsAsync(string userId);
    Task MarkAsReadAsync(string userId, int notificationId);
    Task<NotificationDto> CreateNotificationAsync(string caregiverId, string title, string message, string type = "info");
    Task DeleteNotificationAsync(string userId, int notificationId);
}
