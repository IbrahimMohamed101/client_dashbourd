export interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_usage?: number;
  current_usage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface PromoCodesResponse {
  data: PromoCode[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}
