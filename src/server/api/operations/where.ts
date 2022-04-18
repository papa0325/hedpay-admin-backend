export const where = (request) => {
  let where = request.query.where;
  if (!where) {
    where = {};
  }
  return {
    where,
  };
};
