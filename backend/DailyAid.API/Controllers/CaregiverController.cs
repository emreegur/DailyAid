using System.Security.Claims;
using DailyAid.API.Hubs;
using DailyAid.Application.DTOs;
using DailyAid.Application.Interfaces;
using DailyAid.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace DailyAid.API.Controllers;

[ApiController]
[Route("api/caregiver")]
[Authorize(Roles = "Caregiver")]
public class CaregiverController(
    AppDbContext db,
    ICaregiverService caregiver,
    INotificationService notifications,
    IHubContext<NotificationHub> hubContext) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private async Task NotifyElderlyAsync(string elderlyId, string message)
    {
        var caregiverUser = await db.Users.FindAsync(UserId);
        var notifDto = await notifications.CreateNotificationAsync(
            elderlyId, 
            "Caregiver Update", 
            message.Replace("{name}", $"{caregiverUser?.FirstName} {caregiverUser?.LastName}"), 
            "info"
        );
        await hubContext.Clients.Group(elderlyId).SendAsync("ReceiveNotification", notifDto);
    }

    [HttpGet("patients")]
    public async Task<IActionResult> GetPatients() =>
        Ok(await caregiver.GetPatientsAsync(UserId));

    [HttpGet("sentiment")]
    public async Task<IActionResult> GetSentimentAnalysis() =>
        Ok(await caregiver.GetAllPatientsSentimentAsync(UserId));

    [HttpGet("patients/{elderlyId}/chat-history")]
    public async Task<IActionResult> GetPatientChatHistory(string elderlyId)
    {
        try
        {
            return Ok(await caregiver.GetPatientChatHistoryAsync(UserId, elderlyId));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("patients/{elderlyId}/medications")]
    public async Task<IActionResult> GetPatientMedications(string elderlyId)
    {
        try
        {
            return Ok(await caregiver.GetPatientMedicationsAsync(UserId, elderlyId));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("patients/{elderlyId}/routines")]
    public async Task<IActionResult> GetPatientRoutines(string elderlyId)
    {
        try
        {
            return Ok(await caregiver.GetPatientRoutinesAsync(UserId, elderlyId));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("patients/{elderlyId}/medications")]
    public async Task<IActionResult> AddPatientMedication(string elderlyId, [FromBody] CreateMedicationDto dto)
    {
        var result = await caregiver.AddPatientMedicationAsync(UserId, elderlyId, dto);
        await NotifyElderlyAsync(elderlyId, $"Your Caregiver/Family {{name}} has added a new medication for you: {dto.Name}");
        return Ok(result);
    }

    [HttpPut("patients/{elderlyId}/medications/{medicationId}")]
    public async Task<IActionResult> UpdatePatientMedication(string elderlyId, int medicationId, [FromBody] UpdateMedicationDto dto)
    {
        var result = await caregiver.UpdatePatientMedicationAsync(UserId, elderlyId, medicationId, dto);
        await NotifyElderlyAsync(elderlyId, $"Your Caregiver/Family {{name}} has updated your medication: {dto.Name}");
        return Ok(result);
    }

    [HttpDelete("patients/{elderlyId}/medications/{medicationId}")]
    public async Task<IActionResult> DeletePatientMedication(string elderlyId, int medicationId)
    {
        await caregiver.DeletePatientMedicationAsync(UserId, elderlyId, medicationId);
        await NotifyElderlyAsync(elderlyId, "Your Caregiver/Family {name} has deleted a medication.");
        return NoContent();
    }

    [HttpPost("patients/{elderlyId}/medications/{medicationId}/restore")]
    public async Task<IActionResult> RestorePatientMedication(string elderlyId, int medicationId)
    {
        await caregiver.RestorePatientMedicationAsync(UserId, elderlyId, medicationId);
        await NotifyElderlyAsync(elderlyId, "Your Caregiver/Family {name} has restored a medication.");
        return NoContent();
    }

    [HttpPost("patients/{elderlyId}/medications/{medicationId}/untake")]
    public async Task<IActionResult> UntakePatientMedication(string elderlyId, int medicationId)
    {
        await caregiver.UntakePatientMedicationAsync(UserId, elderlyId, medicationId);
        await NotifyElderlyAsync(elderlyId, "Your Caregiver/Family {name} has marked a medication as not taken.");
        return NoContent();
    }

    [HttpPost("patients/{elderlyId}/routines")]
    public async Task<IActionResult> AddPatientRoutine(string elderlyId, [FromBody] CreateRoutineDto dto)
    {
        var result = await caregiver.AddPatientRoutineAsync(UserId, elderlyId, dto);
        await NotifyElderlyAsync(elderlyId, $"Your Caregiver/Family {{name}} has added a new routine for you: {dto.Title}");
        return Ok(result);
    }

    [HttpDelete("patients/{elderlyId}/routines/{routineId}")]
    public async Task<IActionResult> DeletePatientRoutine(string elderlyId, int routineId)
    {
        await caregiver.DeletePatientRoutineAsync(UserId, elderlyId, routineId);
        await NotifyElderlyAsync(elderlyId, "Your Caregiver/Family {name} has deleted a routine.");
        return NoContent();
    }

    [HttpPost("patients/{elderlyId}/routines/{routineId}/restore")]
    public async Task<IActionResult> RestorePatientRoutine(string elderlyId, int routineId)
    {
        await caregiver.RestorePatientRoutineAsync(UserId, elderlyId, routineId);
        await NotifyElderlyAsync(elderlyId, "Your Caregiver/Family {name} has restored a routine.");
        return NoContent();
    }

    [HttpPost("patients/{elderlyId}/routines/{routineId}/uncomplete")]
    public async Task<IActionResult> UncompletePatientRoutine(string elderlyId, int routineId)
    {
        await caregiver.UncompletePatientRoutineAsync(UserId, elderlyId, routineId);
        await NotifyElderlyAsync(elderlyId, "Your Caregiver/Family {name} has marked a routine as not completed.");
        return NoContent();
    }

    [HttpDelete("patients/{elderlyId}")]
    public async Task<IActionResult> DisconnectPatient(string elderlyId)
    {
        await caregiver.DisconnectPatientAsync(UserId, elderlyId);
        return NoContent();
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications() =>
        Ok(await notifications.GetNotificationsAsync(UserId));

    [HttpPut("notifications/{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        await notifications.MarkAsReadAsync(UserId, id);
        return NoContent();
    }

    [HttpDelete("notifications/{id}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        await notifications.DeleteNotificationAsync(UserId, id);
        return NoContent();
    }

    [HttpPost("patients/request")]
    public async Task<IActionResult> RequestPatient([FromBody] PatientRequestDto dto)
    {
        try
        {
            await caregiver.RequestPatientAsync(UserId, dto.Email);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}

public record PatientRequestDto(string Email);
