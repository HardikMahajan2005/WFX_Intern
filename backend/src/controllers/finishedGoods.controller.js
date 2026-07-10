import {
  listFinishedGoods,
  getFinishedGoodById,
  getFilterOptions,
} from "../services/finishedGoods.service.js";


export async function index(req, res, next) {
  try {
    const { data, total } = await listFinishedGoods(req.query);
    const { page, limit } = req.query;

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


export async function show(req, res, next) {
  try {
    const item = await getFinishedGoodById(req.params.id);
    if (!item) {
      return res.status(404).json({
        error: { message: `Finished good '${req.params.id}' not found`, code: "NOT_FOUND" },
      });
    }
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}


export async function getFilters(req, res, next) {
  try {
    const filters = await getFilterOptions();
    res.json({ data: filters });
  } catch (err) {
    next(err);
  }
}

