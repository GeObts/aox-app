const ethers = require('ethers');
const fs = require('fs');

const SWAP_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';
const WETH = '0x4200000000000000000000000000000000000006';
const WSTETH = '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452';
const TREASURY = '0xeB747c50eD3b327480228E18ffD4bd9Cf8646B47';

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
    
    console.log('=== AOX Lido Investment Task ===');
    console.log('Banker:', wallet.address);
    console.log('Treasury:', TREASURY);
    console.log('');
    
    // Check balances
    const ethBal = await provider.getBalance(wallet.address);
    console.log(`ETH Balance: ${ethers.utils.formatEther(ethBal)} (~$${(parseFloat(ethers.utils.formatEther(ethBal)) * 1800).toFixed(2)})`);
    
    // Amount to invest: $2 worth of ETH at $1800/ETH = 0.001111 ETH
    // Plus gas buffer, use 0.001 ETH (~$1.80)
    const investAmount = ethers.utils.parseEther('0.0011'); // ~$2
    const gasReserve = ethers.utils.parseEther('0.002'); // Keep for gas
    
    if (ethBal.lt(investAmount.add(gasReserve))) {
        console.error('❌ Insufficient ETH for investment + gas');
        console.log(`Need: ${ethers.utils.formatEther(investAmount)} ETH + ${ethers.utils.formatEther(gasReserve)} ETH for gas`);
        process.exit(1);
    }
    
    console.log(`\n💰 Investing: ${ethers.utils.formatEther(investAmount)} ETH (~$2)`);
    console.log('📈 Target: wstETH (Lido staked ETH on Base)');
    console.log('');
    
    // Step 1: Swap ETH → wstETH via Uniswap V3
    console.log('Step 1: Swapping ETH for wstETH...');
    
    const routerAbi = [
        'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
        'function multicall(bytes[] calldata data) payable external returns (bytes[] memory results)'
    ];
    
    const router = new ethers.Contract(SWAP_ROUTER, routerAbi, wallet);
    const routerInterface = new ethers.utils.Interface(routerAbi);
    
    const swapParams = {
        tokenIn: WETH,
        tokenOut: WSTETH,
        fee: 500,
        recipient: wallet.address,
        amountIn: investAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
    };
    
    const swapData = routerInterface.encodeFunctionData('exactInputSingle', [swapParams]);
    
    const swapTx = await router.multicall([swapData], {
        value: investAmount,
        gasLimit: 300000,
        maxFeePerGas: ethers.utils.parseUnits('0.1', 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits('0.01', 'gwei')
    });
    
    console.log('  Swap tx:', swapTx.hash);
    const swapReceipt = await swapTx.wait();
    console.log('  ✅ Swapped in block', swapReceipt.blockNumber);
    
    // Check wstETH received
    const wstethAbi = [
        'function balanceOf(address) view returns (uint256)',
        'function approve(address,uint256) returns (bool)',
        'function allowance(address,address) view returns (uint256)'
    ];
    const wsteth = new ethers.Contract(WSTETH, wstethAbi, wallet);
    const wstethBal = await wsteth.balanceOf(wallet.address);
    console.log(`  wstETH received: ${ethers.utils.formatEther(wstethBal)}`);
    
    // Step 2: Approve treasury
    console.log('\nStep 2: Approving treasury...');
    const approveTx = await wsteth.approve(TREASURY, wstethBal, {
        gasLimit: 100000,
        maxFeePerGas: ethers.utils.parseUnits('0.1', 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits('0.01', 'gwei')
    });
    await approveTx.wait();
    console.log('  ✅ Approved');
    
    // Step 3: Deposit to AgentTreasury
    console.log('\nStep 3: Depositing to AgentTreasury...');
    
    const treasuryAbi = JSON.parse(fs.readFileSync('AgentTreasury.abi', 'utf8'));
    const treasury = new ethers.Contract(TREASURY, treasuryAbi, wallet);
    
    const depositTx = await treasury.deposit(WSTETH, wstethBal, {
        gasLimit: 200000,
        maxFeePerGas: ethers.utils.parseUnits('0.1', 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits('0.01', 'gwei')
    });
    
    console.log('  Deposit tx:', depositTx.hash);
    const depositReceipt = await depositTx.wait();
    console.log('  ✅ Deposited in block', depositReceipt.blockNumber);
    
    // Verify
    const treasuryBalance = await treasury.getContractBalance(WSTETH);
    console.log('\n📊 Treasury wstETH Balance:', ethers.utils.formatEther(treasuryBalance));
    console.log('💹 Now earning ~3-4% APY from Lido staking!');
    
    console.log('\n🔗 Transaction Links:');
    console.log('  Swap:', `https://basescan.org/tx/${swapTx.hash}`);
    console.log('  Deposit:', `https://basescan.org/tx/${depositTx.hash}`);
    
    // Save results
    fs.writeFileSync('lido_investment_result.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        ethInvested: ethers.utils.formatEther(investAmount),
        wstethReceived: ethers.utils.formatEther(wstethBal),
        treasuryBalance: ethers.utils.formatEther(treasuryBalance),
        swapTx: swapTx.hash,
        depositTx: depositTx.hash,
        status: 'success'
    }, null, 2));
    
    console.log('\n✅ Lido investment complete!');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
