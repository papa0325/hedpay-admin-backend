/* eslint-disable */
export const order = (request) => {
  let orderObject = request.query.order;
  const order = [];
  if (orderObject) {
    Object.entries(orderObject).forEach(([key, value]) => {
      const element = [key, value];
      order.push(element);
    });
  }
  return {
    order,
  };
};
