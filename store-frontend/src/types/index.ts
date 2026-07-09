export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  quantity: number;
  size: string;
  created_by: number | null;
}

export interface Transaction {
  id: number;
  product_id: number | null;
  cashier_id: number | null;
  product_name: string;
  size: string;
  price_at_sale: number;
  quantity: number;
  total: number;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}