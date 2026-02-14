import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
const pk = generatePrivateKey();
const addr = privateKeyToAccount(pk).address;
console.log('PK:' + pk);
console.log('ADDR:' + addr);
