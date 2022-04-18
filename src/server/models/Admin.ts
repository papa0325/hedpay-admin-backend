import { Column, Scopes, DataType, Model, Table, HasMany } from 'sequelize-typescript';
import config from '../config/config';
import * as bcrypt from 'bcrypt';
import { AdminRole } from '../utils/types';
import { AdminSession } from './AdminSession';

interface IAdminSettings {
  is2FA: boolean;
  Secret2FA: string;
  confirmationToken: string;
}

@Scopes(() => ({
  auth: {
    attributes: {
      include: ['settings', 'password'],
    },
  },
}))
@Table({
  defaultScope: {
    attributes: {
      exclude: ['settings', 'password', 'createdAt', 'updatedAt'],
    },
  },
})
export class Admin extends Model<Admin> {
  @Column({ type: DataType.STRING, unique: true })
  email: string;

  @Column({
    type: DataType.STRING,
    set(this: Admin, value: string) {
      let salt = bcrypt.genSaltSync(config.security.saltRounds);
      let hash = bcrypt.hashSync(value, salt);

      this.setDataValue(`password`, hash);
    },
    get(this: Admin) {
      return this.getDataValue('password');
    },
  })
  password: string;

  @Column(DataType.STRING)
  firstName: string;

  @Column(DataType.STRING)
  lastName: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: {
      confirmationToken: null,
      is2FA: false,
      Secret2FA: null,
    },
  })
  settings: IAdminSettings;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  role: AdminRole;

  @Column({ type: DataType.INTEGER, defaultValue: 2 })
  status: number; // 0 - account activated, 1 - account deactivated, 2 - account not validated,  3 - account not registered completely

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  banned: boolean;

  @HasMany(() => AdminSession, { onDelete: 'CASCADE' })
  sessions: AdminSession[];

  // prettier-ignore
  async passwordCompare(pwd: string) {
    return bcrypt.compareSync(
      pwd,
      (
        await this.sequelize.models.Admin.findByPk(this.id, {
          attributes: ['password'],
        })// @ts-ignore
      ).password 
    );
  }
}
