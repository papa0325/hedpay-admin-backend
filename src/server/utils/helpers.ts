import { Pool } from 'pg';
import Config from '../config/config';

export const addJob = async (taskName: string, payload?: any, options?: any) => {
  try {
    const pool = new Pool({ connectionString: Config.db.link });

    options = { ...{ max_attempts: 3 }, ...options };
    let query = `SELECT graphile_worker.add_job($1::text`;
    const values = [taskName];
    if (payload) {
      query += `, payload := $2`;
      values.push(JSON.stringify(payload));
    }

    if (options) {
      let c = values.length;
      ['queue_name', 'max_attempts', 'run_at', 'interval'].forEach((itm) => {
        if (options[itm]) {
          c++;
          if (itm === 'interval') {
            query += `, run_at := NOW() + ($${c} * INTERVAL '1 minute')`;
          } else {
            query += `, ${itm} :=$${c}`;
          }

          values.push(options[itm]);
        }
      });
    }

    query += ')';
    await pool.query(query, values);
    await pool.end();
  } catch (e) {
    console.log(e);
  }
};

export const deleteJob = async (taskName: string, payload?: any) => {
  try {
    const pool = new Pool({ connectionString: Config.db.link });
    await pool.query('DELETE FROM graphile_worker.jobs WHERE task_identifier=$1::text', [taskName]);
    await pool.end();
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const groupByField = (dataArray: any[], field: string, options: { formatItemsFunction?; keyValueMode?: boolean } = {}) => {
  const { formatItemsFunction, keyValueMode } = options;
  return dataArray.reduce((obj: any, itm: any) => {
    if (!itm[field]) {
      return obj;
    }

    if (!obj[itm[field]]) {
      obj[itm[field]] = [];
    }

    if (formatItemsFunction && typeof formatItemsFunction === 'function') {
      itm = formatItemsFunction(itm);
    }

    if (keyValueMode) {
      obj[itm[field]] = itm;
    } else {
      obj[itm[field]].push(itm);
    }

    return obj;
  }, {});
};

export const diffIn = (compareDate: Date, dimension: any, compareWith?: Date) => {
  const dimensions = [1000, 60, 60, 24, 364];
  const literalDim = ['seconds', 'minutes', 'hours', 'days', 'years'];

  if (literalDim.indexOf(dimension) === -1) {
    return null;
  }

  let now = new Date();
  if (compareWith) {
    now = compareWith;
  }

  return eval(`Math.floor((${now.getTime() - compareDate.getTime()}) / (${dimensions.slice(0, literalDim.indexOf(dimension) + 1).join('*')}))`);
};

export const calcOffset = (count, page, onPage) => {
  page = parseInt(page);
  onPage = parseInt(onPage);
  let offset = page * onPage;
  const offsetWithPool = offset + onPage;
  console.log(count);
  console.log(offset);

  if (offset > count) {
    offset += count - offset;
  }

  return offset > 0 ? offset : 0;
};
