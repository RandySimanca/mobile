import * as auth from 'firebase/auth';
console.log('Persistence keys:', Object.keys(auth).filter(k => k.toLowerCase().includes('persistence')));
