import { searchFinishedGoods } from "../services/search.service.js";

export async function searchText(req, res, next) {
  try {
    const { q, category, fabric, color, page, limit } = req.query;

    const { data, total } = await searchFinishedGoods({
      q,
      category,
      fabric,
      color,
      page,
      limit,
    });

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}
