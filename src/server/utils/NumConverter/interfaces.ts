import { DECIMALED } from './actions';

export interface INumBuilder {
    _mappedCurrencies: object,

    [DECIMALED](number, currency): any,
}
