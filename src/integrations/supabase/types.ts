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
    PostgrestVersion: "14.1"
  }
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string | null
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string | null
          email_optional: boolean
          id: string
          invite_token: string | null
          linking_target_id: string | null
          oauth_client_state_id: string | null
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          referrer: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code?: string | null
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string | null
          email_optional?: boolean
          id: string
          invite_token?: string | null
          linking_target_id?: string | null
          oauth_client_state_id?: string | null
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          referrer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string | null
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string | null
          email_optional?: boolean
          id?: string
          invite_token?: string | null
          linking_target_id?: string | null
          oauth_client_state_id?: string | null
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          referrer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          last_webauthn_challenge_data: Json | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          approved_at: string | null
          authorization_code: string | null
          authorization_id: string
          client_id: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string
          expires_at: string
          id: string
          nonce: string | null
          redirect_uri: string
          resource: string | null
          response_type: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state: string | null
          status: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id: string
          client_id: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id: string
          nonce?: string | null
          redirect_uri: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id?: string
          client_id?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          redirect_uri?: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope?: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_client_states: {
        Row: {
          code_verifier: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Insert: {
          code_verifier?: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Update: {
          code_verifier?: string | null
          created_at?: string
          id?: string
          provider_type?: string
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          client_name: string | null
          client_secret_hash: string | null
          client_type: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri: string | null
          created_at: string
          deleted_at: string | null
          grant_types: string
          id: string
          logo_uri: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types: string
          id: string
          logo_uri?: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types?: string
          id?: string
          logo_uri?: string | null
          redirect_uris?: string
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method?: string
          updated_at?: string
        }
        Relationships: []
      }
      oauth_consents: {
        Row: {
          client_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          scopes: string
          user_id: string
        }
        Insert: {
          client_id: string
          granted_at?: string
          id: string
          revoked_at?: string | null
          scopes: string
          user_id: string
        }
        Update: {
          client_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown
          not_after: string | null
          oauth_client_id: string | null
          refresh_token_counter: number | null
          refresh_token_hmac_key: string | null
          refreshed_at: string | null
          scopes: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey"
            columns: ["oauth_client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          disabled: boolean | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disabled?: boolean | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disabled?: boolean | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: { Args: never; Returns: string }
      jwt: { Args: never; Returns: Json }
      role: { Args: never; Returns: string }
      uid: { Args: never; Returns: string }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired"
      oauth_client_type: "public" | "confidential"
      oauth_registration_type: "dynamic" | "manual"
      oauth_response_type: "code"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      companies: {
        Row: {
          combined_segment_revenue: string | null
          comments: string | null
          company_focus: string | null
          created_at: string | null
          ebitda_2021_usd_mn: number | null
          ebitda_2022_usd_mn: number | null
          ebitda_2023_usd_mn: number | null
          ebitda_2024_usd_mn: number | null
          ebitda_margin_2021: number | null
          ebitda_margin_2022: number | null
          ebitda_margin_2023: number | null
          ebitda_margin_2024: number | null
          entry_id: number | null
          ev_2024: number | null
          ev_ebitda_2024: number | null
          fx_assumed_forex_2021: number | null
          fx_assumed_forex_2022: number | null
          fx_assumed_forex_2023: number | null
          fx_assumed_forex_2024: number | null
          fx_currency: string | null
          fx_ebitda_above_10_l3y: string | null
          fx_forex_change_2021_2022: number | null
          fx_forex_change_2022_2023: number | null
          fx_forex_change_2023_2024: number | null
          fx_rationale: string | null
          fx_revenue_2021: number | null
          fx_revenue_2022: number | null
          fx_revenue_2023: number | null
          fx_revenue_2024: number | null
          fx_revenue_cagr_domestic_2021_2022: number | null
          fx_revenue_cagr_domestic_2022_2023: number | null
          fx_revenue_cagr_domestic_2023_2024: number | null
          fx_revenue_drop_count: number | null
          fx_revenue_no_consecutive_drop_local: string | null
          geography: string | null
          id: string
          l0_ebitda_2024_usd_mn: number | null
          l0_ev_2024_usd_mn: number | null
          l0_ev_ebitda_2024: number | null
          l0_ev_usd_mn: number | null
          l0_revenue_2024_usd_mn: number | null
          l1_ebitda_below_threshold_count: number | null
          l1_ev_below_threshold: string | null
          l1_priority_geo_flag: string | null
          l1_rationale: string | null
          l1_revenue_cagr_l3y: number | null
          l1_revenue_cagr_n3y: number | null
          l1_revenue_drop_count: number | null
          l1_revenue_no_consecutive_drop_usd: string | null
          l1_screening_result: string | null
          l1_vision_fit: string | null
          ownership: string | null
          pct_from_domestic: number | null
          pipeline_stage: string | null
          remarks: string | null
          revenue_2021_usd_mn: number | null
          revenue_2022_usd_mn: number | null
          revenue_2023_usd_mn: number | null
          revenue_2024_usd_mn: number | null
          revenue_cagr_2021_2022: number | null
          revenue_cagr_2022_2023: number | null
          revenue_cagr_2023_2024: number | null
          revenue_from_priority_geo_flag: string | null
          segment: string | null
          segment_ebitda: number | null
          segment_related_offerings: string | null
          segment_revenue: number | null
          segment_revenue_total_ratio: number | null
          segment_specific_revenue_pct: number | null
          source: string | null
          status: string | null
          target: string | null
          thesis_content: string | null
          updated_at: string | null
          watchlist_id: number | null
          watchlist_status: string | null
          website: string | null
        }
        Insert: {
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          created_at?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          id?: string
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          pipeline_stage?: string | null
          remarks?: string | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          source?: string | null
          status?: string | null
          target?: string | null
          thesis_content?: string | null
          updated_at?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
        }
        Update: {
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          created_at?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          id?: string
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          pipeline_stage?: string | null
          remarks?: string | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          source?: string | null
          status?: string | null
          target?: string | null
          thesis_content?: string | null
          updated_at?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_analyses: {
        Row: {
          business_model_summary: string | null
          business_overview: string | null
          company_id: string
          created_at: string | null
          diligence_priorities: string | null
          error_message: string | null
          id: string
          investment_highlights: string | null
          investment_risks: string | null
          job_id: string | null
          key_takeaways: string | null
          sources: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          business_model_summary?: string | null
          business_overview?: string | null
          company_id: string
          created_at?: string | null
          diligence_priorities?: string | null
          error_message?: string | null
          id?: string
          investment_highlights?: string | null
          investment_risks?: string | null
          job_id?: string | null
          key_takeaways?: string | null
          sources?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          business_model_summary?: string | null
          business_overview?: string | null
          company_id?: string
          created_at?: string | null
          diligence_priorities?: string | null
          error_message?: string | null
          id?: string
          investment_highlights?: string | null
          investment_risks?: string | null
          job_id?: string | null
          key_takeaways?: string | null
          sources?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      company_slides: {
        Row: {
          id: string
          company_id: string
          title: string
          html: string
          sort_order: number
          job_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title?: string
          html?: string
          sort_order?: number
          job_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          html?: string
          sort_order?: number
          job_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_slides_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_slides_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      company_criterias: {
        Row: {
          company_id: string
          created_at: string | null
          criteria_id: string
          id: string
          result: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          criteria_id: string
          id?: string
          result?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          criteria_id?: string
          id?: string
          result?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_criterias_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_criterias_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "criterias"
            referencedColumns: ["id"]
          },
        ]
      }
      company_logs: {
        Row: {
          action: string
          combined_segment_revenue: string | null
          comments: string | null
          company_focus: string | null
          company_id: string | null
          created_at: string | null
          ebitda_2021_usd_mn: number | null
          ebitda_2022_usd_mn: number | null
          ebitda_2023_usd_mn: number | null
          ebitda_2024_usd_mn: number | null
          ebitda_margin_2021: number | null
          ebitda_margin_2022: number | null
          ebitda_margin_2023: number | null
          ebitda_margin_2024: number | null
          entry_id: number | null
          ev_2024: number | null
          ev_ebitda_2024: number | null
          fx_assumed_forex_2021: number | null
          fx_assumed_forex_2022: number | null
          fx_assumed_forex_2023: number | null
          fx_assumed_forex_2024: number | null
          fx_currency: string | null
          fx_ebitda_above_10_l3y: string | null
          fx_forex_change_2021_2022: number | null
          fx_forex_change_2022_2023: number | null
          fx_forex_change_2023_2024: number | null
          fx_rationale: string | null
          fx_revenue_2021: number | null
          fx_revenue_2022: number | null
          fx_revenue_2023: number | null
          fx_revenue_2024: number | null
          fx_revenue_cagr_domestic_2021_2022: number | null
          fx_revenue_cagr_domestic_2022_2023: number | null
          fx_revenue_cagr_domestic_2023_2024: number | null
          fx_revenue_drop_count: number | null
          fx_revenue_no_consecutive_drop_local: string | null
          geography: string | null
          id: string
          l0_ebitda_2024_usd_mn: number | null
          l0_ev_2024_usd_mn: number | null
          l0_ev_ebitda_2024: number | null
          l0_ev_usd_mn: number | null
          l0_revenue_2024_usd_mn: number | null
          l1_ebitda_below_threshold_count: number | null
          l1_ev_below_threshold: string | null
          l1_priority_geo_flag: string | null
          l1_rationale: string | null
          l1_revenue_cagr_l3y: number | null
          l1_revenue_cagr_n3y: number | null
          l1_revenue_drop_count: number | null
          l1_revenue_no_consecutive_drop_usd: string | null
          l1_screening_result: string | null
          l1_vision_fit: string | null
          ownership: string | null
          pct_from_domestic: number | null
          revenue_2021_usd_mn: number | null
          revenue_2022_usd_mn: number | null
          revenue_2023_usd_mn: number | null
          revenue_2024_usd_mn: number | null
          revenue_cagr_2021_2022: number | null
          revenue_cagr_2022_2023: number | null
          revenue_cagr_2023_2024: number | null
          revenue_from_priority_geo_flag: string | null
          segment: string | null
          segment_ebitda: number | null
          segment_related_offerings: string | null
          segment_revenue: number | null
          segment_revenue_total_ratio: number | null
          segment_specific_revenue_pct: number | null
          target: string | null
          user_id: string | null
          watchlist_id: number | null
          watchlist_status: string | null
          website: string | null
        }
        Insert: {
          action: string
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          company_id?: string | null
          created_at?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          id?: string
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          target?: string | null
          user_id?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
        }
        Update: {
          action?: string
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          company_id?: string | null
          created_at?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          id?: string
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          target?: string | null
          user_id?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      criterias: {
        Row: {
          created_at: string | null
          id: string
          name: string
          prompt: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          prompt: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          prompt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deal_documents: {
        Row: {
          created_at: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          stage: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          stage: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_links: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          stage: string
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          stage: string
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          id?: string
          stage?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_links_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_notes: {
        Row: {
          content: string
          created_at: string | null
          deal_id: string
          id: string
          stage: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deal_id: string
          id?: string
          stage: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deal_id?: string
          id?: string
          stage?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_history: {
        Row: {
          created_at: string | null
          deal_id: string
          duration_seconds: number | null
          entered_at: string | null
          exited_at: string | null
          id: string
          stage: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          duration_seconds?: number | null
          entered_at?: string | null
          exited_at?: string | null
          id?: string
          stage: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          duration_seconds?: number | null
          entered_at?: string | null
          exited_at?: string | null
          id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          file_date: string | null
          file_link: string
          file_name: string
          file_type: string
          id: string
          matched_companies: Json | null
          processing_status: string | null
          raw_notes: string | null
          structured_notes: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_date?: string | null
          file_link: string
          file_name: string
          file_type?: string
          id?: string
          matched_companies?: Json | null
          processing_status?: string | null
          raw_notes?: string | null
          structured_notes?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_date?: string | null
          file_link?: string
          file_name?: string
          file_type?: string
          id?: string
          matched_companies?: Json | null
          processing_status?: string | null
          raw_notes?: string | null
          structured_notes?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inven_cache: {
        Row: {
          combined_segment_revenue: string | null
          comments: string | null
          company_focus: string | null
          created_at: string | null
          description: string | null
          domain: string | null
          ebitda_2021_usd_mn: number | null
          ebitda_2022_usd_mn: number | null
          ebitda_2023_usd_mn: number | null
          ebitda_2024_usd_mn: number | null
          ebitda_margin_2021: number | null
          ebitda_margin_2022: number | null
          ebitda_margin_2023: number | null
          ebitda_margin_2024: number | null
          employee_count: number | null
          entry_id: number | null
          ev_2024: number | null
          ev_ebitda_2024: number | null
          founded_year: number | null
          fx_assumed_forex_2021: number | null
          fx_assumed_forex_2022: number | null
          fx_assumed_forex_2023: number | null
          fx_assumed_forex_2024: number | null
          fx_currency: string | null
          fx_ebitda_above_10_l3y: string | null
          fx_forex_change_2021_2022: number | null
          fx_forex_change_2022_2023: number | null
          fx_forex_change_2023_2024: number | null
          fx_rationale: string | null
          fx_revenue_2021: number | null
          fx_revenue_2022: number | null
          fx_revenue_2023: number | null
          fx_revenue_2024: number | null
          fx_revenue_cagr_domestic_2021_2022: number | null
          fx_revenue_cagr_domestic_2022_2023: number | null
          fx_revenue_cagr_domestic_2023_2024: number | null
          fx_revenue_drop_count: number | null
          fx_revenue_no_consecutive_drop_local: string | null
          geography: string | null
          headcount_max: number | null
          headcount_min: number | null
          headquarters_city: string | null
          headquarters_country_code: string | null
          headquarters_state: string | null
          id: string | null
          inven_company_id: string
          inven_company_name: string | null
          l0_ebitda_2024_usd_mn: number | null
          l0_ev_2024_usd_mn: number | null
          l0_ev_ebitda_2024: number | null
          l0_ev_usd_mn: number | null
          l0_revenue_2024_usd_mn: number | null
          l1_ebitda_below_threshold_count: number | null
          l1_ev_below_threshold: string | null
          l1_priority_geo_flag: string | null
          l1_rationale: string | null
          l1_revenue_cagr_l3y: number | null
          l1_revenue_cagr_n3y: number | null
          l1_revenue_drop_count: number | null
          l1_revenue_no_consecutive_drop_usd: string | null
          l1_screening_result: string | null
          l1_vision_fit: string | null
          linkedin: string | null
          logo_url: string | null
          ownership: string | null
          pct_from_domestic: number | null
          pipeline_stage: string | null
          revenue_2021_usd_mn: number | null
          revenue_2022_usd_mn: number | null
          revenue_2023_usd_mn: number | null
          revenue_2024_usd_mn: number | null
          revenue_cagr_2021_2022: number | null
          revenue_cagr_2022_2023: number | null
          revenue_cagr_2023_2024: number | null
          revenue_estimate_usd_millions: number | null
          revenue_from_priority_geo_flag: string | null
          segment: string | null
          segment_ebitda: number | null
          segment_related_offerings: string | null
          segment_revenue: number | null
          segment_revenue_total_ratio: number | null
          segment_specific_revenue_pct: number | null
          target: string | null
          updated_at: string | null
          watchlist_id: number | null
          watchlist_status: string | null
          website: string | null
        }
        Insert: {
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          employee_count?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          founded_year?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          headcount_max?: number | null
          headcount_min?: number | null
          headquarters_city?: string | null
          headquarters_country_code?: string | null
          headquarters_state?: string | null
          id?: string | null
          inven_company_id: string
          inven_company_name?: string | null
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          linkedin?: string | null
          logo_url?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          pipeline_stage?: string | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_estimate_usd_millions?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          target?: string | null
          updated_at?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
        }
        Update: {
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          employee_count?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          founded_year?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          headcount_max?: number | null
          headcount_min?: number | null
          headquarters_city?: string | null
          headquarters_country_code?: string | null
          headquarters_state?: string | null
          id?: string | null
          inven_company_id?: string
          inven_company_name?: string | null
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          linkedin?: string | null
          logo_url?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          pipeline_stage?: string | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_estimate_usd_millions?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          target?: string | null
          updated_at?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      investment_thesis: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_scan_at: string | null
          next_scan_at: string | null
          scan_frequency: string | null
          sources_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scan_at?: string | null
          next_scan_at?: string | null
          scan_frequency?: string | null
          sources_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scan_at?: string | null
          next_scan_at?: string | null
          scan_frequency?: string | null
          sources_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_logs: {
        Row: {
          created_at: string
          from_status: Database["public"]["Enums"]["job_status"] | null
          id: string
          job_id: string
          message: string | null
          metadata: Json | null
          to_status: Database["public"]["Enums"]["job_status"]
        }
        Insert: {
          created_at?: string
          from_status?: Database["public"]["Enums"]["job_status"] | null
          id?: string
          job_id: string
          message?: string | null
          metadata?: Json | null
          to_status: Database["public"]["Enums"]["job_status"]
        }
        Update: {
          created_at?: string
          from_status?: Database["public"]["Enums"]["job_status"] | null
          id?: string
          job_id?: string
          message?: string | null
          metadata?: Json | null
          to_status?: Database["public"]["Enums"]["job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          payload: Json
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          timeout_seconds: number
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          timeout_seconds?: number
          type: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          timeout_seconds?: number
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Relationships: []
      }
      past_acquisitions: {
        Row: {
          assumption: string | null
          cagr_2021_2022: string | null
          cagr_2022_2023: string | null
          cagr_2023_2024: string | null
          comments: string | null
          company_website: string | null
          country: string | null
          created_at: string | null
          description: string | null
          details_on_product_fit: string | null
          ebitda_2021_usd_m: string | null
          ebitda_2022_usd_m: string | null
          ebitda_2023_usd_m: string | null
          ebitda_2024_usd_m: string | null
          ebitda_margin_2021: string | null
          ebitda_margin_2022: string | null
          ebitda_margin_2023: string | null
          ebitda_margin_2024: string | null
          ebitda_margin_pct: string | null
          ebitda_over_10pct_l3y: string | null
          ebitda_usd_m: string | null
          equity_value: string | null
          estimated_debt_usd_m: string | null
          ev_100_pct_usd_m: string | null
          ev_2024: string | null
          ev_value_under_1b: string | null
          fcf_conv: string | null
          fit_with_priority_product_groups: string | null
          geography_breakdown_of_revenue: string | null
          id: string
          internal_source: string | null
          internal_stage: string | null
          investment_value: string | null
          l0_date: string | null
          main_products: string | null
          name_of_advisors: string | null
          net_income_usd_m: string | null
          nim_pct: string | null
          no: string | null
          notes: string | null
          on_hold_reason: string | null
          pass_all_5_l1_criteria: string | null
          pass_l0_screening: string | null
          pct_revenue_from_priority_segments: string | null
          prioritization: string | null
          priority_geography_50pct_revenue: string | null
          project_name: string | null
          project_type: string | null
          reason_to_drop: string | null
          revenue_2021_usd_m: string | null
          revenue_2022_usd_m: string | null
          revenue_2023_usd_m: string | null
          revenue_2024_usd_m: string | null
          revenue_cagr_l3y: string | null
          revenue_drop_count: string | null
          revenue_stability_no_consecutive_drop: string | null
          revenue_usd_m: string | null
          sector: string | null
          seller: string | null
          source: string | null
          stake: string | null
          status: string | null
          target_co_company_type: string | null
          target_co_partner: string | null
          type_of_source: string | null
          updated_at: string | null
          vision_alignment_25pct_revenue: string | null
          willingness_to_sell: string | null
          year: string | null
        }
        Insert: {
          assumption?: string | null
          cagr_2021_2022?: string | null
          cagr_2022_2023?: string | null
          cagr_2023_2024?: string | null
          comments?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          details_on_product_fit?: string | null
          ebitda_2021_usd_m?: string | null
          ebitda_2022_usd_m?: string | null
          ebitda_2023_usd_m?: string | null
          ebitda_2024_usd_m?: string | null
          ebitda_margin_2021?: string | null
          ebitda_margin_2022?: string | null
          ebitda_margin_2023?: string | null
          ebitda_margin_2024?: string | null
          ebitda_margin_pct?: string | null
          ebitda_over_10pct_l3y?: string | null
          ebitda_usd_m?: string | null
          equity_value?: string | null
          estimated_debt_usd_m?: string | null
          ev_100_pct_usd_m?: string | null
          ev_2024?: string | null
          ev_value_under_1b?: string | null
          fcf_conv?: string | null
          fit_with_priority_product_groups?: string | null
          geography_breakdown_of_revenue?: string | null
          id?: string
          internal_source?: string | null
          internal_stage?: string | null
          investment_value?: string | null
          l0_date?: string | null
          main_products?: string | null
          name_of_advisors?: string | null
          net_income_usd_m?: string | null
          nim_pct?: string | null
          no?: string | null
          notes?: string | null
          on_hold_reason?: string | null
          pass_all_5_l1_criteria?: string | null
          pass_l0_screening?: string | null
          pct_revenue_from_priority_segments?: string | null
          prioritization?: string | null
          priority_geography_50pct_revenue?: string | null
          project_name?: string | null
          project_type?: string | null
          reason_to_drop?: string | null
          revenue_2021_usd_m?: string | null
          revenue_2022_usd_m?: string | null
          revenue_2023_usd_m?: string | null
          revenue_2024_usd_m?: string | null
          revenue_cagr_l3y?: string | null
          revenue_drop_count?: string | null
          revenue_stability_no_consecutive_drop?: string | null
          revenue_usd_m?: string | null
          sector?: string | null
          seller?: string | null
          source?: string | null
          stake?: string | null
          status?: string | null
          target_co_company_type?: string | null
          target_co_partner?: string | null
          type_of_source?: string | null
          updated_at?: string | null
          vision_alignment_25pct_revenue?: string | null
          willingness_to_sell?: string | null
          year?: string | null
        }
        Update: {
          assumption?: string | null
          cagr_2021_2022?: string | null
          cagr_2022_2023?: string | null
          cagr_2023_2024?: string | null
          comments?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          details_on_product_fit?: string | null
          ebitda_2021_usd_m?: string | null
          ebitda_2022_usd_m?: string | null
          ebitda_2023_usd_m?: string | null
          ebitda_2024_usd_m?: string | null
          ebitda_margin_2021?: string | null
          ebitda_margin_2022?: string | null
          ebitda_margin_2023?: string | null
          ebitda_margin_2024?: string | null
          ebitda_margin_pct?: string | null
          ebitda_over_10pct_l3y?: string | null
          ebitda_usd_m?: string | null
          equity_value?: string | null
          estimated_debt_usd_m?: string | null
          ev_100_pct_usd_m?: string | null
          ev_2024?: string | null
          ev_value_under_1b?: string | null
          fcf_conv?: string | null
          fit_with_priority_product_groups?: string | null
          geography_breakdown_of_revenue?: string | null
          id?: string
          internal_source?: string | null
          internal_stage?: string | null
          investment_value?: string | null
          l0_date?: string | null
          main_products?: string | null
          name_of_advisors?: string | null
          net_income_usd_m?: string | null
          nim_pct?: string | null
          no?: string | null
          notes?: string | null
          on_hold_reason?: string | null
          pass_all_5_l1_criteria?: string | null
          pass_l0_screening?: string | null
          pct_revenue_from_priority_segments?: string | null
          prioritization?: string | null
          priority_geography_50pct_revenue?: string | null
          project_name?: string | null
          project_type?: string | null
          reason_to_drop?: string | null
          revenue_2021_usd_m?: string | null
          revenue_2022_usd_m?: string | null
          revenue_2023_usd_m?: string | null
          revenue_2024_usd_m?: string | null
          revenue_cagr_l3y?: string | null
          revenue_drop_count?: string | null
          revenue_stability_no_consecutive_drop?: string | null
          revenue_usd_m?: string | null
          sector?: string | null
          seller?: string | null
          source?: string | null
          stake?: string | null
          status?: string | null
          target_co_company_type?: string | null
          target_co_partner?: string | null
          type_of_source?: string | null
          updated_at?: string | null
          vision_alignment_25pct_revenue?: string | null
          willingness_to_sell?: string | null
          year?: string | null
        }
        Relationships: []
      }
      screenings: {
        Row: {
          company_id: string
          created_at: string | null
          criteria_id: string
          id: string
          job_id: string | null
          remarks: string | null
          result: string | null
          state: Database["public"]["Enums"]["screening_state"]
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          criteria_id: string
          id?: string
          job_id?: string | null
          remarks?: string | null
          result?: string | null
          state?: Database["public"]["Enums"]["screening_state"]
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          criteria_id?: string
          id?: string
          job_id?: string | null
          remarks?: string | null
          result?: string | null
          state?: Database["public"]["Enums"]["screening_state"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screenings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenings_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "criterias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          favorite_companies: string[] | null
          id: string
          name: string
          password: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          favorite_companies?: string[] | null
          id?: string
          name: string
          password: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          favorite_companies?: string[] | null
          id?: string
          name?: string
          password?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      job_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "timed_out"
      job_type:
        | "slide_generation"
        | "market_screening"
        | "ai_screening"
        | "company_analysis"
      screening_state: "pending" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  public: {
    Enums: {
      screening_state: ["pending", "completed", "failed"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
