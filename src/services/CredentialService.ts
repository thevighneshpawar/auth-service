import bcrypt from 'bcrypt'

export class CredentialService {
    async comparePassword(userpassword: string, passwordHash: string) {
        return await bcrypt.compare(userpassword, passwordHash)
    }
}
