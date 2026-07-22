using System.Security.Claims;
using DailyAid.API.Hubs;
using DailyAid.Application.DTOs;
using DailyAid.Application.Interfaces;
using DailyAid.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DailyAid.API.Controllers;

[ApiController]
[Route("api/elderly")]
[Authorize(Roles = "Elderly")]
public class ElderlyController(
    AppDbContext db,
    IMedicationService medications,
    IRoutineService routines,
    IChatService chat,
    INotificationService notifications,
    ICaregiverService caregivers,
    IHubContext<NotificationHub> hubContext) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // Medications
    [HttpGet("medications")]
    public async Task<IActionResult> GetMedications() =>
        Ok(await medications.GetMedicationsAsync(UserId));

    [HttpPost("medications")]
    public async Task<IActionResult> AddMedication([FromBody] CreateMedicationDto dto)
    {
        var result = await medications.CreateMedicationAsync(UserId, dto);
        await NotifyCaregiversAsync($"Added a new medication: {dto.Name} ({dto.Dosage})");
        return Ok(result);
    }

    [HttpPut("medications/{id}")]
    public async Task<IActionResult> UpdateMedication(int id, [FromBody] UpdateMedicationDto dto)
    {
        var result = await medications.UpdateMedicationAsync(UserId, id, dto);
        await NotifyCaregiversAsync($"Updated a medication: {dto.Name} ({dto.Dosage})");
        return Ok(result);
    }

    [HttpPost("medications/{id}/take")]
    public async Task<IActionResult> TakeMedication(int id)
    {
        await medications.MarkAsTakenAsync(UserId, id);
        await NotifyCaregiversAsync("Marked a medication as Taken");
        return NoContent();
    }

    [HttpPost("medications/{id}/untake")]
    public async Task<IActionResult> UntakeMedication(int id)
    {
        await medications.UntakeMedicationAsync(UserId, id);
        await NotifyCaregiversAsync("Unmarked a medication that was previously Taken");
        return NoContent();
    }

    [HttpDelete("medications/{id}")]
    public async Task<IActionResult> DeleteMedication(int id)
    {
        await medications.DeleteMedicationAsync(UserId, id);
        await NotifyCaregiversAsync("Deleted a medication");
        return NoContent();
    }

    // Routines
    [HttpGet("routines")]
    public async Task<IActionResult> GetRoutines()
    {
        var result = await routines.GetRoutinesAsync(UserId);
        return Ok(result);
    }

    [HttpPost("routines")]
    public async Task<IActionResult> AddRoutine([FromBody] CreateRoutineDto dto)
    {
        var result = await routines.CreateRoutineAsync(UserId, dto);
        await NotifyCaregiversAsync($"Added a new routine: {dto.Title}");
        return Ok(result);
    }

    [HttpPost("routines/{id}/complete")]
    public async Task<IActionResult> CompleteRoutine(int id)
    {
        await routines.CompleteRoutineAsync(UserId, id);
        await NotifyCaregiversAsync("Marked a routine as Completed");
        return NoContent();
    }

    [HttpPost("routines/{id}/uncomplete")]
    public async Task<IActionResult> UncompleteRoutine(int id)
    {
        await routines.UncompleteRoutineAsync(UserId, id);
        await NotifyCaregiversAsync("Unmarked a routine that was previously Completed");
        return NoContent();
    }

    [HttpDelete("routines/{id}")]
    public async Task<IActionResult> DeleteRoutine(int id)
    {
        await routines.DeleteRoutineAsync(UserId, id);
        await NotifyCaregiversAsync("Deleted a routine");
        return NoContent();
    }

    // Chat
    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto dto) =>
        Ok(await chat.SendMessageAsync(UserId, dto.Message));

    [HttpPost("chat/leave")]
    public async Task<IActionResult> LeaveChat()
    {
        await chat.RecordChatLeaveAsync(UserId);
        return NoContent();
    }

    // Emergency Alert (SignalR)
    [HttpPost("emergency")]
    public async Task<IActionResult> EmergencyAlert([FromBody] ChatRequestDto dto)
    {
        // 1. Find the caregiver attached to this elderly user
        var relation = await db.CareRelations.FirstOrDefaultAsync(cr => cr.ElderlyId == UserId && cr.IsActive);
        if (relation == null) return BadRequest("No active caregiver found to alert.");

        // 2. Create the notification 
        var message = string.IsNullOrEmpty(dto.Message) ? "The AI Assistant detected a potential emergency situation." : dto.Message;
        
        var notifDto = await notifications.CreateNotificationAsync(
            caregiverId: relation.CaregiverId,
            title: "🚨 EMERGENCY ALERT",
            message: message,
            type: "emergency"
        );

        // 3. Broadcast it via SignalR
        await hubContext.Clients.Group(relation.CaregiverId).SendAsync("ReceiveNotification", notifDto);

        return Ok(new { success = true });
    }

    // Notifications
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

    [HttpPost("requests/{relationId}/accept")]
    public async Task<IActionResult> AcceptRequest(int relationId)
    {
        try
        {
            await caregivers.AcceptRequestAsync(UserId, relationId);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("requests/{relationId}/reject")]
    public async Task<IActionResult> RejectRequest(int relationId)
    {
        try
        {
            await caregivers.RejectRequestAsync(UserId, relationId);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private async Task NotifyCaregiversAsync(string message)
    {
        var elderlyUser = await db.Users.FindAsync(UserId);
        var caregiverIds = await db.CareRelations
            .Where(cr => cr.ElderlyId == UserId && cr.IsActive && cr.Status == "Accepted")
            .Select(cr => cr.CaregiverId)
            .ToListAsync();

        foreach (var caregiverId in caregiverIds)
        {
            string title = elderlyUser != null ? $"{elderlyUser.FirstName} {elderlyUser.LastName}" : "Patient";
            var notifDto = await notifications.CreateNotificationAsync(caregiverId, title, $"New changes on {elderlyUser?.FirstName ?? "your patient"}, check your notifications. Action: {message}", "info");
            await hubContext.Clients.Group(caregiverId).SendAsync("ReceiveNotification", notifDto);
        }
    }
}
