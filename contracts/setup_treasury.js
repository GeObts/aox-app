const ethers = require('ethers');
const fs = require('fs');

const CONTRACT_ADDR = '0xeB747c50eD3b327480228E18ffD4bd9Cf8646B47';
const WSTETH = '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452';

function loadEnv() {
    const content = fs.readFileSync(require('path').join(require('os').homedir(), '.openclaw', '.env'), 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
        if (line.includes('=') && !line.startsWith('#')) {
            const idx = line.indexOf('=');
            env[line.substring(0, idx)] = line.substring(idx + 1).replace(/^["']|["']$/g, '');
        }
    }
    return env;
}

async function main() {
    const env = loadEnv();
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(env.AOX_BANKER_PRIVATE_KEY, provider);
    
    const abi = JSON.parse(fs.readFileSync('AgentTreasury.abi', 'utf8'));
    const contract = new ethers.Contract(CONTRACT_ADDR, abi, wallet);
    
    console.log('AgentTreasury Setup');
    console.log('Contract:', CONTRACT_ADDR);
    console.log('Owner:', await contract.owner());
    
    // Check wstETH balance
    const wstethAbi = [
        'function balanceOf(address) view returns (uint256)',
        'function approve(address,uint256) returns (bool)',
        'function allowance(address,address) view returns (uint256)'
    ];
    const wsteth = new ethers.Contract(WSTETH, wstethAbi, wallet);
    const balance = await wsteth.balanceOf(wallet.address);
    console.log(`\nBanker wstETH balance: ${ethers.utils.formatUnits(balance, 18)}`);
    
    if (balance.eq(0)) {
        console.log('No wstETH to deposit');
        return;
    }
    
    // Check if already approved
    const allowance = await wsteth.allowance(wallet.address, CONTRACT_ADDR);
    console.log(`Allowance: ${ethers.utils.formatUnits(allowance, 18)}`);
    
    if (allowance.lt(balance)) {
        console.log('Approving wstETH...');
        const approveTx = await wsteth.approve(CONTRACT_ADDR, balance, {
            gasLimit: 100000,
            maxFeePerGas: ethers.utils.parseUnits('0.1', 'gwei'),
            maxPriorityFeePerGas: ethers.utils.parseUnits('0.01', 'gwei')
        });
        await approveTx.wait();
        console.log('✅ Approved:', approveTx.hash);
    }
    
    // Deposit with manual gas price to avoid conflicts
    console.log(`\nDepositing ${ethers.utils.formatUnits(balance, 18)} wstETH...`);
    const depositTx = await contract.deposit(WSTETH, balance, {
        gasLimit: 200000,
        maxFeePerGas: ethers.utils.parseUnits('0.1', 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits('0.01', 'gwei')
    });
    
    console.log('Transaction:', depositTx.hash);
    console.log('Waiting...');
    
    const receipt = await depositTx.wait();
    console.log(`\n✅ Deposited in block ${receipt.blockNumber}`);
    
    const treasuryBalance = await contract.getContractBalance(WSTETH);
    console.log(`Treasury wstETH: ${ethers.utils.formatUnits(treasuryBalance, 18)}`);
    
    console.log(`\nBaseScan: https://basescan.org/tx/${depositTx.hash}`);
    
    // Save result
    fs.writeFileSync('deposit_result.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        amount: ethers.utils.formatUnits(balance, 18),
        txHash: depositTx.hash,
        block: receipt.blockNumber
    }, null, 2));
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
