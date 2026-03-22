#!/usr/bin/env node
/**
 * AOX Marketplace API Server
 * Serves listings.json with CORS for Vercel frontend
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.MARKETPLACE_API_PORT || 3200;
const LISTINGS_FILE = path.join(process.env.HOME || '/home/ubuntu', '.openclaw/agents/marketplace/output/listings.json');
const ALLOWED_ORIGINS = [
  'https://aox.llc',
  'https://www.aox.llc',
  'https://aox-app.vercel.app',
  'https://aox-ebooks.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

// CORS headers
const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
});

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(allowedOrigin));
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, corsHeaders(allowedOrigin));
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'aox-marketplace-api',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // GET /leads - Available listings
  if (url.pathname === '/leads' && req.method === 'GET') {
    try {
      if (!fs.existsSync(LISTINGS_FILE)) {
        res.writeHead(200, corsHeaders(allowedOrigin));
        res.end(JSON.stringify({ listings: [], count: 0 }));
        return;
      }
      
      const data = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf8'));
      const listings = data.listings || [];
      
      // Filter by status if requested
      const status = url.searchParams.get('status') || 'available';
      const filtered = status === 'all' 
        ? listings 
        : listings.filter(l => l.status === status);
      
      // Return public data only
      const publicListings = filtered.map(l => ({
        id: l.id,
        status: l.status,
        category: l.category,
        title: l.title,
        description: l.description,
        score: l.score,
        tier: l.tier,
        price: l.price,
        payment_token: l.payment_token,
        listed_at: l.listed_at,
        expires_at: l.expires_at,
        metadata: l.public_metadata || {}
      }));
      
      res.writeHead(200, corsHeaders(allowedOrigin));
      res.end(JSON.stringify({ 
        listings: publicListings, 
        count: publicListings.length,
        updated_at: data.updated_at 
      }));
      
    } catch (error) {
      console.error('Error reading listings:', error);
      res.writeHead(500, corsHeaders(allowedOrigin));
      res.end(JSON.stringify({ error: 'Failed to read listings' }));
    }
    return;
  }
  
  // GET /leads/:id - Specific lead
  if (url.pathname.match(/^\/leads\/[^\/]+$/) && req.method === 'GET') {
    const leadId = url.pathname.split('/')[2];
    
    try {
      const data = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf8'));
      const listing = data.listings?.find(l => l.id === leadId);
      
      if (!listing) {
        res.writeHead(404, corsHeaders(allowedOrigin));
        res.end(JSON.stringify({ error: 'Lead not found' }));
        return;
      }
      
      if (listing.status !== 'available') {
        res.writeHead(400, corsHeaders(allowedOrigin));
        res.end(JSON.stringify({ error: 'Lead not available' }));
        return;
      }
      
      res.writeHead(200, corsHeaders(allowedOrigin));
      res.end(JSON.stringify({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        payment_token: listing.payment_token,
        payment_address: listing.payment_address,
        tier: listing.tier,
        score: listing.score
      }));
      
    } catch (error) {
      res.writeHead(500, corsHeaders(allowedOrigin));
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }
  
  // POST /webhook/new-lead - Triggered by Policy Gate
  if (url.pathname === '/webhook/new-lead' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('New lead webhook received:', data.lead_id);
        
        // Trigger marketplace agent to process
        // In production: spawn process or queue job
        res.writeHead(200, corsHeaders(allowedOrigin));
        res.end(JSON.stringify({ status: 'received', lead_id: data.lead_id }));
      } catch (e) {
        res.writeHead(400, corsHeaders(allowedOrigin));
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // 404
  res.writeHead(404, corsHeaders(allowedOrigin));
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AOX Marketplace API running on port ${PORT}`);
  console.log(`📁 Serving: ${LISTINGS_FILE}`);
  console.log(`🌐 CORS allowed origins:`);
  ALLOWED_ORIGINS.forEach(o => console.log(`   - ${o}`));
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  http://your-ec2-ip:${PORT}/health`);
  console.log(`  GET  http://your-ec2-ip:${PORT}/leads`);
  console.log(`  GET  http://your-ec2-ip:${PORT}/leads/<id>`);
  console.log(`  POST http://your-ec2-ip:${PORT}/webhook/new-lead`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});
