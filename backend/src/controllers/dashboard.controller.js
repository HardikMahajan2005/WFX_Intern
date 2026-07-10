import {
  getDashboardStats,
  getRevenueByMonth,
} from "../services/dashboard.service.js";


export async function stats(req, res, next) {
  try {
    const data = await getDashboardStats();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}


export async function revenueByMonth(req, res, next) {
  try {
    const data = await getRevenueByMonth();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
