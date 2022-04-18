import Big from 'big.js';
import { INumBuilder } from './interfaces';
import { DECIMALED, RATE } from './actions';
import config from '../../config/config';

export class NumConverter implements INumBuilder {
  _mappedCurrencies: any = {};

  private _respTypes = {
    default: {
      d: 'div',
      p: 'times',
      n: null,
    },
  };

  constructor({ currencies }) {
    this._mappedCurrencies = currencies;
  }

  _prepareObj(n, c, t = 'default', d = 10) {
    const resp: any = {};
    if (this._respTypes[t]) {
      for (const i in this._respTypes[t]) {
        if (this._respTypes[t][i]) {
          resp[i] = new Big(n)[this._respTypes[t][i]](d ** c);
        } else {
          resp[i] = new Big(n);
        }
      }
    }

    return resp;
  }

  [DECIMALED](number: string | number, currency: string) {
    let result = null;
    if (this._mappedCurrencies[currency]) {
      result = this._prepareObj(number, this._mappedCurrencies[currency].decimals);
    }

    return result;
  }

  [RATE](currency: string) {
    return this._prepareObj(this._mappedCurrencies[currency].rate, config.rates.precision);
  }
}
