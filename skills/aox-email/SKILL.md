# AOX Email Skill — AgentMail Integration

## Purpose

Enable AOX agents to send and receive emails via AgentMail — the email service built specifically for AI agents.

## Email Address

**AOX Primary:** `aox@agentmail.com`

## Setup

Credentials already stored in `~/.openclaw/.env`:
```bash
AGENTMAIL_API_KEY=am_us_inbox_6e94fbd2dc5bbb7df9f34e051a06a34bf6e8d23d21fc3a24c80d9dd9289f6487
AGENTMAIL_EMAIL=aox@agentmail.com
AGENTMAIL_API_URL=https://api.agentmail.to/v1
AGENTMAIL_INBOX_ID=aox
```

## Quick Start

```python
from agentmail_client import AgentMailClient

client = AgentMailClient()

# Send email
client.send_email(
    to="buyer@example.com",
    subject="New Lead Available",
    body="Check out this premium token launch lead..."
)

# Get inbox
messages = client.get_messages(limit=10)

# Reply
client.reply_to_message(message_id, "Thanks for your interest...")
```

## Use Cases

### 1. Daily Reports (CEO → Operator)
```python
client.send_daily_report("goya@example.com", {
    'leads_discovered': 15,
    'leads_scored': 12,
    'sales_completed': 3,
    'revenue_today': 120
})
```

### 2. Alerts (Critical Issues)
```python
client.send_alert("goya@example.com", "AGENT_DOWN", 
                  "Research agent not responding", details)
```

### 3. Lead Notifications (Buyers)
```python
client.send_lead_notification("buyer@example.com", lead_data)
```

### 4. Buyer Communication
- Handle purchase inquiries
- Deliver leads post-payment
- Handle support requests

## API Reference

### Send Email
```python
client.send_email(
    to="recipient@example.com",
    subject="Subject",
    body="Message body",
    html=False  # Set True for HTML email
)
```

### Get Inbox
```python
messages = client.get_messages(
    limit=20,
    unread_only=True
)
```

### Get Message
```python
message = client.get_message("msg_abc123")
```

### Reply
```python
client.reply_to_message(
    message_id="msg_abc123",
    body="Reply text"
)
```

## Webhook Setup (Incoming Emails)

Configure webhook in AgentMail dashboard:
- **URL:** `https://your-server.com/webhook/agentmail`
- **Secret:** Store in `AGENTMAIL_WEBHOOK_SECRET`

Webhook payload:
```json
{
  "event": "message.received",
  "data": {
    "id": "msg_abc123",
    "from": "sender@example.com",
    "subject": "Question about leads",
    "body": "Hello AOX...",
    "timestamp": "2026-03-19T12:00:00Z"
  }
}
```

## CLI Usage

```bash
# Send test email
python agentmail_client.py send "test@example.com" "Test" "Hello from AOX"

# Check inbox
python agentmail_client.py inbox 10

# Send daily report
python agentmail_client.py report "goya@example.com"
```

## Files

| File | Purpose |
|------|---------|
| `agentmail_client.py` | Main client library |
| `webhook_handler.py` | Incoming email webhook |
| `SKILL.md` | This documentation |

## Integration Points

- **Research Agent:** Notify on new high-value leads
- **Scoring Agent:** Alert on scoring anomalies
- **Marketplace Agent:** Buyer communication, delivery
- **CEO (AOX):** Daily reports, critical alerts

## Rate Limits

Check AgentMail dashboard for current limits. Typically:
- Send: 100 emails/hour
- Receive: Unlimited via webhook
- API calls: 1000/hour
