import { listSalesInvoices } from "../services/salesInvoices.service.js";

export async function index(req, res, next) {
  try {
    const { data, total } = await listSalesInvoices(req.query);
    const { page, limit } = req.query;
    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}
