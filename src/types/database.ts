export type UserRole = 'operations' | 'chef_agence' | 'regional' | 'super_admin';
export type WarehouseType = 'centre_tri' | 'agence' | 'desk';

export interface Database {
  public: {
    Tables: {
      warehouses: {
        Row: {
          id: string;
          code: string;
          name: string;
          type: WarehouseType | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          type?: WarehouseType;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          type?: WarehouseType;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_warehouses: {
        Row: {
          user_id: string;
          warehouse_id: string;
        };
        Insert: {
          user_id: string;
          warehouse_id: string;
        };
        Update: {
          user_id?: string;
          warehouse_id?: string;
        };
      };
      boxes: {
        Row: {
          id: string;
          name: string;
          quota: number;
          warehouse_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          quota?: number;
          warehouse_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          quota?: number;
          warehouse_id?: string;
          created_at?: string;
        };
      };
      parcels: {
        Row: {
          id: string;
          tracking: string;
          boutique: string;
          box_id: string;
          warehouse_id: string;
          created_at: string;
          wilaya_destinataire: string | null;
          commune: string | null;
          id_vendeur: string | null;
          bureau_destinataire: string | null;
          sd_hd: number | null;
          centre_retour: string | null;
          phone_client: string | null;
          is_missing: boolean;
          missing_reported_at: string | null;
        };
        Insert: {
          id?: string;
          tracking: string;
          boutique: string;
          box_id: string;
          warehouse_id: string;
          created_at?: string;
          wilaya_destinataire?: string;
          commune?: string;
          id_vendeur?: string;
          bureau_destinataire?: string;
          sd_hd?: number;
          centre_retour?: string;
          phone_client?: string;
          is_missing?: boolean;
          missing_reported_at?: string;
        };
        Update: {
          id?: string;
          tracking?: string;
          boutique?: string;
          box_id?: string;
          warehouse_id?: string;
          created_at?: string;
          wilaya_destinataire?: string;
          commune?: string;
          id_vendeur?: string;
          bureau_destinataire?: string;
          sd_hd?: number;
          centre_retour?: string;
          phone_client?: string;
          is_missing?: boolean;
          missing_reported_at?: string;
        };
      };
      archived_parcels: {
        Row: {
          id: string;
          tracking: string;
          boutique: string;
          box_name: string;
          warehouse_id: string;
          created_at: string;
          archived_at: string;
        };
        Insert: {
          id?: string;
          tracking: string;
          boutique: string;
          box_name: string;
          warehouse_id: string;
          created_at: string;
          archived_at?: string;
        };
        Update: {
          id?: string;
          tracking?: string;
          boutique?: string;
          box_name?: string;
          warehouse_id?: string;
          created_at?: string;
          archived_at?: string;
        };
      };
    };
  };
}

export type Warehouse = Database['public']['Tables']['warehouses']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserWarehouse = Database['public']['Tables']['user_warehouses']['Row'];
export type Box = Database['public']['Tables']['boxes']['Row'];
export type Parcel = Database['public']['Tables']['parcels']['Row'];
export type ArchivedParcel = Database['public']['Tables']['archived_parcels']['Row'];
