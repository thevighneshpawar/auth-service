import { Repository } from 'typeorm'
import { Itenant } from '../types'
import { Tenant } from '../entity/Tenant'

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}

    async create(tenantData: Itenant) {
        return await this.tenantRepository.save(tenantData)
    }
}
