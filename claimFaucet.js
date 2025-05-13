import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs/promises';
import { HttpsProxyAgent } from 'https-proxy-agent';

const apiKey = ''; // Ganti dengan API key Multibot kamu
const sitekey = '0x4AAAAAABA4JXCaw9E2Py-9';
const pageurl = 'https://testnet.megaeth.com/';
const claimUrl = 'https://carrot.megaeth.com/claim';

// Ambil proxy (jika ada) dari file
async function getProxyAgent() {
   try {
      const proxyList = await fs.readFile('proxies.txt', 'utf-8');
      const proxyUrl = proxyList
         .trim()
         .split('\n')
         .find((p) => p.trim());
      if (proxyUrl) {
         console.log(`🌐 Menggunakan proxy: ${proxyUrl}`);
         return new HttpsProxyAgent(proxyUrl.trim());
      } else {
         console.log('🌐 Tidak ada proxy, lanjut tanpa proxy.');
         return null;
      }
   } catch {
      console.log('📁 File proxy tidak ditemukan. Lanjut tanpa proxy.');
      return null;
   }
}

// Ambil daftar address
async function getAddresses(path = 'addressClaimFaucet.txt') {
   const data = await fs.readFile(path, 'utf-8');
   return data
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
}

// Solving Captcha pakai Multibot
async function solveCaptcha(agent) {
   const form = new FormData();
   form.append('key', apiKey);
   form.append('method', 'turnstile');
   form.append('sitekey', sitekey);
   form.append('pageurl', pageurl);
   form.append('json', '1');

   const res = await axios.post('http://api.multibot.in/in.php', form, {
      httpsAgent: agent || undefined,
      proxy: false,
      headers: form.getHeaders(),
   });

   if (res.data.status !== 1) throw new Error('❌ Gagal request CAPTCHA');
   const captchaId = res.data.request;

   console.log('🕒 Menunggu token CAPTCHA...');
   for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await axios.get('http://api.multibot.in/res.php', {
         httpsAgent: agent || undefined,
         proxy: false,
         params: {
            key: apiKey,
            action: 'get',
            id: captchaId,
            json: 1,
         },
      });

      if (poll.data.status === 1) {
         console.log('✅ CAPTCHA token didapat');
         return poll.data.request;
      }
   }

   throw new Error('❌ Timeout mendapatkan token CAPTCHA');
}

// Kirim request klaim faucet
async function claimFaucet(addr, token, agent) {
   const res = await axios.post(
      claimUrl,
      { addr, token },
      {
         httpsAgent: agent || undefined,
         proxy: false,
         headers: {
            'content-type': 'application/json',
            origin: pageurl,
            referer: pageurl,
         },
      }
   );

   if (res.data.success) {
      console.log(`🎉 ${addr} berhasil klaim! TX: ${res.data.txhash}`);
   } else {
      throw new Error(res.data.message || 'Gagal klaim');
   }
}

// ▶️ MAIN
async function main() {
   const addresses = await getAddresses('addressClaimFaucet.txt');
   const agent = await getProxyAgent();

   for (const addr of addresses) {
      console.log(`\n🚀 Memproses ${addr}`);
      try {
         const token = await solveCaptcha(agent);
         await claimFaucet(addr, token, agent);
      } catch (err) {
         console.log(`❌ ${addr} gagal: ${err.message}`);
      }

      await new Promise((r) => setTimeout(r, 3000)); // Optional delay antar klaim
   }
}

main();
