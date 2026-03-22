# BaseScan API Reference

## Free Tier Limits
- 5 calls/second
- 100,000 calls/day
- Requires API key

## Get API Key
1. Go to: https://basescan.org/apis
2. Create account
3. Generate API key
4. Add to ~/.openclaw/.env: `BASESCAN_API_KEY=your_key`

## Key Endpoints

### Get Latest Block
```
GET https://api.basescan.org/api
  ?module=proxy
  &action=eth_blockNumber
  &apikey=YourApiKey
```

### Get Contract Source
```
GET https://api.basescan.org/api
  ?module=contract
  &action=getsourcecode
  &address=0x...
  &apikey=YourApiKey
```

### Get Token Holders
```
GET https://api.basescan.org/api
  ?module=token
  &action=tokenholderlist
  &contractaddress=0x...
  &page=1
  &offset=10
  &apikey=YourApiKey
```

### Get Transactions
```
GET https://api.basescan.org/api
  ?module=account
  &action=tokentx
  &contractaddress=0x...
  &page=1
  &offset=100
  &apikey=YourApiKey
```
