using DailyAid.Application.DTOs;
using DailyAid.Application.Interfaces;
using DailyAid.Domain.Entities;
using DailyAid.Infrastructure.Data;
using DailyAid.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DailyAid.Infrastructure.Services;

public class CaregiverService(AppDbContext db, UserManager<ApplicationUser> userManager) : ICaregiverService
{
    public async Task<List<ElderlyPatientDto>> GetPatientsAsync(string caregiverId)
    {
        var relations = await db.CareRelations
            .Where(cr => cr.CaregiverId == caregiverId && cr.IsActive)
            .ToListAsync();

        var result = new List<ElderlyPatientDto>();
        foreach (var rel in relations)
        {
            var user = await userManager.FindByIdAsync(rel.ElderlyId);
            if (user != null)
                result.Add(new ElderlyPatientDto(user.Id, $"{user.FirstName} {user.LastName}", user.Email!, rel.StartDate, rel.Status, user.IsOnline, user.LastSeen));
        }
        return result;
    }

    public async Task<List<PatientSentimentDto>> GetAllPatientsSentimentAsync(string caregiverId)
    {
        var relations = await db.CareRelations
            .Where(cr => cr.CaregiverId == caregiverId && cr.IsActive && cr.Status == "Accepted")
            .ToListAsync();

        var elderlyIds = relations.Select(r => r.ElderlyId).ToList();

        var today = DateTime.UtcNow.AddHours(3).Date;

        var messages = await db.ChatMessages
            .Where(m => elderlyIds.Contains(m.ElderlyId) && m.SentAt >= today)
            .ToListAsync();

        var result = new List<PatientSentimentDto>();
        foreach (var elderlyId in elderlyIds)
        {
            var user = await userManager.FindByIdAsync(elderlyId);
            if (user == null) continue;

            var patientMessages = messages.Where(m => m.ElderlyId == elderlyId).ToList();
            var totalMessages = patientMessages.Count;
            var botMessages = patientMessages.Where(m => m.IsBot).ToList();
            
            var positive = botMessages.Count(m => string.Equals(m.Sentiment, "POSITIVE", StringComparison.OrdinalIgnoreCase));
            var negative = botMessages.Count(m => string.Equals(m.Sentiment, "NEGATIVE", StringComparison.OrdinalIgnoreCase));
            var neutral = botMessages.Count(m => string.Equals(m.Sentiment, "NEUTRAL", StringComparison.OrdinalIgnoreCase)) 
                          + botMessages.Count(m => string.IsNullOrEmpty(m.Sentiment)); // fallback neutral

            result.Add(new PatientSentimentDto(
                elderlyId, 
                $"{user.FirstName} {user.LastName}", 
                totalMessages, 
                positive, 
                negative, 
                neutral
            ));
        }

        return result;
    }

    public async Task<List<ChatHistoryDto>> GetPatientChatHistoryAsync(string caregiverId, string elderlyId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new UnauthorizedAccessException("Not authorized to view this patient's chat history.");

        var messages = await db.ChatMessages
            .Where(m => m.ElderlyId == elderlyId)
            .OrderBy(m => m.SentAt)
            .Select(m => new ChatHistoryDto(m.Id, m.Content, m.IsBot, m.Sentiment, m.SentAt))
            .ToListAsync();

        return messages;
    }

    public async Task<List<MedicationDto>> GetPatientMedicationsAsync(string caregiverId, string elderlyId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to view this patient's medications.");

        var today = DateTime.UtcNow.AddHours(3).Date;
        return await db.Medications
            .Where(m => m.ElderlyId == elderlyId)
            .Select(m => new MedicationDto(
                m.Id, m.Name, m.Dosage, m.Frequency.ToString(), m.ScheduledTime.ToString("HH:mm"), m.IsActive,
                db.MedicationLogs.Any(l => l.MedicationId == m.Id && l.IsTaken && l.TakenAt.HasValue && l.TakenAt.Value.Date == today)
            ))
            .ToListAsync();
    }

    public async Task<List<RoutineDto>> GetPatientRoutinesAsync(string caregiverId, string elderlyId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to view this patient's routines.");

        var today = DateTime.UtcNow.AddHours(3).Date;
        return await db.Routines
            .Where(r => r.ElderlyId == elderlyId)
            .Select(r => new RoutineDto(
                r.Id, r.Title, r.Description, r.ScheduledTime.ToString("HH:mm"), r.IsActive,
                db.RoutineLogs.Any(l => l.RoutineId == r.Id && l.IsCompleted && l.CompletedAt.HasValue && l.CompletedAt.Value.Date == today)
            ))
            .ToListAsync();
    }

