import bcrypt from 'bcryptjs'

export class CredentialService {
    async comparePassword(userpassword: string, passwordHash: string) {
        return await bcrypt.compare(userpassword, passwordHash)
    }
}
