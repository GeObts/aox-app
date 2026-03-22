#!/usr/bin/env python3
"""
AOX AgentMail Client
Email integration using SMTP/IMAP (AgentMail native protocol)
"""

import os
import json
import smtplib
import imaplib
import ssl
from datetime import datetime
from typing import Dict, List, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.parser import BytesParser

# AgentMail Configuration
AGENTMAIL_EMAIL = os.getenv('AGENTMAIL_EMAIL', 'aox@agentmail.com')
AGENTMAIL_API_KEY = os.getenv('AGENTMAIL_API_KEY', '')
SMTP_SERVER = os.getenv('AGENTMAIL_SMTP_SERVER', 'smtp.agentmail.to')
SMTP_PORT = int(os.getenv('AGENTMAIL_SMTP_PORT', '465'))
IMAP_SERVER = os.getenv('AGENTMAIL_IMAP_SERVER', 'imap.agentmail.to')
IMAP_PORT = int(os.getenv('AGENTMAIL_IMAP_PORT', '993'))

class AgentMailClient:
    """Client for AgentMail using SMTP/IMAP."""
    
    def __init__(self):
        self.email = AGENTMAIL_EMAIL
        self.password = AGENTMAIL_API_KEY  # API key is the password
        self.smtp_server = SMTP_SERVER
        self.smtp_port = SMTP_PORT
        self.imap_server = IMAP_SERVER
        self.imap_port = IMAP_PORT
        
        self.ssl_context = ssl.create_default_context()
    
    def send_email(self, to: str, subject: str, body: str, 
                   html: bool = False, cc: List[str] = None) -> bool:
        """Send an email from AOX."""
        try:
            msg = MIMEMultipart('alternative') if html else MIMEText(body)
            
            if html:
                msg.attach(MIMEText(body, 'plain'))
                msg.attach(MIMEText(body, 'html'))
            
            msg['Subject'] = subject
            msg['From'] = self.email
            msg['To'] = to
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            
            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, 
                                  context=self.ssl_context) as server:
                server.login(self.email, self.password)
                recipients = [to] + (cc or [])
                server.sendmail(self.email, recipients, msg.as_string())
            
            print(f"✅ Email sent to {to}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            return False
    
    def get_messages(self, limit: int = 20, unread_only: bool = False) -> List[Dict]:
        """Get messages from inbox."""
        messages = []
        
        try:
            with imaplib.IMAP4_SSL(self.imap_server, self.imap_port,
                                   ssl_context=self.ssl_context) as mail:
                mail.login(self.email, self.password)
                mail.select('INBOX')
                
                # Search for messages
                if unread_only:
                    status, data = mail.search(None, 'UNSEEN')
                else:
                    status, data = mail.search(None, 'ALL')
                
                if status != 'OK':
                    return messages
                
                msg_ids = data[0].split()
                msg_ids = msg_ids[-limit:]  # Get last N
                
                for msg_id in reversed(msg_ids):
                    status, msg_data = mail.fetch(msg_id, '(RFC822)')
                    if status == 'OK':
                        raw_msg = msg_data[0][1]
                        parsed = BytesParser().parsebytes(raw_msg)
                        
                        messages.append({
                            'id': msg_id.decode(),
                            'from': parsed.get('From', ''),
                            'to': parsed.get('To', ''),
                            'subject': parsed.get('Subject', ''),
                            'date': parsed.get('Date', ''),
                            'body': self._extract_body(parsed)
                        })
                
                # mail.close()
            
            return messages
            
        except Exception as e:
            print(f"❌ Failed to get messages: {e}")
            return []
    
    def _extract_body(self, msg) -> str:
        """Extract body from email message."""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == 'text/plain':
                    try:
                        return part.get_payload(decode=True).decode('utf-8')
                    except:
                        pass
        else:
            try:
                return msg.get_payload(decode=True).decode('utf-8')
            except:
                pass
        return ""
    
    def send_daily_report(self, recipient: str, report_data: Dict) -> bool:
        """Send AOX daily report."""
        subject = f"☀️ AOX Daily Report — {report_data.get('date', datetime.now().strftime('%Y-%m-%d'))}"
        
        body = f"""
AOX Daily Report — {report_data.get('date', datetime.now().strftime('%Y-%m-%d'))}

📊 Pipeline Summary
- Leads Discovered: {report_data.get('leads_discovered', 0)}
- Leads Scored: {report_data.get('leads_scored', 0)}
- Leads Listed: {report_data.get('leads_listed', 0)}
- Sales Completed: {report_data.get('sales_completed', 0)}

💰 Revenue
- Revenue Today: ${report_data.get('revenue_today', 0)} USDC
- Treasury Balance: ${report_data.get('treasury_balance', 0)} USDC

⚙️ System Status
- All Agents: {report_data.get('agent_status', 'Unknown')}
- Last Sale: {report_data.get('last_sale', 'None')}

This is an automated report from AOX (Agent Opportunity Exchange).
Reply to this email to contact the AOX CEO.

—
AOX // Agent Opportunity Exchange
{self.email}
https://aox.llc
"""
        return self.send_email(recipient, subject, body.strip())
    
    def send_alert(self, recipient: str, alert_type: str, 
                   message: str, details: Dict = None) -> bool:
        """Send urgent alert."""
        subject = f"🚨 AOX ALERT — {alert_type}"
        
        details_str = json.dumps(details or {}, indent=2)
        
        body = f"""
🚨 AOX ALERT — {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}

Issue: {message}

Details:
{details_str}

Action Required: Check AOX dashboard immediately.

—
AOX // Agent Opportunity Exchange
{self.email}
"""
        return self.send_email(recipient, subject, body.strip())
    
    def send_lead_notification(self, recipient: str, lead: Dict) -> bool:
        """Notify about new high-quality lead."""
        subject = f"✨ New {lead.get('tier', 'Standard')} Lead — {lead.get('category', 'Unknown')}"
        
        body = f"""
New Lead Available on AOX Marketplace

Category: {lead.get('category', 'Unknown')}
Tier: {lead.get('tier', 'Standard')}
Score: {lead.get('score', 0)}/100
Price: ${lead.get('price', 0)} {lead.get('payment_token', 'USDC')}

{lead.get('description', 'No description available.')}

View on marketplace: https://aox.llc/marketplace

—
AOX // Agent Opportunity Exchange
"""
        return self.send_email(recipient, subject, body.strip())
    
    def test_connection(self) -> bool:
        """Test SMTP and IMAP connections."""
        try:
            # Test SMTP
            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port,
                                  context=self.ssl_context) as server:
                server.login(self.email, self.password)
            print("✅ SMTP connection OK")
            
            # Test IMAP
            with imaplib.IMAP4_SSL(self.imap_server, self.imap_port,
                                   ssl_context=self.ssl_context) as mail:
                mail.login(self.email, self.password)
                mail.select('INBOX')
                # mail.close()
            print("✅ IMAP connection OK")
            
            return True
            
        except Exception as e:
            print(f"❌ Connection test failed: {e}")
            return False

