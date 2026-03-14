// src/types.ts

// Product row from Supabase
export interface ProductType {
  id: string;          // Supabase UUID
  name: string;
  category: string;
  sub_category?: string;
  price: number;
  rating?: number;
  image: string;
}

// Cart item extends ProductType with quantity
export interface CartItemType extends ProductType {
  quantity: number;
}

// Order row
export interface OrderType {
  id: string;
  user_name: string;
  user_email: string;
  address: string;
  total_price: number;
  items: CartItemType[];
  status: string;
}

// User row from Supabase
export interface UserData {
  id: string;
  username: string;
  email: string;
  user_id: string;
  is_admin: boolean;
}

// Simplified user type for app logic
export type UserType = {
  id: string;
  name: string;
  email: string;
};