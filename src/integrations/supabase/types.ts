export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          display_order: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          organization_id: string | null
          start_date: string | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          organization_id?: string | null
          start_date?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          organization_id?: string | null
          start_date?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_stock: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          organization_id: string
          product_id: string
          quantity: number
          section: string | null
          shelf: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          organization_id: string
          product_id: string
          quantity?: number
          section?: string | null
          shelf?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          product_id?: string
          quantity?: number
          section?: string | null
          shelf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_stock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          name_ar: string | null
          organization_id: string | null
          phone: string | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          name_ar?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          name_ar?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_bank_accounts: {
        Row: {
          account_holder_name: string | null
          account_number: string
          bank_name: string | null
          contact_id: string | null
          created_at: string | null
          iban: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          swift_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number: string
          bank_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string
          bank_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_bank_accounts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tag_assignments: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          tag_id: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          tag_id?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_tag_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "contact_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          city: string | null
          company_registry: string | null
          contact_type: Database["public"]["Enums"]["contact_type"] | null
          country: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_company: boolean | null
          is_customer: boolean | null
          is_vendor: boolean | null
          job_position: string | null
          mobile: string | null
          name: string
          notes: string | null
          organization_id: string | null
          parent_id: string | null
          phone: string | null
          state: string | null
          street: string | null
          street2: string | null
          tax_id: string | null
          title: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          company_registry?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"] | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_company?: boolean | null
          is_customer?: boolean | null
          is_vendor?: boolean | null
          job_position?: string | null
          mobile?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          parent_id?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          street2?: string | null
          tax_id?: string | null
          title?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          company_registry?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"] | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_company?: boolean | null
          is_customer?: boolean | null
          is_vendor?: boolean | null
          job_position?: string | null
          mobile?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          parent_id?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          street2?: string | null
          tax_id?: string | null
          title?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_companies: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_ar: string | null
          organization_id: string | null
          phone: string | null
          tracking_url_template: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_ar?: string | null
          organization_id?: string | null
          phone?: string | null
          tracking_url_template?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          organization_id?: string | null
          phone?: string | null
          tracking_url_template?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_external: boolean | null
          license_number: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_number: string | null
          vehicle_type: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          license_number?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          license_number?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          organization_id: string | null
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          organization_id?: string | null
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          organization_id?: string | null
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_leave_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_work_hours: {
        Row: {
          break_minutes: number | null
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          organization_id: string | null
          total_hours: number | null
          updated_at: string | null
          work_date: string
        }
        Insert: {
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          total_hours?: number | null
          updated_at?: string | null
          work_date: string
        }
        Update: {
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          total_hours?: number | null
          updated_at?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_work_hours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      field_permissions: {
        Row: {
          can_read: boolean | null
          can_write: boolean | null
          created_at: string | null
          field_name: string
          group_id: string
          id: string
          module_name: string
        }
        Insert: {
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          field_name: string
          group_id: string
          id?: string
          module_name: string
        }
        Update: {
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          field_name?: string
          group_id?: string
          id?: string
          module_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          message: string
          name: string
          organization_id: string | null
          phone: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          message: string
          name: string
          organization_id?: string | null
          phone?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          organization_id?: string | null
          phone?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          aisle: string | null
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_parent: boolean | null
          location_type: Database["public"]["Enums"]["location_type"] | null
          name: string
          organization_id: string | null
          parent_id: string | null
          rack: string | null
          shelf: string | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          aisle?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_parent?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          name: string
          organization_id?: string | null
          parent_id?: string | null
          rack?: string | null
          shelf?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          aisle?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_parent?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          name?: string
          organization_id?: string | null
          parent_id?: string | null
          rack?: string | null
          shelf?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_numbers: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          lot_number: string
          manufacture_date: string | null
          notes: string | null
          organization_id: string | null
          product_id: string | null
          serial_number: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          lot_number: string
          manufacture_date?: string | null
          notes?: string | null
          organization_id?: string | null
          product_id?: string | null
          serial_number?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          lot_number?: string
          manufacture_date?: string | null
          notes?: string | null
          organization_id?: string | null
          product_id?: string | null
          serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lot_numbers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_numbers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean | null
          organization_id: string | null
          parent_id: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          organization_id?: string | null
          parent_id?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          organization_id?: string | null
          parent_id?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string | null
          group_id: string
          id: string
          module_name: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          group_id: string
          id?: string
          module_name: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          group_id?: string
          id?: string
          module_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_approvals: {
        Row: {
          action: string
          approved_by: string
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
        }
        Insert: {
          action: string
          approved_by: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
        }
        Update: {
          action?: string
          approved_by?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_approvals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          code: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      portal_users: {
        Row: {
          billing_address: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          phone: string | null
          shipping_address: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          organization_id: string
          phone?: string | null
          shipping_address?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          phone?: string | null
          shipping_address?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_order_lines: {
        Row: {
          created_at: string | null
          discount_percent: number | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_orders: {
        Row: {
          created_at: string | null
          created_by: string
          customer_id: string | null
          id: string
          order_number: string
          organization_id: string
          session_id: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          customer_id?: string | null
          id?: string
          order_number: string
          organization_id: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          customer_id?: string | null
          id?: string
          order_number?: string
          organization_id?: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_id: string
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_id: string
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          closing_balance: number | null
          created_at: string | null
          end_time: string | null
          id: string
          opening_balance: number | null
          organization_id: string
          session_number: string
          start_time: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closing_balance?: number | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          opening_balance?: number | null
          organization_id: string
          session_number: string
          start_time?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closing_balance?: number | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          opening_balance?: number | null
          organization_id?: string
          session_number?: string
          start_time?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expiry_tracking: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location_x: number | null
          location_y: number | null
          lot_tracking: boolean | null
          name: string
          organization_id: string | null
          product_type: Database["public"]["Enums"]["product_type"] | null
          reorder_point: number | null
          reorder_quantity: number | null
          sales_price: number | null
          sku: string
          tracking_enabled: boolean | null
          uom: Database["public"]["Enums"]["uom_type"] | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiry_tracking?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location_x?: number | null
          location_y?: number | null
          lot_tracking?: boolean | null
          name: string
          organization_id?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          sales_price?: number | null
          sku: string
          tracking_enabled?: boolean | null
          uom?: Database["public"]["Enums"]["uom_type"] | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiry_tracking?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location_x?: number | null
          location_y?: number | null
          lot_tracking?: boolean | null
          name?: string
          organization_id?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          sales_price?: number | null
          sku?: string
          tracking_enabled?: boolean | null
          uom?: Database["public"]["Enums"]["uom_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          branch: string | null
          branch_id: string | null
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          is_on_leave: boolean | null
          leave_end: string | null
          leave_reason: string | null
          leave_start: string | null
          organization_id: string | null
          phone: string | null
          position: string | null
          rejection_reason: string | null
          salary: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          branch?: string | null
          branch_id?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          hire_date?: string | null
          id: string
          is_active?: boolean | null
          is_on_leave?: boolean | null
          leave_end?: string | null
          leave_reason?: string | null
          leave_start?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          rejection_reason?: string | null
          salary?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          branch?: string | null
          branch_id?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_on_leave?: boolean | null
          leave_end?: string | null
          leave_reason?: string | null
          leave_start?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          rejection_reason?: string | null
          salary?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          created_at: string
          destination_location_id: string | null
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          destination_location_id?: string | null
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          destination_location_id?: string | null
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          organization_id: string
          status: Database["public"]["Enums"]["purchase_order_status"]
          total_amount: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          organization_id: string
          status?: Database["public"]["Enums"]["purchase_order_status"]
          total_amount?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["purchase_order_status"]
          total_amount?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_lines: {
        Row: {
          created_at: string | null
          discount_percent: number | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank_transfer_reference: string | null
          billing_address: string | null
          building: string | null
          city: string | null
          country: string | null
          created_at: string
          customer_id: string | null
          delivery_company_id: string | null
          delivery_driver_id: string | null
          estimated_delivery_date: string | null
          father_name: string | null
          first_name: string | null
          floor: string | null
          grandfather_name: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          last_name: string | null
          notes: string | null
          order_number: string
          organization_id: string
          payment_method: string | null
          payment_status: string | null
          portal_user_id: string | null
          postal_code: string | null
          rejection_reason: string | null
          shipping_address: string | null
          status: string
          street: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_transfer_reference?: string | null
          billing_address?: string | null
          building?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_company_id?: string | null
          delivery_driver_id?: string | null
          estimated_delivery_date?: string | null
          father_name?: string | null
          first_name?: string | null
          floor?: string | null
          grandfather_name?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          order_number: string
          organization_id: string
          payment_method?: string | null
          payment_status?: string | null
          portal_user_id?: string | null
          postal_code?: string | null
          rejection_reason?: string | null
          shipping_address?: string | null
          status?: string
          street?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_transfer_reference?: string | null
          billing_address?: string | null
          building?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_company_id?: string | null
          delivery_driver_id?: string | null
          estimated_delivery_date?: string | null
          father_name?: string | null
          first_name?: string | null
          floor?: string | null
          grandfather_name?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          order_number?: string
          organization_id?: string
          payment_method?: string | null
          payment_status?: string | null
          portal_user_id?: string | null
          postal_code?: string | null
          rejection_reason?: string | null
          shipping_address?: string | null
          status?: string
          street?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_orders_delivery_company"
            columns: ["delivery_company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_delivery_driver_id_fkey"
            columns: ["delivery_driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          banner_image: string | null
          created_at: string | null
          font_size: string | null
          id: string
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          show_prices: boolean | null
          show_stock: boolean | null
          updated_at: string | null
          welcome_text: string | null
          welcome_text_ar: string | null
        }
        Insert: {
          banner_image?: string | null
          created_at?: string | null
          font_size?: string | null
          id?: string
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          show_prices?: boolean | null
          show_stock?: boolean | null
          updated_at?: string | null
          welcome_text?: string | null
          welcome_text_ar?: string | null
        }
        Update: {
          banner_image?: string | null
          created_at?: string | null
          font_size?: string | null
          id?: string
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          show_prices?: boolean | null
          show_stock?: boolean | null
          updated_at?: string | null
          welcome_text?: string | null
          welcome_text_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_moves: {
        Row: {
          created_at: string | null
          created_by: string | null
          destination_location_id: string | null
          id: string
          lot_id: string | null
          move_type: Database["public"]["Enums"]["move_type"]
          notes: string | null
          organization_id: string | null
          product_id: string | null
          quantity: number
          reference: string | null
          source_location_id: string | null
          total_cost: number | null
          unit_cost: number | null
          uom: Database["public"]["Enums"]["uom_type"] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          destination_location_id?: string | null
          id?: string
          lot_id?: string | null
          move_type: Database["public"]["Enums"]["move_type"]
          notes?: string | null
          organization_id?: string | null
          product_id?: string | null
          quantity: number
          reference?: string | null
          source_location_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          uom?: Database["public"]["Enums"]["uom_type"] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          destination_location_id?: string | null
          id?: string
          lot_id?: string | null
          move_type?: Database["public"]["Enums"]["move_type"]
          notes?: string | null
          organization_id?: string | null
          product_id?: string | null
          quantity?: number
          reference?: string | null
          source_location_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          uom?: Database["public"]["Enums"]["uom_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_moves_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lot_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_quants: {
        Row: {
          id: string
          location_id: string | null
          lot_id: string | null
          organization_id: string | null
          product_id: string | null
          quantity: number | null
          reserved_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          location_id?: string | null
          lot_id?: string | null
          organization_id?: string | null
          product_id?: string | null
          quantity?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          location_id?: string | null
          lot_id?: string | null
          organization_id?: string | null
          product_id?: string | null
          quantity?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_quants_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_quants_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lot_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_quants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_quants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access_groups: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_access_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_pricelists: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          is_active: boolean | null
          min_quantity: number | null
          organization_id: string
          product_id: string
          unit_price: number
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          min_quantity?: number | null
          organization_id: string
          product_id: string
          unit_price: number
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          min_quantity?: number | null
          organization_id?: string
          product_id?: string
          unit_price?: number
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_pricelists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_pricelists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_pricelists_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_sales_order_line: {
        Args: { _order_id: string }
        Returns: boolean
      }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_finance_access: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "viewer"
      contact_type: "contact" | "invoice" | "delivery" | "other" | "private"
      location_type:
        | "view"
        | "internal"
        | "customer"
        | "vendor"
        | "transit"
        | "inventory"
      move_type:
        | "in"
        | "out"
        | "transfer"
        | "adjustment"
        | "purchase"
        | "sale"
        | "return"
      payment_method_type: "cash" | "card" | "bank_transfer" | "mobile_payment"
      product_type: "storable" | "consumable" | "service"
      purchase_order_status:
        | "draft"
        | "confirmed"
        | "received"
        | "cancelled"
        | "rfq"
        | "po"
        | "receiving"
      uom_type:
        | "unit"
        | "kg"
        | "g"
        | "lbs"
        | "oz"
        | "liter"
        | "m"
        | "cm"
        | "ft"
        | "dozen"
        | "pack"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "staff", "viewer"],
      contact_type: ["contact", "invoice", "delivery", "other", "private"],
      location_type: [
        "view",
        "internal",
        "customer",
        "vendor",
        "transit",
        "inventory",
      ],
      move_type: [
        "in",
        "out",
        "transfer",
        "adjustment",
        "purchase",
        "sale",
        "return",
      ],
      payment_method_type: ["cash", "card", "bank_transfer", "mobile_payment"],
      product_type: ["storable", "consumable", "service"],
      purchase_order_status: [
        "draft",
        "confirmed",
        "received",
        "cancelled",
        "rfq",
        "po",
        "receiving",
      ],
      uom_type: [
        "unit",
        "kg",
        "g",
        "lbs",
        "oz",
        "liter",
        "m",
        "cm",
        "ft",
        "dozen",
        "pack",
      ],
    },
  },
} as const