# CLI for testing
if __name__ == '__main__':
    import sys
    
    client = AgentMailClient()
    
    if len(sys.argv) < 2:
        print("Usage: python agentmail_client.py <command> [args]")
        print("Commands:")
        print("  test                           Test connection")
        print("  send <to> <subject> <body>     Send email")
        print("  inbox [limit]                  List inbox messages")
        print("  report <to>                    Send test daily report")
        sys.exit(1)
    
    cmd = sys.argv[1]
    
    if cmd == 'test':
        success = client.test_connection()
        sys.exit(0 if success else 1)
    
    elif cmd == 'send' and len(sys.argv) >= 5:
        success = client.send_email(sys.argv[2], sys.argv[3], sys.argv[4])
        sys.exit(0 if success else 1)
    
    elif cmd == 'inbox':
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        messages = client.get_messages(limit=limit)
        print(f"\n📧 Inbox ({len(messages)} messages):\n")
        for msg in messages:
            print(f"  [{msg['id'][:8]}] {msg['from']}")
            print(f"    Subject: {msg['subject']}")
            print(f"    Date: {msg['date']}")
            print()
    
    elif cmd == 'report' and len(sys.argv) >= 3:
        report = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'leads_discovered': 15,
            'leads_scored': 12,
            'leads_listed': 8,
            'sales_completed': 3,
            'revenue_today': 120,
            'treasury_balance': 2840,
            'agent_status': 'All Operational',
            'last_sale': '2026-03-19 14:30 UTC'
        }
        success = client.send_daily_report(sys.argv[2], report)
        sys.exit(0 if success else 1)
    
    else:
        print("Unknown command or missing arguments")
