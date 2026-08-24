export type CustomerTier = 'bronce' | 'plata' | 'oro' | 'diamante';

export interface CustomerAddress {
  id: string;
  alias: string; // 'Casa', 'Apartamento', 'Oficina'
  formatted_address: string;
  city: string;
  lat?: number;
  lng?: number;
  delivery_notes?: string;
  is_default: boolean;
}

export interface CustomerProfile {
  id: string;
  user_id?: string | null;
  phone: string;
  full_name: string;
  document?: string | null;
  email?: string | null;
  addresses: CustomerAddress[];
  referral_code: string;
  referred_by_code?: string | null;
  total_points: number;
  tier: CustomerTier;
  avatar_url?: string | null;
  birthday?: string | null;
  lead_temperature: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending_confirmation'
  | 'in_production'
  | 'ready_for_dispatch'
  | 'scheduled_for_dispatch'
  | 'in_transit'
  | 'delivered'
  | 'delayed'
  | 'pickup_at_store';

export interface OrderItem {
  id: string;
  sku: string;
  referencia: string;
  cantidad: number;
  linea_item?: string; // 'MADERA' | 'TAPICERIA'
  estado_item?: 'fab' | 'ok' | 'na';
  proyeccion?: string;
  tipo_pata?: string;
  image_url?: string;
}

export interface DriverInfo {
  name: string;
  phone: string;
  vehicle_plate: string;
  vehicle_model: string;
  photo_url: string;
  rating: number;
  current_location?: {
    lat: number;
    lng: number;
  };
}

export interface CustomerOrder {
  id: string;
  numero_pedido: string;
  opv?: string | null;
  tipo_pedido?: string | null;
  tienda?: string | null;
  ruta?: string | null;
  linea?: string | null;
  cliente_nombre: string;
  cliente_documento?: string | null;
  cliente_telefonos: string[];
  destino?: string | null;
  direccion?: string | null;
  asesor?: string | null;
  fecha_creacion?: string | null;
  fecha_entrega_prom?: string | null;
  fecha_entrega_real?: string | null;
  promesa?: string | null;
  programacion_despacho?: string | null;
  estado_pago?: string | null;
  fecha_pago?: string | null;
  documento_pago?: string | null;
  total_amount?: number;
  paid_amount?: number;
  cx_status: OrderStatus;
  eta_texto?: string;
  items: OrderItem[];
  driver?: DriverInfo;
  is_confirmed_by_customer?: boolean;
  invoice_url?: string;
}

export interface PointsLedgerItem {
  id: string;
  customer_id: string;
  points_change: number;
  reason: 'purchase' | 'review' | 'ugc_photo' | 'referral' | 'profile_completion' | 'redemption' | 'birthday' | 'bonus';
  order_id?: string | null;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface UgcSubmission {
  id: string;
  customer_id: string;
  order_id?: string | null;
  media_url: string;
  caption?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  points_awarded: number;
  created_at: string;
}

export interface OrderReview {
  id: string;
  customer_id: string;
  order_id: string;
  rating: number; // 1-5
  review_text?: string;
  points_awarded: number;
  created_at: string;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  discount_value: string;
  image_url: string;
  category: 'bono' | 'accesorio' | 'servicio';
}
