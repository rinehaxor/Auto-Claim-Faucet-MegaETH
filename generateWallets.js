import { Wallet } from 'ethers';
import fs from 'fs/promises';
import readline from 'readline';

// Fungsi untuk input dari terminal
function ask(question) {
   const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
   });
   return new Promise((resolve) =>
      rl.question(question, (ans) => {
         rl.close();
         resolve(ans);
      })
   );
}

async function generateWallets(count) {
   const result = [];

   for (let i = 0; i < count; i++) {
      const wallet = Wallet.createRandom();
      result.push(`Address: ${wallet.address}\nPrivateKey: ${wallet.privateKey}\nMnemonic: ${wallet.mnemonic.phrase}\n---`);
   }

   const output = result.join('\n') + '\n';
   await fs.writeFile('walletsCreated.txt', output);
   console.log(`✅ ${count} wallet berhasil dibuat dan disimpan ke wallets.txt`);
}

// ▶️ MAIN
(async () => {
   const jumlah = await ask('Berapa wallet yang ingin dibuat? ');
   const n = parseInt(jumlah);
   if (isNaN(n) || n <= 0) {
      console.log('❌ Input tidak valid');
      return;
   }
   await generateWallets(n);
})();
