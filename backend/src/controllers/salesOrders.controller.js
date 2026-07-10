import { listSalesOrders } from "../services/salesOrders.service.js";

export async function index(req, res, next) {
  try {
    const { data, total } = await listSalesOrders(req.query);
    const { page, limit } = req.query;
    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}
