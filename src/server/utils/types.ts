export enum AuthType {
  REGISTER = 'C',
  LOGIN = 'I',
  LOGOUT = 'O',
  REFRESH = 'R',
  RESTORE = 'P',
  RESET_PASSWORD = 'N',
}

export enum MessageType { // Types of messages sent from the broker to a trader (outbound messages).
  Error = '!',
}

export enum AssetType {
  INFO = 'C',
  STATUS = 'B',
  CREATE = 'A',
}

export enum FeeType {
  DISCOUNTEDIT = 'G',
  BASEEDIT = 'H',
}

export enum FeeActionType {
  INSERT = 'I',
  UPDATE = 'U',
  DELETE = 'D',
}

export enum SymbolType {
  CREATE = 'C',
  //INFO = 'C',
  FEES = 'D',
  LIMITS = 'E',
  STATUS = 'F',
}

export enum OrderType {
  CANCEL = 'D',
}

export enum EmailType {
  REGISTRATION = 'registration',
  REGISTRATION_ADMIN = 'adminRegistration',
  PASSWORD_RESET = 'passwordReset',
  PASSWORD_CHANGE = 'passwordChange',
  WITHDRAWAL = 'beforeWithdrawal',
}

export enum AccountType {
  FEES = 'G',
}

export enum AdminRole {
  SUPERADMIN = 2,
  ADMIN = 1,
}

export enum TypeLogs {
  BAN = 'ban',
  UNBAN = 'unban',
  AUTH = 'auth',
}
