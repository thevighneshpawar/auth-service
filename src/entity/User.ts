import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { Tenant } from './Tenant'

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({ unique: true })
    email: string

    @Column()
    password: string

    @Column()
    role: string

    // many user to one tenants
    //multiple mangers for same tenant
    @ManyToOne(() => Tenant)
    tenant: Tenant
}
