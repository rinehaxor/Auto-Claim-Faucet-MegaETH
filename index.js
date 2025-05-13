import { ethers } from 'ethers';
import fs from 'fs/promises';
import readline from 'readline';

// --- Konfigurasi ---
const receiver = '';
const rpcUrl = 'https://carrot.megaeth.com/rpc';
const privateKeyPath = 'pk.txt';

// Baca input dari terminal
function askQuestion(query) {
   const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
   });
   return new Promise((resolve) =>
      rl.question(query, (ans) => {
         rl.close();
         resolve(ans);
      })
   );
}

// Kirim token dari satu wallet
async function sendFromWallet(privateKey, amount) {
   try {
      if (!privateKey.startsWith('0x')) {
         privateKey = '0x' + privateKey;
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      const balance = await provider.getBalance(wallet.address);
      console.log(`👜 Wallet ${wallet.address} | Balance: ${ethers.formatEther(balance)} MEGA`);

      if (balance < ethers.parseEther(amount)) {
         console.log('❌ Saldo tidak cukup, lewati...');
         return;
      }

      const tx = await wallet.sendTransaction({
         to: receiver,
         value: ethers.parseEther(amount),
         maxPriorityFeePerGas: ethers.parseUnits('0.0025', 'gwei'),
         maxFeePerGas: ethers.parseUnits('0.005', 'gwei'),
      });

      console.log(`🚀 TX terkirim dari ${wallet.address} → ${receiver}`);
      console.log(`🔗 Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Terkonfirmasi di block: ${receipt.blockNumber}`);
   } catch (err) {
      console.error('❌ Gagal kirim:', err.message);
   }
}

// Main function
async function main() {
   const amount = await askQuestion('Masukkan jumlah MEGA ETH yang ingin dikirim dari tiap wallet: ');
   const content = await fs.readFile(privateKeyPath, 'utf-8');
   const privateKeys = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');

   console.log(`\n🔄 Mulai proses kirim dari ${privateKeys.length} wallet:\n`);
   for (let i = 0; i < privateKeys.length; i++) {
      console.log(`--- Wallet ${i + 1} ---`);
      await sendFromWallet(privateKeys[i], amount);
      console.log(); // spasi antar wallet
   }
}

main();
