/* eslint-disable */

import adminApi from './admin';
import chatApi from './chat';
import dashboardApi from './dashboard';
import operationsApi from './operations';
import statsApi from './stats';

export default [...adminApi, ...chatApi, ...dashboardApi, ...operationsApi, ...statsApi];
