
import { z } from "zod";


const positiveInt = (field) =>
  z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : undefined))
    .pipe(
      z
        .number()
        .int()
        .positive(`${field} must be a positive integer`)
        .optional()
    );

const optionalString = z.string().trim().optional();

const sortOrder = z.enum(["asc", "desc"]).optional().default("asc");


export const finishedGoodsQuerySchema = z.object({
  category:   optionalString,
  fabric:     optionalString,
  color:      optionalString,
  print:      optionalString,
  season:     optionalString,
  supplier:   optionalString,  
  buyer:      optionalString,  
  gsm_min:    positiveInt("gsm_min"),
  gsm_max:    positiveInt("gsm_max"),
  page:       positiveInt("page").pipe(z.number().int().positive().optional().default(1)),
  limit:      positiveInt("limit").pipe(z.number().int().min(1).max(200).optional().default(20)),
  sort_by: z
    .enum([
      "style_number", "style_name", "category", "fabric", "gsm",
      "color", "season", "cost", "selling_price", "created_at",
    ])
    .optional()
    .default("created_at"),
  sort_order: sortOrder,
});


export const paginationSchema = z.object({
  page:  positiveInt("page").pipe(z.number().int().positive().optional().default(1)),
  limit: positiveInt("limit").pipe(z.number().int().min(1).max(200).optional().default(20)),
});


export const salesOrdersQuerySchema = paginationSchema.extend({
  status:   optionalString,
  buyer_id: optionalString,
  sort_by:  z
    .enum(["order_number", "quantity", "unit_price", "shipment_date", "status", "created_at"])
    .optional()
    .default("created_at"),
  sort_order: sortOrder,
});


export const salesInvoicesQuerySchema = paginationSchema.extend({
  payment_status: optionalString,
  currency:       optionalString,
  sort_by: z
    .enum(["invoice_number", "amount", "currency", "payment_status", "created_at"])
    .optional()
    .default("created_at"),
  sort_order: sortOrder,
});


export const searchTextQuerySchema = z.object({
  q:        optionalString.default(""),
  category: optionalString,
  fabric:   optionalString,
  color:    optionalString,
  page:     positiveInt("page").pipe(z.number().int().positive().optional().default(1)),
  limit:    positiveInt("limit").pipe(z.number().int().min(1).max(200).optional().default(20)),
});

