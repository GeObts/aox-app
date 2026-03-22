#!/usr/bin/env python3
"""
AOX Marketplace API Server
Simple HTTP server for aox-app to fetch listings
"""

import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

LISTINGS_FILE = os.path.expanduser('~/.openclaw/agents/marketplace/output/listings.json')
PORT = int(os.getenv('MARKETPLACE_API_PORT', '8080'))

class MarketplaceHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Custom logging
        print(f"[{self.log_date_time_string()}] {args[0]}")
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        
        if path == '/api/leads':
            # Get all available listings
            self._handle_get_listings(params)
        elif path.startswith('/api/leads/'):
            # Get specific lead
            lead_id = path.split('/')[-1]
            self._handle_get_lead(lead_id)
        elif path == '/health':
            self._send_json({'status': 'ok', 'service': 'aox-marketplace'})
        else:
            self._send_json({'error': 'Not found'}, 404)
    
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        if path == '/api/purchase':
            self._handle_purchase()
        elif path == '/webhook/payment':
            self._handle_payment_webhook()
        else:
            self._send_json({'error': 'Not found'}, 404)
    
    def _handle_get_listings(self, params):
        """Return available listings."""
        try:
            if not os.path.exists(LISTINGS_FILE):
                self._send_json({'listings': []})
                return
            
            with open(LISTINGS_FILE) as f:
                data = json.load(f)
            
            listings = data.get('listings', [])
            
            # Filter by status
            status_filter = params.get('status', ['available'])[0]
            if status_filter != 'all':
                listings = [l for l in listings if l['status'] == status_filter]
            
            # Filter by category
            category = params.get('category', [None])[0]
            if category:
                listings = [l for l in listings if l['category'].lower() == category.lower()]
            
            # Filter by tier
            tier = params.get('tier', [None])[0]
            if tier:
                listings = [l for l in listings if l['tier'].lower() == tier.lower()]
            
            # Return public data only (no payment addresses, no private hashes)
            public_listings = []
            for listing in listings:
                public_listings.append({
                    'id': listing['id'],
                    'status': listing['status'],
                    'category': listing['category'],
                    'title': listing['title'],
                    'description': listing['description'],
                    'score': listing['score'],
                    'tier': listing['tier'],
                    'price': listing['price'],
                    'payment_token': listing['payment_token'],
                    'listed_at': listing['listed_at'],
                    'expires_at': listing['expires_at'],
                    'metadata': listing.get('public_metadata', {})
                })
            
            self._send_json({'listings': public_listings, 'count': len(public_listings)})
            
        except Exception as e:
            self._send_json({'error': str(e)}, 500)
    
    def _handle_get_lead(self, lead_id: str):
        """Get specific lead (for purchase flow)."""
        try:
            with open(LISTINGS_FILE) as f:
                data = json.load(f)
            
            listings = data.get('listings', [])
            listing = next((l for l in listings if l['id'] == lead_id), None)
            
            if not listing:
                self._send_json({'error': 'Lead not found'}, 404)
                return
            
            if listing['status'] != 'available':
                self._send_json({'error': 'Lead not available'}, 400)
                return
            
            # Return with payment address
            self._send_json({
                'id': listing['id'],
                'title': listing['title'],
                'description': listing['description'],
                'price': listing['price'],
                'payment_token': listing['payment_token'],
                'payment_address': listing.get('payment_address'),
                'tier': listing['tier'],
                'score': listing['score']
            })
            
        except Exception as e:
            self._send_json({'error': str(e)}, 500)
    
    def _handle_purchase(self):
        """Initiate purchase."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode()
        
        try:
            data = json.loads(body)
            lead_id = data.get('lead_id')
            buyer_email = data.get('buyer_email')
            
            # In production: validate, generate unique payment session, etc.
            self._send_json({
                'status': 'pending',
                'lead_id': lead_id,
                'message': 'Send payment to the provided address'
            })
            
        except Exception as e:
            self._send_json({'error': str(e)}, 400)
    
    def _handle_payment_webhook(self):
        """Receive payment notification from blockchain monitoring."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode()
        
        try:
            data = json.loads(body)
            # Process payment confirmation
            # This would trigger the marketplace agent to deliver lead
            self._send_json({'status': 'received'})
        except Exception as e:
            self._send_json({'error': str(e)}, 400)

def run_server():
    server = HTTPServer(('0.0.0.0', PORT), MarketplaceHandler)
    print(f"AOX Marketplace API running on port {PORT}")
    print(f"Endpoints:")
    print(f"  GET  http://localhost:{PORT}/api/leads")
    print(f"  GET  http://localhost:{PORT}/api/leads/<id>")
    print(f"  POST http://localhost:{PORT}/api/purchase")
    print(f"  GET  http://localhost:{PORT}/health")
    server.serve_forever()

if __name__ == '__main__':
    run_server()