    public async Task<MedicationDto> AddPatientMedicationAsync(string caregiverId, string elderlyId, CreateMedicationDto dto)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to manage this patient's medications.");

        if (dto.Frequency == "Twice")
        {
            var med1 = new Medication
            {
                ElderlyId = elderlyId,
                Name = $"{dto.Name} (Morning)",
                Dosage = dto.Dosage,
                Frequency = FrequencyType.Daily,
                ScheduledTime = TimeOnly.Parse(dto.ScheduledTime)
            };
            var med2 = new Medication
            {
                ElderlyId = elderlyId,
                Name = $"{dto.Name} (Evening)",
                Dosage = dto.Dosage,
                Frequency = FrequencyType.Daily,
                ScheduledTime = TimeOnly.Parse(dto.ScheduledTime).AddHours(12)
            };
            db.Medications.AddRange(med1, med2);
            await db.SaveChangesAsync();
            return new MedicationDto(med1.Id, med1.Name, med1.Dosage, med1.Frequency.ToString(), med1.ScheduledTime.ToString("HH:mm"), med1.IsActive, false);
        }

        var med = new Medication
        {
            ElderlyId = elderlyId,
            Name = dto.Name,
            Dosage = dto.Dosage,
            Frequency = Enum.Parse<FrequencyType>(dto.Frequency),
            ScheduledTime = TimeOnly.Parse(dto.ScheduledTime)
        };
        db.Medications.Add(med);
        await db.SaveChangesAsync();
        return new MedicationDto(med.Id, med.Name, med.Dosage, med.Frequency.ToString(), med.ScheduledTime.ToString("HH:mm"), med.IsActive, false);
    }

    public async Task<MedicationDto> UpdatePatientMedicationAsync(string caregiverId, string elderlyId, int medicationId, UpdateMedicationDto dto)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to manage this patient's medications.");

        var med = await db.Medications.FirstOrDefaultAsync(m => m.Id == medicationId && m.ElderlyId == elderlyId)
            ?? throw new Exception("Medication not found.");

        if (dto.Frequency == "Twice")
        {
            med.Name = $"{dto.Name} (Morning)";
            med.Dosage = dto.Dosage;
            med.Frequency = FrequencyType.Daily;
            med.ScheduledTime = TimeOnly.Parse(dto.ScheduledTime);

            var med2 = new Medication
            {
                ElderlyId = elderlyId,
                Name = $"{dto.Name} (Evening)",
                Dosage = dto.Dosage,
                Frequency = FrequencyType.Daily,
                ScheduledTime = TimeOnly.Parse(dto.ScheduledTime).AddHours(12)
            };
            db.Medications.Add(med2);
        }
        else
        {
            med.Name = dto.Name;
            med.Dosage = dto.Dosage;
            med.Frequency = Enum.Parse<FrequencyType>(dto.Frequency);
            med.ScheduledTime = TimeOnly.Parse(dto.ScheduledTime);
        }

        await db.SaveChangesAsync();

        var today = DateTime.UtcNow.AddHours(3).Date;
        var isTakenToday = await db.MedicationLogs.AnyAsync(l => l.MedicationId == med.Id && l.IsTaken && l.TakenAt.HasValue && l.TakenAt.Value.Date == today);

        return new MedicationDto(med.Id, med.Name, med.Dosage, med.Frequency.ToString(), med.ScheduledTime.ToString("HH:mm"), med.IsActive, isTakenToday);
    }

    public async Task DeletePatientMedicationAsync(string caregiverId, string elderlyId, int medicationId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to manage this patient.");

        var med = await db.Medications.FirstOrDefaultAsync(m => m.Id == medicationId && m.ElderlyId == elderlyId);
        if (med != null) { db.Medications.Remove(med); await db.SaveChangesAsync(); }
    }

    public async Task RestorePatientMedicationAsync(string caregiverId, string elderlyId, int medicationId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to manage this patient.");

        var med = await db.Medications.FirstOrDefaultAsync(m => m.Id == medicationId && m.ElderlyId == elderlyId);
        if (med != null) { med.IsActive = true; await db.SaveChangesAsync(); }
    }

    public async Task UntakePatientMedicationAsync(string caregiverId, string elderlyId, int medicationId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to manage this patient.");

        var today = DateTime.UtcNow.AddHours(3).Date;
        var logs = await db.MedicationLogs
            .Where(l => l.MedicationId == medicationId && l.TakenAt.HasValue && l.TakenAt.Value.Date == today)
            .ToListAsync();
        
        if (logs.Any())
        {
            db.MedicationLogs.RemoveRange(logs);
            await db.SaveChangesAsync();
        }
    }

    public async Task<RoutineDto> AddPatientRoutineAsync(string caregiverId, string elderlyId, CreateRoutineDto dto)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to manage this patient's routines.");

        var routine = new Routine
        {
            ElderlyId = elderlyId,
            Title = dto.Title,
            Description = dto.Description,
            ScheduledTime = TimeOnly.Parse(dto.ScheduledTime)
        };
        db.Routines.Add(routine);
        await db.SaveChangesAsync();
        return new RoutineDto(routine.Id, routine.Title, routine.Description, routine.ScheduledTime.ToString("HH:mm"), routine.IsActive, false);
    }

    public async Task DeletePatientRoutineAsync(string caregiverId, string elderlyId, int routineId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to manage this patient.");

        var routine = await db.Routines.FirstOrDefaultAsync(r => r.Id == routineId && r.ElderlyId == elderlyId);
        if (routine != null) { db.Routines.Remove(routine); await db.SaveChangesAsync(); }
    }

    public async Task RestorePatientRoutineAsync(string caregiverId, string elderlyId, int routineId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to manage this patient.");

        var routine = await db.Routines.FirstOrDefaultAsync(r => r.Id == routineId && r.ElderlyId == elderlyId);
        if (routine != null) { routine.IsActive = true; await db.SaveChangesAsync(); }
    }

    public async Task UncompletePatientRoutineAsync(string caregiverId, string elderlyId, int routineId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation == null) throw new Exception("Not authorized to manage this patient.");

        var today = DateTime.UtcNow.AddHours(3).Date;
        var logs = await db.RoutineLogs
            .Where(l => l.RoutineId == routineId && l.CompletedAt.HasValue && l.CompletedAt.Value.Date == today)
            .ToListAsync();
        
        if (logs.Any())
        {
            db.RoutineLogs.RemoveRange(logs);
            await db.SaveChangesAsync();
        }
    }

    public async Task RequestPatientAsync(string caregiverId, string elderlyEmail)
    {
        var elderlyUser = await userManager.FindByEmailAsync(elderlyEmail);
        if (elderlyUser == null) throw new Exception("User not found.");

        // Check if relation already exists
        var existing = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyUser.Id);
        if (existing != null)
        {
            if (existing.Status == "Rejected" || existing.Status == "Disconnected")
            {
                existing.Status = "Pending";
                existing.IsActive = true;
                existing.StartDate = DateTime.UtcNow.AddHours(3);
            }
            else
            {
                throw new Exception("Relation already exists.");
            }
        }
        else
        {
            var relation = new CareRelation
            {
                CaregiverId = caregiverId,
                ElderlyId = elderlyUser.Id,
                Status = "Pending",
                IsActive = true
            };
            db.CareRelations.Add(relation);
        }

        var caregiver = await userManager.FindByIdAsync(caregiverId);

        // Add Notification
        var notif = new Notification
        {
            UserId = elderlyUser.Id,
            Title = "New Caregiver Request",
            Message = $"{caregiver?.FirstName} {caregiver?.LastName} wants to add you as a patient.",
            Type = "request"
        };
        db.Notifications.Add(notif);

        await db.SaveChangesAsync();
    }

    public async Task AcceptRequestAsync(string elderlyId, int notificationId)
    {
        var notif = await db.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == elderlyId);
        if (notif != null) notif.IsRead = true;

        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.ElderlyId == elderlyId && cr.Status == "Pending");
        if (relation == null) throw new Exception("Pending relation not found.");
        relation.Status = "Accepted";
        
        db.Notifications.Add(new Notification { UserId = relation.CaregiverId, Title = "Request Accepted", Message = "A patient has accepted your request.", Type = "info" });
        await db.SaveChangesAsync();
    }

    public async Task RejectRequestAsync(string elderlyId, int notificationId)
    {
        var notif = await db.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == elderlyId);
        if (notif != null) notif.IsRead = true;

        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.ElderlyId == elderlyId && cr.Status == "Pending");
        if (relation == null) throw new Exception("Pending relation not found.");
        relation.Status = "Rejected";
        relation.IsActive = false;
        
        db.Notifications.Add(new Notification { UserId = relation.CaregiverId, Title = "Request Rejected", Message = "A patient has rejected your request.", Type = "info" });
        await db.SaveChangesAsync();
    }

    public async Task DisconnectPatientAsync(string caregiverId, string elderlyId)
    {
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.CaregiverId == caregiverId && cr.ElderlyId == elderlyId && cr.IsActive && cr.Status == "Accepted");
        if (relation != null)
        {
            relation.IsActive = false;
            relation.Status = "Disconnected";
            await db.SaveChangesAsync();
        }
    }
}
