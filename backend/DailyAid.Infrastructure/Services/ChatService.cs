using System.Text;
using System.Text.Json;
using DailyAid.Application.DTOs;
using DailyAid.Application.Interfaces;
using DailyAid.Domain.Entities;
using DailyAid.Infrastructure.Data;

namespace DailyAid.Infrastructure.Services;

public class ChatService(AppDbContext db, IHttpClientFactory httpFactory) : IChatService
{
    public async Task<ChatResponseDto> SendMessageAsync(string elderlyId, string message)
    {
        // Save user message
        db.ChatMessages.Add(new ChatMessage { ElderlyId = elderlyId, Content = message, IsBot = false });
        await db.SaveChangesAsync();

        // Fetch chat history
        var history = db.ChatMessages
            .Where(m => m.ElderlyId == elderlyId && m.Id != 0 && m.Sentiment != "SYSTEM_EVENT") // ensure valid & exclude system
            .OrderByDescending(m => m.SentAt)
            .Take(30)
            .ToList() // fetch from db first
            .OrderBy(m => m.SentAt) // order chronologically
            .Select(m => new { role = m.IsBot ? "assistant" : "user", content = m.Content })
            .ToList();
            
        // Call Python NLP service
        var client = httpFactory.CreateClient("NlpService");
        var payload = new StringContent(JsonSerializer.Serialize(new { message, history }), Encoding.UTF8, "application/json");

        string reply;
        string sentiment = "neutral";
        bool isCritical = false;

        try
        {
            var response = await client.PostAsync("/api/chat", payload); // Assuming FastAPI might be just /api/chat or /chat based on main.py
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<JsonElement>(json);
                reply = result.GetProperty("reply").GetString() ?? "I'm here to help!";
                sentiment = result.TryGetProperty("sentiment", out var s) ? s.GetString() ?? "neutral" : "neutral";
                isCritical = result.TryGetProperty("is_critical", out var c) && (c.ValueKind == JsonValueKind.True);
            }
            else
            {
                reply = "I'm having trouble connecting. Please try again.";
            }
        }
        catch
        {
            reply = "The AI assistant is currently unavailable.";
        }

        // Save bot reply
        db.ChatMessages.Add(new ChatMessage { ElderlyId = elderlyId, Content = reply, IsBot = true, Sentiment = sentiment });
        await db.SaveChangesAsync();

        return new ChatResponseDto(reply, sentiment, isCritical);
    }

    public async Task RecordChatLeaveAsync(string elderlyId)
    {
        db.ChatMessages.Add(new ChatMessage 
        { 
            ElderlyId = elderlyId, 
            Content = "Elderly user closed the chat", 
            IsBot = true, 
            Sentiment = "SYSTEM_EVENT" 
        });
        await db.SaveChangesAsync();
    }
}
