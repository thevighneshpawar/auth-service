import fs from 'fs'
import rsaPemToJwk from 'rsa-pem-to-jwk'

const privateKey = fs.readFileSync('./auth-service-new/certs/private.pem')

const jwk = rsaPemToJwk(privateKey, { use: 'sig' }, 'public')

console.log(JSON.stringify(jwk))
