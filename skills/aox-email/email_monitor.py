#!/usr/bin/env python3
"""
AOX Email Monitor
Polls inbox and processes incoming emails
"""

import os
import json
import time
import imaplib
import ssl
from datetime import datetime
from email.parser import BytesParser
from typing import Dict, List, Optional

# Config
IMAP_SERVER = os.getenv('AGENTMAIL_IMAP_SERVER', 'imap.agentmail.to')
IMAP_PORT = int(os.getenv('AGENTMAIL_IMAP_PORT', '993'))
EMAIL = os.getenv('AGENTMAIL_EMAIL', 'aox@agentmail.com')
PASSWORD = os.getenv('AGENTMAIL_API_KEY', '')

CHECK_INTERVAL = 300  # 5 minutes
PROCESSED_FILE = os.path.expanduser('~/.openclaw/agents/email/processed_ids.json')
LOG_DIR = os.path.expanduser('~/.openclaw/agents/email/logs')

class EmailMonitor:
    def __init__(self):
        self.ssl_context = ssl.create_default_context()
        self.processed_ids = self._load_processed()
        os.makedirs(LOG_DIR, exist_ok=True)
        os.makedirs(os.path.dirname(PROCESSED_FILE), exist_ok=True)
    
    def _load_processed(self) -> set:
        if os.path.exists(PROCESSED_FILE):
            with open(PROCESSED_FILE) as f:
                return set(json.load(f))
        return set()
    
    def _save_processed(self):
        with open(PROCESSED_FILE, 'w') as f:
            json.dump(list(self.processed_ids), f)
    
    def log(self, message: str):
        ts = datetime.now().isoformat()
        entry = f"[{ts}] {message}"
        print(entry)
        with open(f"{LOG_DIR}/monitor.log", 'a') as f:
            f.write(entry + '\n')
    
    def _extract_body(self, msg) -> str:
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == 'text/plain':
                    try:
                        return part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except:
                        pass
        else:
            try:
                return msg.get_payload(decode=True).decode('utf-8', errors='ignore')
            except:
                pass
        return ""
    
    def _classify_email(self, subject: str, body: str, sender: str) -> str:
        """Classify email type."""
        text = f"{subject} {body}".lower()
        
        if any(word in text for word in ['buy', 'purchase', 'order', 'payment', 'interested in']):
            return 'BUYER_INQUIRY'
        elif any(word in text for word in ['support', 'help', 'issue', 'problem', 'question']):
            return 'SUPPORT_REQUEST'
        elif any(word in text for word in ['lead', 'token', 'trader', 'new']):
            return 'LEAD_SUBMISSION'
        elif any(word in text for word in ['report', 'daily', 'summary']):
            return 'REPORT_REQUEST'
        else:
            return 'GENERAL'
    
    def _process_email(self, msg_id: str, msg_data: Dict):
        """Process a single email."""
        email_type = self._classify_email(
            msg_data['subject'],
            msg_data['body'],
            msg_data['from']
        )
        
        self.log(f"📧 New {email_type}: {msg_data['subject'][:50]} from {msg_data['from']}")
        
        # Save to appropriate file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{LOG_DIR}/{email_type}_{timestamp}_{msg_id}.json"
        
        with open(filename, 'w') as f:
            json.dump({
                'msg_id': msg_id,
                'type': email_type,
                'from': msg_data['from'],
                'to': msg_data['to'],
                'subject': msg_data['subject'],
                'date': msg_data['date'],
                'body': msg_data['body'][:1000],  # Truncate
                'processed_at': datetime.now().isoformat()
            }, f, indent=2)
        
        self.log(f"  Saved to: {filename}")
        
        # Mark as processed
        self.processed_ids.add(msg_id)
        self._save_processed()
    
    def check_inbox(self) -> int:
        """Check inbox for new messages."""
        new_count = 0
        
        try:
            with imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT, ssl_context=self.ssl_context) as mail:
                mail.login(EMAIL, PASSWORD)
                mail.select('INBOX')
                
                # Search for all messages
                status, data = mail.search(None, 'ALL')
                if status != 'OK':
                    return 0
                
                msg_ids = data[0].split()
                
                for msg_id in msg_ids:
                    msg_id_str = msg_id.decode()
                    
                    # Skip already processed
                    if msg_id_str in self.processed_ids:
                        continue
                    
                    # Fetch message
                    status, msg_data = mail.fetch(msg_id, '(RFC822)')
                    if status != 'OK':
                        continue
                    
                    raw_msg = msg_data[0][1]
                    parsed = BytesParser().parsebytes(raw_msg)
                    
                    email_data = {
                        'id': msg_id_str,
                        'from': parsed.get('From', ''),
                        'to': parsed.get('To', ''),
                        'subject': parsed.get('Subject', ''),
                        'date': parsed.get('Date', ''),
                        'body': self._extract_body(parsed)
                    }
                    
                    self._process_email(msg_id_str, email_data)
                    new_count += 1
                
                # mail.close()
            
            return new_count
            
        except Exception as e:
            self.log(f"❌ Error checking inbox: {e}")
            return 0
    
    def run_once(self):
        """Check inbox once."""
        self.log("=" * 50)
        self.log("Checking inbox...")
        new = self.check_inbox()
        self.log(f"Found {new} new messages")
        self.log("=" * 50)
    
    def run_forever(self):
        """Run monitor loop."""
        self.log("=" * 50)
        self.log("AOX Email Monitor Started")
        self.log(f"Checking every {CHECK_INTERVAL} seconds")
        self.log("=" * 50)
        
        while True:
            try:
                new = self.check_inbox()
                if new > 0:
                    self.log(f"Processed {new} new emails")
            except Exception as e:
                self.log(f"Error in monitor loop: {e}")
            
            time.sleep(CHECK_INTERVAL)

if __name__ == '__main__':
    import sys
    
    monitor = EmailMonitor()
    
    if len(sys.argv) > 1 and sys.argv[1] == 'loop':
        monitor.run_forever()
    else:
        monitor.run_once()
